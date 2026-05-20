import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { canAccess } from '@/lib/rbac';
import { AdminUsersPanel } from '@/components/settings/AdminUsersPanel';

export default async function SettingsUsersPage() {
  const session = await getAdminSession();
  if (!session) redirect('/login');
  if (!canAccess(session.role, 'manage_admin_users')) redirect('/dashboard');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Administradores</h2>
        <p className="text-sm text-gray-500 mt-1">
          Gestiona quién tiene acceso al panel y con qué permisos
        </p>
      </div>
      <AdminUsersPanel currentUserId={session.id} />
    </div>
  );
}
