import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { PLAN_PRICE } from '@/lib/utils';
import { getClubStatus, getTrialDaysLeft } from '@/lib/health-score';
import { canAccess } from '@/lib/rbac';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'view_analytics')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [{ data: clubs }, { data: pagos }, { data: players }, { data: billing }] = await Promise.all([
    adminDb.from('clubs').select('id, slug, is_active, created_at, config').order('created_at', { ascending: true }),
    adminDb.from('pagos').select('monto, created_at, club_id').eq('estado_revision', 'aprobado_manual'),
    adminDb.from('players').select('club_id, activo'),
    adminDb.from('admin_billing').select('monto, periodo, club_id'),
  ]);

  if (!clubs) return NextResponse.json({ error: 'No data' }, { status: 500 });

  // --- Status & plan counts ---
  let active = 0, trial = 0, suspended = 0, expired = 0, mrr = 0;
  const byPlan: Record<string, number> = {};

  // Funnel: trials con días en ese estado
  const now = new Date();
  const currentPeriodo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const atRiskClubs: { slug: string; nombre: string; days_in_trial: number; days_left: number }[] = [];

  clubs.forEach(club => {
    const status = getClubStatus(club as never);
    const plan = club.config?.plan || 'trial';
    byPlan[plan] = (byPlan[plan] || 0) + 1;
    if (status === 'active')    { active++;    mrr += (PLAN_PRICE as Record<string, number>)[plan] || 0; }
    else if (status === 'trial') {
      trial++;
      const daysLeft = getTrialDaysLeft(club.config?.trial_ends_at) ?? 0;
      const createdAt = new Date(club.created_at);
      const daysInTrial = Math.floor((now.getTime() - createdAt.getTime()) / 86400000);
      if (daysLeft <= 5) {
        atRiskClubs.push({
          slug: club.slug,
          nombre: club.config?.nombre || club.slug,
          days_in_trial: daysInTrial,
          days_left: Math.max(0, daysLeft),
        });
      }
    }
    else if (status === 'suspended') suspended++;
    else if (status === 'expired')   expired++;
  });

  atRiskClubs.sort((a, b) => a.days_left - b.days_left);

  const arr = mrr * 12;
  const total_clubs = clubs.length;
  const conversion_rate = (active + expired + trial) > 0
    ? Math.round(active / (active + expired + trial) * 100) : 0;

  // --- MRR real desde admin_billing (mes actual) ---
  const realMrrThisMonth = (billing || [])
    .filter(b => b.periodo === currentPeriodo)
    .reduce((s, b) => s + b.monto, 0);

  // Cuántos clubs activos pagaron este mes
  const clubsPaidThisMonth = new Set(
    (billing || []).filter(b => b.periodo === currentPeriodo).map(b => b.club_id)
  ).size;

  // Total histórico admin_billing
  const totalBillingRevenue = (billing || []).reduce((s, b) => s + b.monto, 0);

  // --- Last 6 months axis ---
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key:   d.toISOString().slice(0, 7),
      label: d.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' }),
    };
  });

  // Club growth per month
  const growthChart = months.map(m => ({
    mes:    m.label,
    clubes: clubs.filter(c => c.created_at?.startsWith(m.key)).length,
  }));

  // Revenue from pagos (player payments) per month
  const revenueByMonth: Record<string, number> = {};
  for (const p of pagos || []) {
    const key = p.created_at.substring(0, 7);
    revenueByMonth[key] = (revenueByMonth[key] || 0) + p.monto;
  }

  // Real MRR from admin_billing per month
  const billingByMonth: Record<string, number> = {};
  for (const b of billing || []) {
    billingByMonth[b.periodo] = (billingByMonth[b.periodo] || 0) + b.monto;
  }

  const revenueChart = months.map(m => ({
    mes:         m.label,
    ingreso:     revenueByMonth[m.key] || 0,
    mrrReal:     billingByMonth[m.key] || 0,
    mrrTeorico:  mrr,
  }));

  // Players
  const totalPlayers  = (players || []).length;
  const activePlayers = (players || []).filter(p => p.activo).length;
  const totalRevenue  = (pagos || []).reduce((s, p) => s + p.monto, 0);

  // Funnel stages
  const funnel = [
    { stage: 'Total clubes',  count: total_clubs,          color: '#6B7280' },
    { stage: 'En trial',      count: trial,                color: '#F59E0B' },
    { stage: 'Activos',       count: active,               color: '#10B981' },
    { stage: 'Pagaron hoy',   count: clubsPaidThisMonth,   color: '#6366F1' },
  ];

  // By plan for donut
  const planChart = Object.entries(byPlan).map(([plan, count]) => ({ plan, count }));

  return NextResponse.json({
    mrr, arr, active, trial, suspended, expired, total_clubs, conversion_rate,
    totalPlayers, activePlayers, totalRevenue,
    realMrrThisMonth, clubsPaidThisMonth, totalBillingRevenue,
    growthChart, revenueChart, planChart,
    funnel, atRiskClubs,
  });
}
