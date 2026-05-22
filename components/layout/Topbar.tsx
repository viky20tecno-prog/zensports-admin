'use client';
import { useRouter } from 'next/navigation';
import { LogOut, Bell, Menu } from 'lucide-react';
import type { AdminRole } from '@/types/admin';

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  comercial: 'Comercial',
  soporte: 'Soporte',
  finanzas: 'Finanzas',
  ops: 'Operaciones',
};

const ROLE_COLORS: Record<AdminRole, string> = {
  super_admin: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
  comercial: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  soporte: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
  finanzas: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  ops: 'bg-purple-500/15 text-purple-300 border-purple-500/25',
};

interface TopbarProps {
  title: string;
  role: AdminRole;
  onMenuClick?: () => void;
}

export function Topbar({ title, role, onMenuClick }: TopbarProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <header className="h-14 border-b border-white/5 bg-[#080B12]/80 backdrop-blur-sm flex items-center px-4 lg:px-6 gap-3 sticky top-0 z-30">
      {/* Hamburger — solo móvil */}
      <button
        onClick={onMenuClick}
        className="lg:hidden w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition"
      >
        <Menu className="w-5 h-5" />
      </button>
      <h1 className="text-sm font-semibold text-white flex-1 tracking-tight">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Role badge */}
        <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${ROLE_COLORS[role]}`}>
          {ROLE_LABELS[role]}
        </span>

        {/* Notifications placeholder */}
        <button className="w-8 h-8 rounded-lg border border-white/8 bg-white/3 flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-white/8 transition">
          <Bell className="w-4 h-4" />
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-8 h-8 rounded-lg border border-white/8 bg-white/3 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
