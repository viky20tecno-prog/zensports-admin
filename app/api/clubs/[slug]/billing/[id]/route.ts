import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { writeAuditLog } from '@/lib/audit';
import { canAccess } from '@/lib/rbac';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'manage_billing')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { slug, id } = await params;
  const body = await req.json();
  const { monto, periodo, metodo, referencia, notas } = body;

  const { data: club } = await adminDb.from('clubs').select('id').eq('slug', slug).maybeSingle();
  if (!club) return NextResponse.json({ error: 'Club no encontrado' }, { status: 404 });

  const { data: existing } = await adminDb.from('admin_billing').select('*').eq('id', id).eq('club_id', club.id).maybeSingle();
  if (!existing) return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });

  const fields: Record<string, unknown> = {};
  if (monto !== undefined) fields.monto = Number(monto);
  if (periodo !== undefined) fields.periodo = periodo;
  if (metodo !== undefined) fields.metodo = metodo;
  if (referencia !== undefined) fields.referencia = referencia || null;
  if (notas !== undefined) fields.notas = notas || null;

  const { data, error } = await adminDb
    .from('admin_billing')
    .update(fields)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    admin_id: session.id,
    admin_email: session.email,
    action: 'BILLING_EDITED',
    entity_type: 'club',
    entity_id: slug,
    details: { billing_id: id, before: existing, after: fields },
  });

  return NextResponse.json({ record: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'manage_billing')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { slug, id } = await params;

  const { data: club } = await adminDb.from('clubs').select('id').eq('slug', slug).maybeSingle();
  if (!club) return NextResponse.json({ error: 'Club no encontrado' }, { status: 404 });

  const { data: existing } = await adminDb.from('admin_billing').select('*').eq('id', id).eq('club_id', club.id).maybeSingle();
  if (!existing) return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });

  const { error } = await adminDb.from('admin_billing').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    admin_id: session.id,
    admin_email: session.email,
    action: 'BILLING_DELETED',
    entity_type: 'club',
    entity_id: slug,
    details: { billing_id: id, deleted: existing },
  });

  return NextResponse.json({ ok: true });
}
