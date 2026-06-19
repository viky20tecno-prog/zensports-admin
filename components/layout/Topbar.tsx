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

const ROLE_STYLES: Record<AdminRole, { bg: string; text: string; glow: string }> = {
  super_admin: { bg: 'rgba(106,0,255,0.14)',   text: '#AE68FF', glow: 'rgba(106,0,255,0.35)' },
  comercial:   { bg: 'rgba(16,185,129,0.12)',  text: '#6ee7b7', glow: 'rgba(16,185,129,0.3)' },
  soporte:     { bg: 'rgba(59,130,246,0.12)',  text: '#93c5fd', glow: 'rgba(59,130,246,0.3)' },
  finanzas:    { bg: 'rgba(245,158,11,0.12)',  text: '#fcd34d', glow: 'rgba(245,158,11,0.3)' },
  ops:         { bg: 'rgba(106,0,255,0.10)',   text: '#C084FF', glow: 'rgba(106,0,255,0.25)' },
};

interface TopbarProps {
  title: string;
  role: AdminRole;
  onMenuClick?: () => void;
}

export function Topbar({ title, role, onMenuClick }: TopbarProps) {
  const router = useRouter();
  const rs = ROLE_STYLES[role];

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <header className="h-14 flex items-center px-4 lg:px-6 gap-3 sticky top-0 z-30"
      style={{
        background: 'rgba(7,9,15,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 1px 0 rgba(106,0,255,0.10)',
      }}>

      {/* Hamburger móvil */}
      <button onClick={onMenuClick}
        className="lg:hidden w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition rounded-lg hover:bg-white/5">
        <Menu className="w-5 h-5" />
      </button>

      {/* Title */}
      <div className="flex items-center gap-2.5 flex-1">
        {/* Z isotipo */}
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 hidden sm:flex"
          style={{ background: 'linear-gradient(135deg, #6A00FF 0%, #AE68FF 100%)', boxShadow: '0 0 14px rgba(106,0,255,0.40)' }}>
          <svg viewBox="0 0 24 24" fill="none" style={{ width: 14, height: 14 }}>
            <path d="M5 7H19L5 17H19" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="text-sm font-semibold tracking-tight"
          style={{ fontFamily: "'Sport Event','Space Grotesk',sans-serif", fontSize: 16, letterSpacing: 2, background: 'linear-gradient(90deg, #EFFFFF, #AE68FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Role badge */}
        <span className="hidden sm:inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full border tracking-wide"
          style={{
            background: rs.bg,
            color: rs.text,
            borderColor: rs.glow,
            boxShadow: `0 0 12px ${rs.glow}`,
          }}>
          {ROLE_LABELS[role]}
        </span>

        {/* Notifications */}
        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-200 transition relative group"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ring-1 ring-[#07090F]" style={{ background: '#6A00FF' }} />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-white/8 mx-1" />

        {/* Logout */}
        <button onClick={handleLogout}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 transition group"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          title="Cerrar sesión">
          <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </header>
  );
}
