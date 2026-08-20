import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/supabase-admin';
import { getClubAdminFromToken } from '@/lib/club-auth';
import { crearLinkPagoBold, referenciaBold } from '@/lib/bold';
import { PLAN_PRICE, PLAN_PRICE_ANUAL } from '@/lib/utils';
import { checkRateLimit } from '@/lib/rate-limit';

// Endpoint público (cross-origin desde zensports.zenpra.ai) para que el CLUB
// genere y pague su propia suscripción — Fase 2 de Bold. Distinto del
// endpoint admin-only (/api/clubs/[slug]/billing/bold-link): acá la
// autorización es "sos ADMIN de ESTE club" (JWT de Supabase del propio
// usuario), no una sesión de admin de Zenpra.
const ALLOWED_ORIGIN = 'https://zensports.zenpra.ai';
const PLANES_AUTOSERVICIO = ['starter', 'pro', 'scale'];

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(`selfserve-bold-link:${ip}`, 10, 60 * 1000)) {
    return NextResponse.json({ error: 'Demasiados intentos, esperá un momento.' }, { status: 429, headers: corsHeaders() });
  }

  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });

  const member = await getClubAdminFromToken(token, slug);
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders() });

  const body = await req.json().catch(() => ({}));
  const plan = body.plan;
  if (!PLANES_AUTOSERVICIO.includes(plan)) {
    return NextResponse.json({ error: 'Plan inválido' }, { status: 400, headers: corsHeaders() });
  }
  // Oferta de lanzamiento, no permanente (ver PLAN_PRICE_ANUAL): 12 meses por
  // el precio de 10. Cualquier valor que no sea 'anual' se trata como mensual.
  const esAnual = body.periodoTipo === 'anual';

  const { data: club } = await adminDb.from('clubs').select('id, config').eq('slug', slug).maybeSingle();
  if (!club) return NextResponse.json({ error: 'Club no encontrado' }, { status: 404, headers: corsHeaders() });

  const monto = esAnual ? PLAN_PRICE_ANUAL[plan] : PLAN_PRICE[plan];
  const now = new Date();
  const periodo = esAnual
    ? `${now.getFullYear()}-anual-lanzamiento`
    : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const reference = referenciaBold(slug, periodo);
  const clubNombre = club.config?.nombre || slug;
  const descripcion = esAnual
    ? `Suscripción ZenSports — ${clubNombre} — plan ${plan} ANUAL (2 meses gratis)`
    : `Suscripción ZenSports — ${clubNombre} — plan ${plan} — ${periodo}`;

  let link;
  try {
    link = await crearLinkPagoBold({
      monto,
      descripcion,
      reference,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error creando el link en Bold' },
      { status: 502, headers: corsHeaders() }
    );
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
      recorded_by: member.email,
      plan_solicitado: plan,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders() });

  await adminDb.from('club_activity_logs').insert({
    club_id: club.id,
    club_slug: slug,
    user_id: member.userId,
    user_email: member.email,
    user_role: 'ADMIN',
    action: 'SUSCRIPCION_LINK_GENERADO',
    entity_type: 'admin_billing',
    entity_id: data.id,
    details: { plan, monto, periodo },
  });

  return NextResponse.json({ record: data }, { headers: corsHeaders() });
}
