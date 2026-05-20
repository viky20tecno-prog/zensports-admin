import { getAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { adminDb } from '@/lib/supabase-admin';
import { PLAN_PRICE, formatCOP } from '@/lib/utils';
import { getClubStatus } from '@/lib/health-score';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { MrrChart } from '@/components/dashboard/MrrChart';
import { GrowthChart } from '@/components/dashboard/GrowthChart';
import { RecentActivityList } from '@/components/dashboard/RecentActivityList';

async function getDashboardData() {
  const [{ data: clubs }, { data: auditEntries }] = await Promise.all([
    adminDb.from('clubs').select('slug, is_active, created_at, config').order('created_at', { ascending: true }),
    adminDb.from('audit_logs').select('id, admin_email, action, entity_id, created_at').order('created_at', { ascending: false }).limit(10),
  ]);

  let active = 0, trial = 0, mrr = 0;
  (clubs || []).forEach(club => {
    const status = getClubStatus(club as never);
    if (status === 'active') { active++; mrr += PLAN_PRICE[club.config?.plan || ''] || 0; }
    else if (status === 'trial') trial++;
  });

  const arr = mrr * 12;

  const now = new Date();
  const growth = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthStr = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' });
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString();

    const newClubs = (clubs || []).filter(c => c.created_at?.startsWith(monthStr)).length;
    const mrrSnapshot = (clubs || [])
      .filter(c => c.created_at <= endOfMonth && c.config?.plan && c.config.plan !== 'trial')
      .reduce((sum, c) => sum + (PLAN_PRICE[c.config.plan] || 0), 0);

    return { month: label, clubs: newClubs, mrr: mrrSnapshot };
  });

  return {
    active,
    trial,
    mrr,
    arr,
    total: (clubs || []).length,
    growth,
    auditEntries: auditEntries || [],
  };
}

export default async function DashboardPage() {
  const session = await getAdminSession();
  if (!session) redirect('/login');

  const { active, trial, mrr, arr, total, growth, auditEntries } = await getDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Hola, {session.name} 👋</h2>
        <p className="text-sm text-gray-500 mt-1">Panel operativo de ZenSports — vista general del negocio</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Clubes Activos" value={active} color="green" sub={`de ${total} en total`} />
        <KpiCard label="En Trial" value={trial} color="yellow" sub="pendientes de conversión" />
        <KpiCard label="MRR" value={mrr} color="indigo" prefix="$" suffix="" animate={false}
          sub={formatCOP(mrr) + ' / mes'} />
        <KpiCard label="ARR" value={arr} color="indigo" prefix="$" suffix="" animate={false}
          sub={formatCOP(arr) + ' / año'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MrrChart data={growth} />
        <GrowthChart data={growth} />
      </div>

      <RecentActivityList entries={auditEntries} />
    </div>
  );
}
