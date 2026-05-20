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
  | 'ADMIN_LOGIN';

interface WriteAuditLogParams {
  admin_id: string;
  admin_email: string;
  action: AuditAction;
  entity_type: 'club' | 'admin_user';
  entity_id?: string;
  before_state?: Record<string, unknown> | null;
  after_state?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
}

export async function writeAuditLog(params: WriteAuditLogParams): Promise<void> {
  const { error } = await adminDb.from('audit_logs').insert({
    admin_id: params.admin_id,
    admin_email: params.admin_email,
    action: params.action,
    entity_type: params.entity_type,
    entity_id: params.entity_id ?? null,
    before_state: params.before_state ?? null,
    after_state: params.after_state ?? null,
    metadata: params.metadata ?? null,
  });

  if (error) {
    console.error('[audit] Failed to write audit log:', error.message);
  }
}
