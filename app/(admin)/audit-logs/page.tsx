import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { canAccess } from '@/lib/rbac';
import { AuditLogsTable } from '@/components/audit/AuditLogsTable';

export default async function AuditLogsPage() {
  const session = await getAdminSession();
  if (!session) redirect('/login');
  if (!canAccess(session.role, 'view_audit_logs')) redirect('/dashboard');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Audit Logs</h2>
        <p className="text-sm text-gray-500 mt-1">
          Historial completo de acciones realizadas por administradores
        </p>
      </div>
      <AuditLogsTable />
    </div>
  );
}
