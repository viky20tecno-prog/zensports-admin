import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/supabase-admin';
import { verificarFirmaBold } from '@/lib/bold';
import { checkRateLimit } from '@/lib/rate-limit';

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
  const sigValida = verificarFirmaBold(rawBody, signature);

  // DEBUG temporal (17 jul) — quitar una vez confirmado el flujo end-to-end con Bold.
  console.log('[webhook/bold][debug] headers:', JSON.stringify(Object.fromEntries(req.headers)));
  console.log('[webhook/bold][debug] sigPresente:', !!signature, 'sigValida:', sigValida, 'bodyLen:', rawBody.length);
  console.log('[webhook/bold][debug] body:', rawBody.slice(0, 2000));

  if (!sigValida) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
  }

  let event: { type?: string; data?: { metadata?: { reference?: string } } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  if (event.type !== 'SALE_APPROVED') {
    console.log('[webhook/bold][debug] evento ignorado, type:', event.type);
    return NextResponse.json({ status: 'ignored' }, { status: 200 });
  }

  const reference = event.data?.metadata?.reference;
  if (!reference) {
    console.error('[webhook/bold] SALE_APPROVED sin metadata.reference:', rawBody);
    return NextResponse.json({ status: 'ignored' }, { status: 200 });
  }

  const { data, error } = await adminDb
    .from('admin_billing')
    .update({ estado: 'pagado' })
    .eq('bold_reference', reference)
    .neq('estado', 'pagado')
    .select('id');

  console.log('[webhook/bold][debug] reference:', reference, 'filas actualizadas:', data?.length ?? 0);

  if (error) {
    console.error('[webhook/bold] error actualizando admin_billing:', error.message);
  }

  return NextResponse.json({ status: 'ok' }, { status: 200 });
}
