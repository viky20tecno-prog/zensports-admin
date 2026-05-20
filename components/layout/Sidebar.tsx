'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Building2, BarChart3, ScrollText,
  Settings, ShieldCheck, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminRole } from '@/types/admin';
import { canAccess } from '@/lib/rbac';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  permission?: Parameters<typeof canAccess>[1];
}

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Clubes', href: '/clubs', icon: Building2, permission: 'view_clubs' },
  { label: 'Analytics', href: '/analytics', icon: BarChart3, permission: 'view_analytics' },
  { label: 'Audit Logs', href: '/audit-logs', icon: ScrollText, permission: 'view_audit_logs' },
  { label: 'Configuración', href: '/settings', icon: Settings },
];

interface SidebarProps {
  role: AdminRole;
  name: string;
}

export function Sidebar({ role, name }: SidebarProps) {
  const pathname = usePathname();

  const visible = NAV.filter(item =>
    !item.permission || canAccess(role, item.permission)
  );

  return (
    <aside className="w-[220px] min-h-screen bg-[#0A0D14] border-r border-white/5 flex flex-col">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-none">ZenSports</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Admin Console</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visible.map(item => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors cursor-pointer group',
                  active
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/20'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-indigo-400' : 'text-gray-500 group-hover:text-gray-300')} />
                <span className="font-medium">{item.label}</span>
                {active && <ChevronRight className="w-3 h-3 ml-auto text-indigo-400/60" />}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300">
            {name[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-white truncate">{name}</div>
            <div className="text-[10px] text-gray-500 capitalize">{role.replace('_', ' ')}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
