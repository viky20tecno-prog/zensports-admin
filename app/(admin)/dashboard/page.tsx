import { getAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { adminDb } from '@/lib/supabase-admin';
import { PLAN_PRICE, formatCOP } from '@/lib/utils';
import { getClubStatus } from '@/lib/health-score';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { MrrChart } from '@/components/dashboard/MrrChart';
import { GrowthChart } from '@/components/dashboard/GrowthChart';
import { RecentActivityList } from '@/components/dashboard/RecentActivityList';
import { TrialManager, type TrialClub } from '@/components/dashboard/TrialManager';
import { PlansMrrTable, type PlanStat } from '@/components/dashboard/PlansMrrTable';

async function getDashboardData() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
  const sixtyDaysAgo  = new Date(now.getTime() - 60 * 86400000).toISOString();
  const startOfMonth  = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [{ data: clubs }, { data: auditEntries }, { data: upgradeEvents }] = await Promise.all([
    adminDb
      .from('clubs')
      .select('slug, is_active, created_at, config')
      .order('created_at', { ascending: true }),
    adminDb
      .from('audit_logs')
      .select('id, admin_email, action, entity_id, created_at')
      .order('created_at', { ascending: false })
      .limit(30),
    adminDb
      .from('audit_logs')
      .select('entity_id, before_state, after_state, created_at')
      .eq('action', 'CLUB_PLAN_CHANGED')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false }),
  ]);

  // ── Core KPIs ──────────────────────────────────────────────────────────────
  let active = 0, trial = 0, mrr = 0;
  let trialsLast30 = 0, trialsPrev30 = 0;
  let newMrrMonth = 0, churnLast30 = 0;

  const allTrials: TrialClub[] = [];
  const planCounts: Record<string, PlanStat> = {
    trial:   { plan: 'trial',   clubs: 0, mrr: 0 },
    starter: { plan: 'starter', clubs: 0, mrr: 0 },
    pro:     { plan: 'pro',     clubs: 0, mrr: 0 },
    scale:   { plan: 'scale',   clubs: 0, mrr: 0 },
  };

  const nowTs = Date.now();

  (clubs || []).forEach(club => {
    const status    = getClubStatus(club as never);
    const plan      = club.config?.plan as string || 'trial';
    const createdAt = club.created_at as string;
    const trialEndsAt = club.config?.trial_ends_at as string | undefined;

    if (status === 'active') {
      active++;
      const planMrr = PLAN_PRICE[plan] || 0;
      mrr += planMrr;
      if (!planCounts[plan]) planCounts[plan] = { plan, clubs: 0, mrr: 0 };
      planCounts[plan].clubs++;
      planCounts[plan].mrr += planMrr;
      if (createdAt >= startOfMonth) newMrrMonth += planMrr;

    } else if (status === 'trial') {
      trial++;
      planCounts.trial.clubs++;
      if (createdAt >= thirtyDaysAgo) trialsLast30++;
      else if (createdAt >= sixtyDaysAgo) trialsPrev30++;

      const daysLeft = trialEndsAt
        ? Math.ceil((new Date(trialEndsAt).getTime() - nowTs) / 86400000)
        : null;

      allTrials.push({
        slug:          club.slug as string,
        nombre:        (club.config?.nombre as string) || (club.slug as string),
        whatsapp:      (club.config?.whatsapp as string) || (club.config?.celular_admin as string) || null,
        trial_ends_at: trialEndsAt || null,
        days_left:     daysLeft !== null ? Math.max(0, daysLeft) : null,
        created_at:    createdAt,
        contactado:    club.config?.trial_contacted === true,
      });

    } else if (status === 'expired') {
      planCounts.trial.clubs++;
      if (trialEndsAt && trialEndsAt >= thirtyDaysAgo) churnLast30++;
    }
  });

  const arr = mrr * 12;

  // ── Conversion rate ────────────────────────────────────────────────────────
  const totalResolved = active + churnLast30;
  const conversionPct = totalResolved > 0
    ? Math.round((active / ((clubs || []).length)) * 100)
    : 0;

  // ── Trial trend ────────────────────────────────────────────────────────────
  const trialTrend = trialsPrev30 > 0
    ? Math.round(((trialsLast30 - trialsPrev30) / trialsPrev30) * 100)
    : null;

  // ── Upgrade metrics from audit logs ───────────────────────────────────────
  let upgradeStarterPro = 0, upgradeProScale = 0;
  (upgradeEvents || []).forEach(ev => {
    const from = (ev.before_state as Record<string, string> | null)?.plan;
    const to   = (ev.after_state  as Record<string, string> | null)?.plan;
    if (from === 'starter' && to === 'pro') upgradeStarterPro++;
    if (from === 'pro' && (to === 'scale' || to === 'total')) upgradeProScale++;
  });

  // ── Trial manager buckets ─────────────────────────────────────────────────
  const trialsExpiringSoon = allTrials.filter(t => t.days_left !== null && t.days_left <= 5);
  const trialsInProgress   = allTrials.filter(t => t.days_left !== null && t.days_left > 5);

  const expiredAlerts = (clubs || [])
    .filter(c => getClubStatus(c as never) === 'expired')
    .map(c => {
      const trialEndsAt = c.config?.trial_ends_at as string | undefined;
      return {
        slug:          c.slug as string,
        nombre:        (c.config?.nombre as string) || (c.slug as string),
        whatsapp:      (c.config?.whatsapp as string) || (c.config?.celular_admin as string) || null,
        trial_ends_at: trialEndsAt || null,
        days_left:     null,
        created_at:    c.created_at as string,
        contactado:    c.config?.trial_contacted === true,
      };
    });

  // ── Growth chart ──────────────────────────────────────────────────────────
  const growth = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthStr   = d.toISOString().slice(0, 7);
    const label      = d.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' });
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString();
    const newClubs   = (clubs || []).filter(c => (c.created_at as string)?.startsWith(monthStr)).length;
    const mrrSnapshot = (clubs || [])
      .filter(c => (c.created_at as string) <= endOfMonth && c.config?.plan && c.config.plan !== 'trial')
      .reduce((sum, c) => sum + (PLAN_PRICE[c.config.plan as string] || 0), 0);
    return { month: label, clubs: newClubs, mrr: mrrSnapshot };
  });

  return {
    active, trial, mrr, arr,
    trialsLast30, trialTrend,
    conversionPct,
    newMrrMonth,
    churnLast30,
    trialsInProgress,
    trialsExpiringSoon,
    expiredAlerts,
    planStats: Object.values(planCounts),
    upgradeStarterPro,
    upgradeProScale,
    total: (clubs || []).length,
    growth,
    auditEntries: auditEntries || [],
  };
}

