import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  clubs: 'Gestión de Clubes',
  analytics: 'Analytics SaaS',
  'audit-logs': 'Audit Logs',
  settings: 'Configuración',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) redirect('/login');

  return (
    <div className="flex min-h-screen bg-[#080B12]">
      <Sidebar role={session.role} name={session.name} />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="ZenSports Admin" role={session.role} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
