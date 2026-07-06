import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { writeAuditLog } from '@/lib/audit';
import { canAccess } from '@/lib/rbac';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'reset_password')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { slug } = await params;
  const body = await req.json() as { email?: string; celular_admin?: string };

  // Cambiar el email del owner es el paso previo a una toma de cuenta completa
  // (cambiar email + reset password = entrar como el club sin que se entere el owner).
  // Requiere permiso separado, más restrictivo que solo reset_password.
  if (body.email?.trim() && !canAccess(session.role, 'change_email')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: club } = await adminDb.from('clubs').select('id, owner_user_id, celular_admin').eq('slug', slug).maybeSingle();
  if (!club) return NextResponse.json({ error: 'Club no encontrado' }, { status: 404 });

  const updates: Record<string, unknown> = {};

  // Actualizar email del owner en Supabase Auth
  if (body.email?.trim()) {
    const newEmail = body.email.trim().toLowerCase();
    const { error } = await adminDb.auth.admin.updateUserById(club.owner_user_id, { email: newEmail });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    updates.email = newEmail;
  }

  // Actualizar celular_admin en la tabla clubs
  if (body.celular_admin !== undefined) {
    const celular = body.celular_admin.replace(/\D/g, '').replace(/^57/, '');
    const { error } = await adminDb.from('clubs').update({ celular_admin: celular }).eq('slug', slug);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    updates.celular_admin = celular;
  }

  await writeAuditLog({
    admin_id: session.id, admin_email: session.email,
    action: 'UPDATE_ADMIN_CONTACT', entity_type: 'club', entity_id: slug,
    after_state: updates,
  });

  return NextResponse.json({ ok: true, ...updates });
}
