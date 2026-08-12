import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { writeAuditLog } from '@/lib/audit';
import { canAccess } from '@/lib/rbac';
import { crearLinkPagoBold, referenciaAfiliadoBold } from '@/lib/bold';
import { AFILIADO_TIER_PRICE } from '@/lib/utils';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'manage_billing')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { periodo } = body;
  if (!periodo) return NextResponse.json({ error: 'Falta el período' }, { status: 400 });

  const { data: afiliado } = await adminDb.from('afiliados').select('id, nombre, tier').eq('id', id).maybeSingle();
  if (!afiliado) return NextResponse.json({ error: 'Afiliado no encontrado' }, { status: 404 });

  const monto = Number(body.monto) || AFILIADO_TIER_PRICE[afiliado.tier] || 0;
  if (monto <= 0) return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });

  // Prefijo "zsafil" + id del afiliado (en vez del slug del club) para que el
  // reference sea legible como cobro de afiliados en el dashboard de Bold —
  // ver referenciaAfiliadoBold en lib/bold.ts.
  const reference = referenciaAfiliadoBold(id, periodo);

  let link;
  try {
    link = await crearLinkPagoBold({
      monto,
      descripcion: `Membresía ZenSports Afiliados — ${afiliado.nombre} — ${periodo}`,
      reference,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error creando el link en Bold' }, { status: 502 });
  }

  const { data, error } = await adminDb
    .from('afiliados_billing')
    .insert({
      afiliado_id: afiliado.id,
      afiliado_nombre: afiliado.nombre,
      monto,
      periodo,
      metodo: 'bold',
      estado: 'pendiente',
      bold_link_id: link.payment_link,
      bold_link_url: link.url,
      bold_reference: reference,
      recorded_by: session.email,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    admin_id: session.id,
    admin_email: session.email,
    action: 'AFILIADO_BOLD_LINK_CREATED',
    entity_type: 'afiliado',
    entity_id: id,
    details: { monto, periodo, bold_link_id: link.payment_link },
  });

  return NextResponse.json({ record: data });
}
