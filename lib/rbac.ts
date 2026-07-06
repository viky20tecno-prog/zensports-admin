import type { AdminRole, Permission } from '@/types/admin';

const RBAC: Record<AdminRole, Permission[]> = {
  super_admin: [
    'view_clubs', 'change_plan', 'suspend_club', 'extend_trial',
    'toggle_modules', 'view_audit_logs', 'manage_admin_users',
    'view_analytics', 'impersonate', 'delete_club', 'reset_password', 'edit_club',
    'manage_billing', 'create_club', 'change_email',
  ],
  comercial: ['view_clubs', 'change_plan', 'extend_trial', 'view_analytics', 'edit_club', 'manage_billing', 'create_club'],
  // soporte NO tiene change_email: cambiar el email + resetear el password permitiría
  // tomar la cuenta del dueño del club sin que se entere. reset_password se queda,
  // pero change_email (más peligroso combinado con reset) sube a super_admin.
  soporte: ['view_clubs', 'suspend_club', 'extend_trial', 'view_audit_logs', 'impersonate', 'reset_password', 'edit_club'],
  finanzas: ['view_clubs', 'view_analytics', 'manage_billing'],
  ops: ['view_clubs', 'suspend_club', 'toggle_modules', 'view_audit_logs'],
};

export function canAccess(role: AdminRole, permission: Permission): boolean {
  return RBAC[role]?.includes(permission) ?? false;
}

export function getPermissions(role: AdminRole): Permission[] {
  return RBAC[role] ?? [];
}
