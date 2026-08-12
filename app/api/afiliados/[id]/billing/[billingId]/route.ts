import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { writeAuditLog } from '@/lib/audit';
import { canAccess } from '@/lib/rbac';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; billingId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'manage_billing')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, billingId } = await params;
  const body = await req.json();
  const { monto, periodo, metodo, referencia, notas } = body;

  const { data: existing } = await adminDb
    .from('afiliados_billing')
    .select('*')
    .eq('id', billingId)
    .eq('afiliado_id', id)
    .maybeSingle();
  if (!existing) return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });

  const fields: Record<string, unknown> = {};
  if (monto !== undefined) fields.monto = Number(monto);
  if (periodo !== undefined) fields.periodo = periodo;
  if (metodo !== undefined) fields.metodo = metodo;
  if (referencia !== undefined) fields.referencia = referencia || null;
  if (notas !== undefined) fields.notas = notas || null;

  const { data, error } = await adminDb
    .from('afiliados_billing')
    .update(fields)
    .eq('id', billingId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    admin_id: session.id,
    admin_email: session.email,
    action: 'AFILIADO_BILLING_EDITED',
    entity_type: 'afiliado',
    entity_id: id,
    details: { billing_id: billingId, before: existing, after: fields },
  });

  return NextResponse.json({ record: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; billingId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'manage_billing')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, billingId } = await params;

  const { data: existing } = await adminDb
    .from('afiliados_billing')
    .select('*')
    .eq('id', billingId)
    .eq('afiliado_id', id)
    .maybeSingle();
  if (!existing) return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });

  const { error } = await adminDb.from('afiliados_billing').delete().eq('id', billingId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    admin_id: session.id,
    admin_email: session.email,
    action: 'AFILIADO_BILLING_DELETED',
    entity_type: 'afiliado',
    entity_id: id,
    details: { billing_id: billingId, deleted: existing },
  });

  return NextResponse.json({ ok: true });
}
