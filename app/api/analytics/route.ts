import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { PLAN_PRICE } from '@/lib/utils';
import { getClubStatus } from '@/lib/health-score';
import { canAccess } from '@/lib/rbac';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'view_analytics')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [{ data: clubs }, { data: pagos }, { data: players }] = await Promise.all([
    adminDb.from('clubs').select('id, slug, is_active, created_at, config').order('created_at', { ascending: true }),
    adminDb.from('pagos').select('monto, created_at, club_id').eq('estado_revision', 'aprobado_manual'),
    adminDb.from('players').select('club_id, activo'),
  ]);

  if (!clubs) return NextResponse.json({ error: 'No data' }, { status: 500 });

  // --- Status & plan counts ---
  let active = 0, trial = 0, suspended = 0, expired = 0, mrr = 0;
  const byPlan: Record<string, number> = {};

  clubs.forEach(club => {
    const status = getClubStatus(club as never);
    const plan = club.config?.plan || 'trial';
    byPlan[plan] = (byPlan[plan] || 0) + 1;
    if (status === 'active') { active++; mrr += (PLAN_PRICE as Record<string, number>)[plan] || 0; }
    else if (status === 'trial')     trial++;
    else if (status === 'suspended') suspended++;
    else if (status === 'expired')   expired++;
  });

  const arr = mrr * 12;
  const total_clubs = clubs.length;
  const conversion_rate = (active + expired + trial) > 0
    ? Math.round(active / (active + expired + trial) * 100) : 0;

  // --- Last 6 months axis ---
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key:   d.toISOString().slice(0, 7),
      label: d.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' }),
      end:   new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString(),
    };
  });

  // Club growth per month
  const growthChart = months.map(m => ({
    mes:    m.label,
    clubes: clubs.filter(c => c.created_at?.startsWith(m.key)).length,
  }));

  // Revenue from pagos per month
  const revenueByMonth: Record<string, number> = {};
  for (const p of pagos || []) {
    const key = p.created_at.substring(0, 7);
    revenueByMonth[key] = (revenueByMonth[key] || 0) + p.monto;
  }
  const revenueChart = months.map(m => ({ mes: m.label, ingreso: revenueByMonth[m.key] || 0 }));

  // Players
  const totalPlayers  = (players || []).length;
  const activePlayers = (players || []).filter(p => p.activo).length;
  const totalRevenue  = (pagos || []).reduce((s, p) => s + p.monto, 0);

  // By plan for donut
  const planChart = Object.entries(byPlan).map(([plan, count]) => ({ plan, count }));

  return NextResponse.json({
    mrr, arr, active, trial, suspended, expired, total_clubs, conversion_rate,
    totalPlayers, activePlayers, totalRevenue,
    growthChart, revenueChart, planChart,
  });
}
