import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { writeAuditLog } from '@/lib/audit';
import { canAccess } from '@/lib/rbac';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'reset_password')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { slug } = await params;
  const { email: newEmail } = await req.json();

  if (!newEmail?.trim()) return NextResponse.json({ error: 'Email requerido' }, { status: 400 });

  const { data: club } = await adminDb.from('clubs').select('*').eq('slug', slug).maybeSingle();
  if (!club) return NextResponse.json({ error: 'Club no encontrado' }, { status: 404 });

  const { data: userData } = await adminDb.auth.admin.getUserById(club.owner_user_id);
  const oldEmail = userData?.user?.email;

  const { error } = await adminDb.auth.admin.updateUserById(club.owner_user_id, {
    email: newEmail.trim().toLowerCase(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    admin_email: session.email,
    action:      'CHANGE_EMAIL',
    entity_type: 'club',
    entity_id:   slug,
    details:     { old_email: oldEmail, new_email: newEmail.trim().toLowerCase() },
  });

  return NextResponse.json({ ok: true, email: newEmail.trim().toLowerCase() });
}
