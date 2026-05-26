'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Building2, BarChart3, ScrollText,
  Settings, ShieldCheck, UserPlus, X, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminRole } from '@/types/admin';
import { canAccess } from '@/lib/rbac';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  color: string;
  glow: string;
  permission?: Parameters<typeof canAccess>[1];
}

const NAV: NavItem[] = [
  { label: 'Dashboard',       href: '/dashboard',      icon: LayoutDashboard, color: 'text-violet-400',  glow: 'bg-violet-500/10 border-violet-500/20' },
  { label: 'Clubes',          href: '/clubs',          icon: Building2,       color: 'text-indigo-400',  glow: 'bg-indigo-500/10 border-indigo-500/20',  permission: 'view_clubs' },
  { label: 'Leads',           href: '/leads',          icon: UserPlus,        color: 'text-emerald-400', glow: 'bg-emerald-500/10 border-emerald-500/20', permission: 'view_clubs' },
  { label: 'Analytics',       href: '/analytics',      icon: BarChart3,       color: 'text-cyan-400',    glow: 'bg-cyan-500/10 border-cyan-500/20',       permission: 'view_analytics' },
  { label: 'Audit Logs',      href: '/audit-logs',     icon: ScrollText,      color: 'text-amber-400',   glow: 'bg-amber-500/10 border-amber-500/20',     permission: 'view_audit_logs' },
  { label: 'Administradores', href: '/settings/users', icon: Settings,        color: 'text-rose-400',    glow: 'bg-rose-500/10 border-rose-500/20',       permission: 'manage_admin_users' },
];

interface SidebarProps {
  role: AdminRole;
  name: string;
  onClose?: () => void;
}

export function Sidebar({ role, name, onClose }: SidebarProps) {
  const pathname = usePathname();

  const visible = NAV.filter(item =>
    !item.permission || canAccess(role, item.permission)
  );

  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <aside className="w-[220px] h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #07090F 0%, #0A0D18 100%)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

      {/* Glow top */}
      <div className="absolute top-0 left-0 w-full h-32 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />

      {/* Brand */}
      <div className="relative px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {onClose && (
          <button onClick={onClose} className="lg:hidden absolute top-4 right-4 p-1 text-gray-500 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center relative"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}>
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold leading-none"
              style={{ background: 'linear-gradient(90deg, #a5b4fc, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ZenSports
            </div>
            <div className="text-[10px] text-gray-600 mt-0.5 font-medium tracking-wide uppercase">Admin Console</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 relative">
        {visible.map(item => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer group border',
                active
                  ? `${item.glow} ${item.color}`
                  : 'text-gray-500 hover:text-gray-200 hover:bg-white/5 border-transparent'
              )}>
                <div className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all',
                  active ? `${item.glow}` : 'bg-white/3 group-hover:bg-white/8'
                )}>
                  <Icon className={cn('w-3.5 h-3.5', active ? item.color : 'text-gray-600 group-hover:text-gray-300')} />
                </div>
                <span className="font-medium tracking-tight">{item.label}</span>
                {active && (
                  <div className={cn('ml-auto w-1.5 h-1.5 rounded-full', item.color.replace('text-', 'bg-'))} />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="relative px-4 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white/3 border border-white/6">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 12px rgba(99,102,241,0.3)' }}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-white truncate">{name}</div>
            <div className="text-[10px] text-gray-500 capitalize">{role.replace('_', ' ')}</div>
          </div>
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400/60 shrink-0" />
        </div>
      </div>
    </aside>
  );
}
