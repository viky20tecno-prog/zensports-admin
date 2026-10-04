import 'server-only';
import { adminDb } from '@/lib/supabase-admin';
import { formatCOP, PLAN_PRICE, PLAN_PRICE_ANUAL } from '@/lib/utils';
import type { BillingRecord } from '@/types/club';

// Datos del emisor de la cuenta de cobro. ZenSports todavía no tiene NIT:
// se cobra como persona natural no responsable de IVA, con la cédula de Diego.
// Cuando exista la empresa (NIT) basta con cambiar estos valores.
export const EMISOR = {
  nombre: 'DIEGO ALVENIZ ESCOBAR FIGUEROA',
  documento: 'C.C. 1.032.401.947',
  ciudad: 'Medellín',
  telefono: '',                       // TODO opcional
  email: 'hola@zenpra.ai',
};

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function numeroCuentaCobro(r: Pick<BillingRecord, 'id' | 'created_at'>) {
  const d = new Date(r.created_at);
  return `CC-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-${r.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
}

// periodo es 'YYYY-MM' o 'YYYY-anual-lanzamiento' (ver bold-link público)
export function describirPeriodo(periodo: string) {
  const [anio, resto] = periodo.split('-');
  if (resto === 'anual') return `Anual ${anio} (12 meses)`;
  const mes = MESES[Number(resto) - 1];
  return mes ? `${mes} ${anio}` : periodo;
}

function fechaLarga(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} de ${MESES[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`;
}

const UNIDADES = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
const DECENAS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

function hasta999(n: number): string {
  if (n === 100) return 'cien';
  const c = Math.floor(n / 100), r = n % 100;
  let s = CENTENAS[c];
  if (r) {
    const dec = r < 30 ? UNIDADES[r] : DECENAS[Math.floor(r / 10)] + (r % 10 ? ' y ' + UNIDADES[r % 10] : '');
    s = s ? `${s} ${dec}` : dec;
  }
  return s;
}

// "uno" se apocopa a "un" antes de mil/millones: 21.000 → "veintiún mil"
const apocopar = (s: string) => s.replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un');

export function numeroALetras(n: number): string {
  n = Math.round(n);
  if (n === 0) return 'cero';
  const millones = Math.floor(n / 1_000_000), miles = Math.floor((n % 1_000_000) / 1000), resto = n % 1000;
  const partes: string[] = [];
  if (millones) partes.push(millones === 1 ? 'un millón' : `${apocopar(numeroALetras(millones))} millones`);
  if (miles) partes.push(miles === 1 ? 'mil' : `${apocopar(hasta999(miles))} mil`);
  if (resto) partes.push(hasta999(resto));
  return partes.join(' ');
}

function pesosEnLetras(n: number) {
  const letras = numeroALetras(n);
  // "un millón de pesos", "dos millones de pesos", pero "un millón quinientos mil pesos"
  const de = /(millón|millones)$/.test(letras) ? ' de' : '';
  return `${apocopar(letras)}${de} pesos M/CTE`.toUpperCase();
}

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

export interface CuentaCobroInput {
  record: BillingRecord & { plan_solicitado?: string | null };
  clubNombre: string;
  clubCiudad?: string;
  planActual?: string;
}

