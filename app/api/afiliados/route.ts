import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { writeAuditLog } from '@/lib/audit';
import { canAccess } from '@/lib/rbac';
import { AFILIADO_TIER_PRICE } from '@/lib/utils';

const TIERS_VALIDOS = ['bronce', 'plata', 'oro'];
const ESTADOS_VALIDOS = ['activo', 'pendiente_pago', 'inactivo', 'vencido'];

export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'manage_billing')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.trim();
  const estado = searchParams.get('estado');

  let query = adminDb.from('afiliados').select('*').order('created_at', { ascending: false });
  if (estado && ESTADOS_VALIDOS.includes(estado)) query = query.eq('estado', estado);
  if (search) query = query.ilike('nombre', `%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ afiliados: data ?? [] });
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'manage_billing')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { nombre, categoria, descripcion, logo_url, link_web, ciudad, notas } = body;

  if (!nombre?.trim()) {
    return NextResponse.json({ error: 'El nombre del afiliado es requerido' }, { status: 400 });
  }

  const tier = TIERS_VALIDOS.includes(body.tier) ? body.tier : 'bronce';
  const estado = ESTADOS_VALIDOS.includes(body.estado) ? body.estado : 'pendiente_pago';
  const precio_mensual =
    body.precio_mensual !== undefined && body.precio_mensual !== null && body.precio_mensual !== ''
      ? Number(body.precio_mensual)
      : AFILIADO_TIER_PRICE[tier];

  const { data, error } = await adminDb
    .from('afiliados')
    .insert({
      nombre: nombre.trim(),
      categoria: categoria?.trim() || null,
      descripcion: descripcion?.trim() || null,
      logo_url: logo_url?.trim() || null,
      link_web: link_web?.trim() || null,
      ciudad: ciudad?.trim() || null,
      tier,
      precio_mensual,
      estado,
      fecha_inicio: body.fecha_inicio || null,
      fecha_vencimiento: body.fecha_vencimiento || null,
      notas: notas?.trim() || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    admin_id: session.id,
    admin_email: session.email,
    action: 'AFILIADO_CREATED',
    entity_type: 'afiliado',
    entity_id: data.id,
    details: { nombre: data.nombre, tier: data.tier, estado: data.estado },
  });

  return NextResponse.json({ afiliado: data });
}
