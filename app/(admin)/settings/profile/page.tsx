import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { ChangePasswordForm } from '@/components/settings/ChangePasswordForm';

export default async function SettingsProfilePage() {
  const session = await getAdminSession();
  if (!session) redirect('/login');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Mi perfil</h2>
        <p className="text-sm text-gray-500 mt-1">{session.email}</p>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
