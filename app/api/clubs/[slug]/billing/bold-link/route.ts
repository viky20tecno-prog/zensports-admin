import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { writeAuditLog } from '@/lib/audit';
import { canAccess } from '@/lib/rbac';
import { crearLinkPagoBold, referenciaBold } from '@/lib/bold';
import { PLAN_PRICE } from '@/lib/utils';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'manage_billing')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { slug } = await params;
  const body = await req.json().catch(() => ({}));
  const { periodo } = body;
  if (!periodo) return NextResponse.json({ error: 'Falta el período' }, { status: 400 });

  const { data: club } = await adminDb.from('clubs').select('id, config').eq('slug', slug).maybeSingle();
  if (!club) return NextResponse.json({ error: 'Club no encontrado' }, { status: 404 });

  const monto = Number(body.monto) || PLAN_PRICE[club.config?.plan] || 0;
  if (monto <= 0) return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });

  const reference = referenciaBold(slug, periodo);
  const clubNombre = club.config?.nombre || slug;

  let link;
  try {
    link = await crearLinkPagoBold({
      monto,
      descripcion: `Suscripción ZenSports — ${clubNombre} — ${periodo}`,
      reference,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error creando el link en Bold' }, { status: 502 });
  }

  const { data, error } = await adminDb
    .from('admin_billing')
    .insert({
      club_id: club.id,
      club_slug: slug,
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
    action: 'BOLD_LINK_CREATED',
    entity_type: 'club',
    entity_id: slug,
    details: { monto, periodo, bold_link_id: link.payment_link },
  });

  return NextResponse.json({ record: data });
}
