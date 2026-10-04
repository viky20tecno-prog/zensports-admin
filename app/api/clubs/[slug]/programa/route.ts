import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { writeAuditLog } from '@/lib/audit';
import { canAccess } from '@/lib/rbac';
import { asignarFundador, contarFundadores, CUPOS_FUNDADORES } from '@/lib/programa';

// GET: estado del programa (cupos de fundador usados) + clubs para el selector de referidor.
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'manage_billing')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { slug } = await params;
  const { total } = await contarFundadores();
  const { data } = await adminDb.from('clubs').select('slug, name, config').neq('slug', slug).order('name');
  const clubs = (data ?? []).map(c => ({ slug: c.slug, nombre: c.config?.nombre || c.name || c.slug }));
  return NextResponse.json({ fundadores_usados: total, cupos: CUPOS_FUNDADORES, clubs });
}

// PATCH: acciones manuales de ZenSports sobre el programa del club.
export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'manage_billing')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { slug } = await params;
  const body = await req.json().catch(() => ({})) as { accion?: string; referido_por_slug?: string | null; valor?: boolean; periodo?: string };

  const { data: club } = await adminDb.from('clubs').select('id, config').eq('slug', slug).maybeSingle();
  if (!club) return NextResponse.json({ error: 'Club no encontrado' }, { status: 404 });
  const config = club.config ?? {};
  let nuevo: Record<string, unknown> | null = null;
  let detalle: Record<string, unknown> = {};

  switch (body.accion) {
    case 'vincular_referidor': {
      const ref = body.referido_por_slug || null;
      if (ref === slug) return NextResponse.json({ error: 'Un club no puede referirse a sí mismo' }, { status: 400 });
      if (ref) {
        const { data: existe } = await adminDb.from('clubs').select('slug').eq('slug', ref).maybeSingle();
        if (!existe) return NextResponse.json({ error: 'Club referidor no encontrado' }, { status: 404 });
      }
      nuevo = { ...config, referido_por_slug: ref };
      detalle = { referido_por_slug: ref };
      break;
    }
    case 'asignar_fundador': {
      const numero = await asignarFundador(slug);
      if (!numero) return NextResponse.json({ error: `Ya se usaron los ${CUPOS_FUNDADORES} cupos de fundador` }, { status: 409 });
      detalle = { fundador: numero };
      break;
    }
    case 'quitar_fundador': {
      const { fundador: _quitado, ...resto } = config;
      nuevo = resto;
      detalle = { fundador_quitado: config.fundador?.numero ?? null };
      break;
    }
    case 'concurso': {
      nuevo = { ...config, concurso: !!body.valor };
      detalle = { concurso: !!body.valor };
      break;
    }
    case 'aplicar_mes_gratis': {
      const meses = Number(config.meses_gratis) || 0;
      if (meses < 1) return NextResponse.json({ error: 'El club no tiene meses gratis disponibles' }, { status: 400 });
      if (!body.periodo || !/^\d{4}-\d{2}$/.test(body.periodo)) return NextResponse.json({ error: 'Período inválido' }, { status: 400 });
      // Queda como un cobro de $0 ya pagado, con su constancia (la cuenta de cobro
      // lo muestra como descuento del 100% sobre el precio del plan).
      const { data: record, error } = await adminDb.from('admin_billing').insert({
        club_id: club.id,
        club_slug: slug,
        monto: 0,
        periodo: body.periodo,
        metodo: 'credito_referido',
        estado: 'pagado',
        notas: 'Descuento: mes gratis por referido',
        recorded_by: session.email,
      }).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      nuevo = { ...config, meses_gratis: meses - 1 };
      detalle = { periodo: body.periodo, meses_restantes: meses - 1, billing_id: record.id };
      await guardarYAuditar();
      return NextResponse.json({ ok: true, record, config: nuevo });
    }
    default:
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
  }

  await guardarYAuditar();
  const { data: actualizado } = await adminDb.from('clubs').select('config').eq('slug', slug).single();
  return NextResponse.json({ ok: true, config: actualizado?.config });

  async function guardarYAuditar() {
    if (nuevo) {
      const { error } = await adminDb.from('clubs').update({ config: nuevo }).eq('slug', slug);
      if (error) throw new Error(error.message);
    }
    await writeAuditLog({
      admin_id: session!.id, admin_email: session!.email,
      action: 'CLUB_PROGRAMA_EDITED', entity_type: 'club', entity_id: slug,
      details: { accion: body.accion, ...detalle },
    });
  }
}
