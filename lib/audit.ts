import 'server-only';
import { adminDb } from './supabase-admin';

export type AuditAction =
  | 'CLUB_PLAN_CHANGED'
  | 'CLUB_TRIAL_EXTENDED'
  | 'CLUB_SUSPENDED'
  | 'CLUB_UNLOCKED'
  | 'CLUB_MODULES_UPDATED'
  | 'CLUB_IMPERSONATED'
  | 'ADMIN_USER_CREATED'
  | 'ADMIN_USER_UPDATED'
  | 'ADMIN_LOGIN'
  | 'DEMO_SEEDED'
  | 'PAYMENT_REMINDER_SENT'
  | 'RESET_PASSWORD_SENT'
  | 'CHANGE_EMAIL'
  | 'UPDATE_ADMIN_CONTACT'
  | 'CLUB_DELETED'
  | 'BILLING_RECORDED'
  | 'BILLING_EDITED'
  | 'BILLING_DELETED'
  | 'BOLD_LINK_CREATED'
  | 'IMPERSONATE'
  | 'STAFF_ADDED'
  | 'STAFF_REMOVED'
  | 'CLUB_CONFIG_EDITED';

interface WriteAuditLogParams {
  admin_id?: string;
  admin_email: string;
  admin_name?: string;
  admin_role?: string;
  action: AuditAction;
  entity_type: 'club' | 'admin_user';
  entity_id?: string;
  before_state?: Record<string, unknown> | null;
  after_state?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
  details?: Record<string, unknown>;
}

export async function writeAuditLog(params: WriteAuditLogParams): Promise<void> {
  const { error } = await adminDb.from('audit_logs').insert({
    admin_id: params.admin_id ?? null,
    admin_email: params.admin_email,
    action: params.action,
    entity_type: params.entity_type,
    entity_id: params.entity_id ?? null,
    before_state: params.before_state ?? null,
    after_state: params.after_state ?? null,
    metadata: params.metadata ?? params.details ?? null,
  });

  if (error) {
    console.error('[audit] Failed to write audit log:', error.message);
  }
}
