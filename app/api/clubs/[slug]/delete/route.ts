import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { writeAuditLog } from '@/lib/audit';
import { canAccess } from '@/lib/rbac';

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'delete_club')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { slug } = await params;

  const { data: club, error: fetchErr } = await adminDb
    .from('clubs').select('id, name, config').eq('slug', slug).single();
  if (fetchErr || !club) return NextResponse.json({ error: 'Club not found' }, { status: 404 });

  await writeAuditLog({
    admin_id: session.id, admin_email: session.email,
    action: 'CLUB_SUSPENDED', entity_type: 'club', entity_id: slug,
    before_state: { nombre: club.config?.nombre, plan: club.config?.plan },
    after_state: { deleted: true },
    metadata: { action_detail: 'permanent_delete' },
  });

  const { error } = await adminDb.from('clubs').delete().eq('slug', slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
