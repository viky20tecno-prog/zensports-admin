import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { writeAuditLog } from '@/lib/audit';
import { canAccess } from '@/lib/rbac';

const TIERS_VALIDOS = ['bronce', 'plata', 'oro'];
const ESTADOS_VALIDOS = ['activo', 'pendiente_pago', 'inactivo', 'vencido'];
const STR_FIELDS = ['nombre', 'categoria', 'descripcion', 'logo_url', 'link_web', 'ciudad', 'notas'] as const;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'manage_billing')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { data: afiliado, error } = await adminDb.from('afiliados').select('*').eq('id', id).maybeSingle();
  if (error || !afiliado) return NextResponse.json({ error: 'Afiliado no encontrado' }, { status: 404 });

  const { data: billingRows } = await adminDb
    .from('afiliados_billing')
    .select('*')
    .eq('afiliado_id', id)
    .order('periodo', { ascending: false })
    .limit(24);

  return NextResponse.json({ afiliado, billing_records: billingRows ?? [] });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'manage_billing')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const { data: existing } = await adminDb.from('afiliados').select('*').eq('id', id).maybeSingle();
  if (!existing) return NextResponse.json({ error: 'Afiliado no encontrado' }, { status: 404 });

  const fields: Record<string, unknown> = {};
  STR_FIELDS.forEach(f => {
    if (body[f] !== undefined) fields[f] = typeof body[f] === 'string' ? body[f].trim() || null : null;
  });
  if (body.tier !== undefined) {
    if (!TIERS_VALIDOS.includes(body.tier)) return NextResponse.json({ error: 'Tier inválido' }, { status: 400 });
    fields.tier = body.tier;
  }
  if (body.estado !== undefined) {
    if (!ESTADOS_VALIDOS.includes(body.estado)) return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    fields.estado = body.estado;
  }
  if (body.precio_mensual !== undefined) {
    fields.precio_mensual = body.precio_mensual === '' || body.precio_mensual === null ? null : Number(body.precio_mensual);
  }
  if (body.fecha_inicio !== undefined) fields.fecha_inicio = body.fecha_inicio || null;
  if (body.fecha_vencimiento !== undefined) fields.fecha_vencimiento = body.fecha_vencimiento || null;

  if (fields.nombre !== undefined && !fields.nombre) {
    return NextResponse.json({ error: 'El nombre del afiliado es requerido' }, { status: 400 });
  }

  const { data, error } = await adminDb.from('afiliados').update(fields).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    admin_id: session.id,
    admin_email: session.email,
    action: 'AFILIADO_UPDATED',
    entity_type: 'afiliado',
    entity_id: id,
    details: { before: existing, after: fields },
  });

  return NextResponse.json({ afiliado: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'manage_billing')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { data: existing } = await adminDb.from('afiliados').select('*').eq('id', id).maybeSingle();
  if (!existing) return NextResponse.json({ error: 'Afiliado no encontrado' }, { status: 404 });

  const { error } = await adminDb.from('afiliados').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    admin_id: session.id,
    admin_email: session.email,
    action: 'AFILIADO_DELETED',
    entity_type: 'afiliado',
    entity_id: id,
    details: { deleted: existing },
  });

  return NextResponse.json({ ok: true });
}