export default async function DashboardPage() {
  const session = await getAdminSession();
  if (!session) redirect('/login');

  const {
    active, trial, mrr, arr,
    trialsLast30, trialTrend,
    conversionPct,
    newMrrMonth,
    churnLast30,
    trialsInProgress,
    trialsExpiringSoon,
    expiredAlerts,
    planStats,
    upgradeStarterPro,
    upgradeProScale,
    total,
    growth,
    auditEntries,
  } = await getDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Hola, {session.name} 👋</h2>
        <p className="text-sm text-gray-500 mt-1">Torre de control ZenSports — embudo, conversión y MRR en un vistazo</p>
      </div>

      {/* ── Row 1: Core metrics ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Clubes Activos" value={active} color="green" sub={`de ${total} en total`} />
        <KpiCard label="En Trial"       value={trial}  color="yellow" sub="pendientes de conversión" />
        <KpiCard label="MRR"   value={mrr} color="indigo" prefix="$" suffix="" animate={false}
          sub={formatCOP(mrr) + ' / mes'} />
        <KpiCard label="ARR"   value={arr} color="indigo" prefix="$" suffix="" animate={false}
          sub={formatCOP(arr) + ' / año'} />
      </div>

      {/* ── Row 2: Growth KPIs ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Trials (30d)"
          value={trialsLast30}
          color="yellow"
          sub="nuevos últimos 30 días"
          trend={trialTrend}
        />
        <KpiCard
          label="Conversión Trial→Pago"
          value={`${conversionPct}%`}
          color="green"
          sub="clubes activos / total"
          animate={false}
        />
        <KpiCard
          label="MRR Nuevo (mes)"
          value={newMrrMonth}
          color="indigo"
          prefix="$"
          suffix=""
          animate={false}
          sub={newMrrMonth > 0 ? formatCOP(newMrrMonth) + ' este mes' : 'Sin nuevos planes este mes'}
        />
        <KpiCard
          label="Churn (30d)"
          value={churnLast30}
          color={churnLast30 > 0 ? 'red' : 'green'}
          sub="trials expirados sin convertir"
        />
      </div>

      {/* ── Charts ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MrrChart data={growth} />
        <GrowthChart data={growth} />
      </div>

      {/* ── Planes y MRR + Trial Manager ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PlansMrrTable
          plans={planStats}
          upgradeStarterPro={upgradeStarterPro}
          upgradeProScale={upgradeProScale}
        />
        <TrialManager
          inProgress={trialsInProgress}
          expiringSoon={trialsExpiringSoon}
          expired={expiredAlerts}
        />
      </div>

      {/* ── Activity ────────────────────────────────────────────────────────── */}
      <RecentActivityList entries={auditEntries} />
    </div>
  );
}
