import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';
import { canAccess } from '@/lib/rbac';
import { cargarCuentaCobro, asuntoCuentaCobro, numeroCuentaCobro } from '@/lib/cuenta-cobro';
import { sendCuentaCobroEmail } from '@/lib/email';

type Params = { params: Promise<{ slug: string; id: string }> };

// GET: la cuenta de cobro como página imprimible (Ctrl+P → Guardar como PDF).
export async function GET(_req: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'manage_billing')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { slug, id } = await params;
  const cc = await cargarCuentaCobro(id, slug);
  if (!cc) return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });

  const page = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${numeroCuentaCobro(cc.record)} — ${cc.input.clubNombre}</title>
<style>
  body{margin:0;background:#F4F4F8;padding:32px 12px;}
  .bar{max-width:640px;margin:0 auto 16px;text-align:right;font-family:Arial,sans-serif;}
  .bar button{background:#6A00FF;color:#fff;border:0;border-radius:10px;padding:10px 18px;font-weight:700;cursor:pointer;}
  @page{size:A4;margin:12mm;}
  @media print{body{background:#fff;padding:0;}.bar{display:none;}}
</style></head><body>
<div class="bar"><button onclick="window.print()">Descargar PDF / Imprimir</button></div>
${cc.html}
</body></html>`;
  return new NextResponse(page, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

// POST: envía la cuenta de cobro al correo del dueño del club (o a `to` si se indica).
export async function POST(req: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'manage_billing')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { slug, id } = await params;
  const body = await req.json().catch(() => ({}));
  const cc = await cargarCuentaCobro(id, slug);
  if (!cc) return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });

  const to = (typeof body.to === 'string' && body.to.includes('@')) ? body.to.trim() : cc.ownerEmail;
  if (!to) return NextResponse.json({ error: 'El club no tiene correo de administrador' }, { status: 400 });

  try {
    await sendCuentaCobroEmail(to, asuntoCuentaCobro(cc.record, cc.input.clubNombre), cc.html);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error enviando el correo' }, { status: 502 });
  }

  await writeAuditLog({
    admin_id: session.id,
    admin_email: session.email,
    action: 'CUENTA_COBRO_SENT',
    entity_type: 'club',
    entity_id: slug,
    details: { billing_id: id, to, numero: numeroCuentaCobro(cc.record) },
  });

  return NextResponse.json({ ok: true, email_sent_to: to });
}
