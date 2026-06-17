import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { canAccess } from '@/lib/rbac';
import { AnalyticsTabs } from '@/components/analytics/AnalyticsTabs';

export default async function AnalyticsPage() {
  const session = await getAdminSession();
  if (!session) redirect('/login');
  if (!canAccess(session.role, 'view_analytics')) redirect('/dashboard');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Analytics</h2>
        <p className="text-sm text-gray-500 mt-1">Métricas del negocio y del bot WhatsApp en tiempo real</p>
      </div>
      <AnalyticsTabs />
    </div>
  );
}
