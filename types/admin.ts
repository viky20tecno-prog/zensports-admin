export type AdminRole = 'super_admin' | 'comercial' | 'soporte' | 'finanzas' | 'ops';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  created_by: string | null;
}

export interface AdminSession {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  iat: number;
  exp: number;
}

export type Permission =
  | 'view_clubs'
  | 'change_plan'
  | 'suspend_club'
  | 'extend_trial'
  | 'toggle_modules'
  | 'view_audit_logs'
  | 'manage_admin_users'
  | 'view_analytics'
  | 'impersonate'
  | 'delete_club'
  | 'reset_password'
  | 'edit_club';
