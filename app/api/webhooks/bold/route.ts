import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/supabase-admin';
import { verificarFirmaBold } from '@/lib/bold';
import { checkRateLimit } from '@/lib/rate-limit';
import { buildModulosForPlan } from '@/lib/plan-modules';
import type { ClubPlan } from '@/types/club';

// Bold espera 200 en máx. 2s y reintenta hasta 5 veces (15min/1h/4h/8h/24h) si no lo recibe.
// El UPDATE de abajo ya es idempotente por sí solo (pasar estado a 'pagado' dos veces no
// tiene efecto extra), así que no hace falta bookkeeping adicional de payment_id.
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(`bold-webhook:${ip}`, 60, 60 * 1000)) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('x-bold-signature');

  if (!verificarFirmaBold(rawBody, signature)) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
  }

  let event: { type?: string; data?: { metadata?: { reference?: string } } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  if (event.type !== 'SALE_APPROVED') {
    return NextResponse.json({ status: 'ignored' }, { status: 200 });
  }

  const reference = event.data?.metadata?.reference;
  if (!reference) {
    console.error('[webhook/bold] SALE_APPROVED sin metadata.reference:', rawBody);
    return NextResponse.json({ status: 'ignored' }, { status: 200 });
  }

  const { data: updatedRows, error } = await adminDb
    .from('admin_billing')
    .update({ estado: 'pagado' })
    .eq('bold_reference', reference)
    .neq('estado', 'pagado')
    .select('club_slug, plan_solicitado');

  if (error) {
    console.error('[webhook/bold] error actualizando admin_billing:', error.message);
  }

  // plan_solicitado solo viene seteado cuando el link lo generó el propio club
  // (autoservicio, Fase 2) — un link generado por un admin de Zenpra nunca lo
  // trae, así que un pago manual normal no dispara ningún cambio de plan acá.
  const row = updatedRows?.[0];
  if (row?.plan_solicitado) {
    const { data: club } = await adminDb.from('clubs').select('config').eq('slug', row.club_slug).maybeSingle();
    if (club) {
      const plan = row.plan_solicitado as ClubPlan;
      const newModulos = buildModulosForPlan(plan);
      const { error: planError } = await adminDb
        .from('clubs')
        .update({ config: { ...club.config, plan, modulos: newModulos }, is_active: true })
        .eq('slug', row.club_slug);
      if (planError) {
        console.error('[webhook/bold] error activando plan autoservicio:', planError.message);
      }
    }
  }

  return NextResponse.json({ status: 'ok' }, { status: 200 });
}
