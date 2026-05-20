import type { AdminRole, Permission } from '@/types/admin';

const RBAC: Record<AdminRole, Permission[]> = {
  super_admin: [
    'view_clubs', 'change_plan', 'suspend_club', 'extend_trial',
    'toggle_modules', 'view_audit_logs', 'manage_admin_users',
    'view_analytics', 'impersonate', 'delete_club',
  ],
  comercial: ['view_clubs', 'change_plan', 'extend_trial', 'view_analytics'],
  soporte: ['view_clubs', 'suspend_club', 'extend_trial', 'view_audit_logs', 'impersonate'],
  finanzas: ['view_clubs', 'view_analytics'],
  ops: ['view_clubs', 'suspend_club', 'toggle_modules', 'view_audit_logs'],
};

export function canAccess(role: AdminRole, permission: Permission): boolean {
  return RBAC[role]?.includes(permission) ?? false;
}

export function getPermissions(role: AdminRole): Permission[] {
  return RBAC[role] ?? [];
}
