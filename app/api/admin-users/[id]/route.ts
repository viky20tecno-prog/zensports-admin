import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { canAccess } from '@/lib/rbac';
import { writeAuditLog } from '@/lib/audit';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'manage_admin_users')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  if (id === session.id) return NextResponse.json({ error: 'No puedes modificar tu propio usuario' }, { status: 400 });

  const body = await req.json() as { role?: string; is_active?: boolean };
  const update: Record<string, unknown> = {};
  if (body.role      !== undefined) update.role      = body.role;
  if (body.is_active !== undefined) update.is_active = body.is_active;

  const { error } = await adminDb.from('admin_users').update(update).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    admin_id: session.id, admin_email: session.email,
    action: 'ADMIN_USER_UPDATED', entity_type: 'admin_user', entity_id: id,
    after_state: update,
  });

  return NextResponse.json({ ok: true });
}