// HTML con estilos inline: el mismo documento sirve para imprimir/guardar como
// PDF desde el admin y como cuerpo del correo (los clientes de correo ignoran <style>).
export function renderCuentaCobro({ record, clubNombre, clubCiudad, planActual }: CuentaCobroInput) {
  const pagado = record.estado === 'pagado';
  const plan = (record.plan_solicitado || planActual || '').toString();
  const planTxt = plan ? `Plan ${plan.charAt(0).toUpperCase()}${plan.slice(1)}` : '';
  const concepto = `Servicio de acceso y uso de la plataforma de software ZenSports (software como servicio)${planTxt ? ` — ${planTxt}` : ''}.`;
  const numero = numeroCuentaCobro(record);

  // Descuento: si el monto quedó por debajo del precio de lista del plan, se
  // muestra el desglose. El motivo sale de las notas solo si empiezan por
  // "Descuento" (las notas de un pago manual pueden ser internas).
  const precioLista = (record.periodo.includes('anual') ? PLAN_PRICE_ANUAL[plan] : PLAN_PRICE[plan]) || 0;
  const descuento = precioLista > record.monto ? precioLista - record.monto : 0;
  const motivoDescuento = /^descuento/i.test(record.notas?.trim() || '') ? record.notas!.trim() : 'Descuento';
  const pctDescuento = descuento ? Math.round((descuento / precioLista) * 100) : 0;

  const fila = (k: string, v: string) =>
    `<tr><td style="padding:6px 0;color:#6B6B80;font-size:13px;width:150px;vertical-align:top;">${k}</td><td style="padding:6px 0;color:#14141F;font-size:13px;font-weight:600;">${v}</td></tr>`;

  const sello = pagado
    ? `<div style="margin:24px 0 0;padding:14px 18px;border:2px solid #16A34A;border-radius:12px;background:#F0FDF4;color:#15803D;font-size:13px;line-height:1.6;">
        <strong style="font-size:15px;letter-spacing:1px;">✓ PAGADO</strong><br>
        Recibimos el pago de esta cuenta${record.metodo ? ` por <strong>${esc(record.metodo === 'bold' ? 'Bold (pago en línea)' : record.metodo)}</strong>` : ''}${record.bold_reference || record.referencia ? `, referencia <span style="font-family:monospace;">${esc(record.bold_reference || record.referencia || '')}</span>` : ''}. Este documento sirve como constancia de pago.
      </div>`
    : record.bold_link_url
      ? `<div style="margin:24px 0 0;text-align:center;">
          <a href="${esc(record.bold_link_url)}" style="display:inline-block;background:#6A00FF;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;border-radius:12px;padding:14px 28px;">Pagar en línea con Bold →</a>
          <p style="margin:8px 0 0;color:#6B6B80;font-size:12px;">Pago seguro procesado por Bold.</p>
        </div>`
      : '';

  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;background:#ffffff;color:#14141F;padding:40px 36px;border:1px solid #E5E5EF;border-radius:16px;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="vertical-align:top;">
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="vertical-align:middle;padding-right:10px;"><img src="https://zensports.zenpra.ai/brand/zensports-z.png" width="40" height="38" alt="ZenSports" style="display:block;border:0;"></td>
        <td style="vertical-align:middle;">
          <div style="font-size:22px;font-weight:900;letter-spacing:2px;color:#14141F;line-height:1;">ZEN<span style="color:#6A00FF;">SPORTS</span></div>
          <div style="font-size:11px;color:#6B6B80;margin-top:4px;">zensports.zenpra.ai · ${esc(EMISOR.email)}</div>
        </td>
      </tr></table>
    </td>
    <td style="vertical-align:top;text-align:right;">
      <div style="font-size:11px;color:#6B6B80;text-transform:uppercase;letter-spacing:1.5px;">Cuenta de cobro</div>
      <div style="font-size:16px;font-weight:700;font-family:monospace;">${numero}</div>
    </td>
  </tr></table>

  <p style="margin:28px 0 0;font-size:13px;color:#6B6B80;">${esc(EMISOR.ciudad)}, ${fechaLarga(record.created_at)}</p>

  <p style="margin:24px 0 4px;font-size:13px;color:#6B6B80;">Cliente</p>
  <p style="margin:0;font-size:18px;font-weight:700;">${esc(clubNombre)}</p>
  ${clubCiudad ? `<p style="margin:2px 0 0;font-size:13px;color:#6B6B80;">${esc(clubCiudad)}</p>` : ''}

  <p style="margin:28px 0 4px;font-size:13px;color:#6B6B80;text-transform:uppercase;letter-spacing:1.5px;">Debe a</p>
  <p style="margin:0;font-size:16px;font-weight:700;">${esc(EMISOR.nombre)}</p>
  <p style="margin:2px 0 0;font-size:13px;">${esc(EMISOR.documento)}${EMISOR.telefono ? ` · Cel. ${esc(EMISOR.telefono)}` : ''}</p>

  ${descuento ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
    <tr><td style="padding:6px 0;color:#6B6B80;font-size:13px;">Valor del ${esc(planTxt || 'plan')} (${esc(describirPeriodo(record.periodo))})</td><td style="padding:6px 0;text-align:right;font-size:13px;color:#14141F;">${formatCOP(precioLista)}</td></tr>
    <tr><td style="padding:6px 0;color:#15803D;font-size:13px;font-weight:600;">${esc(motivoDescuento)} (${pctDescuento}%)</td><td style="padding:6px 0;text-align:right;font-size:13px;color:#15803D;font-weight:600;">− ${formatCOP(descuento)}</td></tr>
  </table>` : ''}

  <div style="margin:${descuento ? '8px' : '28px'} 0 0;padding:20px;background:#F6F2FF;border-radius:12px;">
    <p style="margin:0 0 4px;font-size:13px;color:#6B6B80;">${descuento ? 'Total a pagar' : 'La suma de'}</p>
    <p style="margin:0;font-size:28px;font-weight:900;color:#6A00FF;">${formatCOP(record.monto)}</p>
    <p style="margin:4px 0 0;font-size:12px;font-weight:600;">${pesosEnLetras(record.monto)}</p>
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
    ${fila('Por concepto de', esc(concepto))}
    ${fila('Período', esc(describirPeriodo(record.periodo)))}
    ${fila('Estado', pagado ? 'Pagado' : 'Pendiente de pago')}
  </table>

  ${sello}

  <p style="margin:28px 0 0;font-size:11px;color:#6B6B80;line-height:1.6;border-top:1px solid #E5E5EF;padding-top:16px;">
    Declaro que soy persona natural no responsable del impuesto sobre las ventas (IVA) y que no estoy obligado a expedir factura de venta ni factura electrónica, conforme a la normativa tributaria vigente.
    El servicio no incluye permanencia mínima. Los datos registrados en la plataforma pertenecen al club. Condiciones del servicio: zensports.zenpra.ai/terminos
  </p>

  <div style="margin-top:36px;">
    <div style="width:300px;border-top:1px solid #14141F;padding-top:6px;font-size:12px;">
      <strong>${esc(EMISOR.nombre)}</strong><br><span style="color:#6B6B80;">${esc(EMISOR.documento)}</span>
    </div>
  </div>
</div>`;
}

// Carga todo lo necesario para emitir/enviar la cuenta de cobro de un registro
// de admin_billing: el registro, el club y el correo del dueño (auth.users).
export async function cargarCuentaCobro(billingId: string, slug?: string) {
  let q = adminDb.from('admin_billing').select('*').eq('id', billingId);
  if (slug) q = q.eq('club_slug', slug);
  const { data: record } = await q.maybeSingle();
  if (!record) return null;

  const { data: club } = await adminDb.from('clubs').select('name, config, owner_user_id').eq('slug', record.club_slug).maybeSingle();
  if (!club) return null;

  let ownerEmail: string | null = null;
  if (club.owner_user_id) {
    const { data } = await adminDb.auth.admin.getUserById(club.owner_user_id);
    ownerEmail = data?.user?.email ?? null;
  }

  const input: CuentaCobroInput = {
    record,
    clubNombre: club.config?.nombre || club.name || record.club_slug,
    clubCiudad: club.config?.ciudad?.trim(),
    planActual: club.config?.plan,
  };
  return { record, input, ownerEmail, html: renderCuentaCobro(input) };
}

export function asuntoCuentaCobro(record: BillingRecord, clubNombre: string) {
  return record.estado === 'pagado'
    ? `Pago recibido — ZenSports ${describirPeriodo(record.periodo)} · ${clubNombre}`
    : `Cuenta de cobro ${numeroCuentaCobro(record)} — ZenSports · ${clubNombre}`;
}
