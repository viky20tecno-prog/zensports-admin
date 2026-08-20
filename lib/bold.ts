import 'server-only';
import crypto from 'crypto';

const BOLD_API_BASE = 'https://integrations.api.bold.co';

interface CreateLinkParams {
  monto: number;
  descripcion: string;
  reference: string;
}

interface BoldLinkPayload {
  payment_link: string;
  url: string;
}

// Bold rechaza (400 "at most 100 characters") cualquier descripción más
// larga que esto — encontrado el 20 ago 2026 probando la oferta anual con
// un nombre de club largo. Truncar acá protege a TODOS los que arman un
// link (manual, autoservicio, afiliados), no solo al que lo descubrió.
const DESCRIPCION_MAX = 100;

/**
 * Crea un link de pago Bold (COP, monto fijo). `reference` viaja en
 * data.metadata.reference del webhook — es lo único que usamos para
 * re-encontrar la fila de admin_billing cuando Bold confirma el pago.
 */
export async function crearLinkPagoBold({ monto, descripcion, reference }: CreateLinkParams): Promise<BoldLinkPayload> {
  const identityKey = process.env.BOLD_IDENTITY_KEY;
  if (!identityKey) throw new Error('BOLD_IDENTITY_KEY no configurada');

  const descripcionSegura = descripcion.length > DESCRIPCION_MAX
    ? `${descripcion.slice(0, DESCRIPCION_MAX - 1)}…`
    : descripcion;

  const res = await fetch(`${BOLD_API_BASE}/online/link/v1`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `x-api-key ${identityKey}`,
    },
    body: JSON.stringify({
      amount_type: 'CLOSE',
      amount: { currency: 'COP', total_amount: monto },
      reference,
      description: descripcionSegura,
    }),
  });

  const json = await res.json();
  if (!res.ok || json.errors?.length) {
    throw new Error(`Bold rechazó la creación del link: ${JSON.stringify(json.errors ?? json)}`);
  }
  return json.payload as BoldLinkPayload;
}

/**
 * Referencia única y alfanumérica (límite documentado: 60 caracteres) para
 * identificar un cobro club→Zenpra en un período dado.
 */
export function referenciaBold(clubSlug: string, periodo: string): string {
  const slugAlnum = clubSlug.replace(/[^a-zA-Z0-9]/g, '');
  const periodoAlnum = periodo.replace(/[^a-zA-Z0-9]/g, '');
  return `zs${slugAlnum}${periodoAlnum}${Date.now()}`.slice(0, 60);
}

/**
 * Referencia única para un cobro de membresía de un Afiliado (patrocinador/
 * anunciante — no un club). Mismo mecanismo que referenciaBold, pero con
 * prefijo "zsafil" + el id del afiliado en vez del slug del club, para que
 * sea legible como "es un cobro de afiliados" al mirar el dashboard de Bold
 * y no se confunda con un cobro de suscripción de club.
 */
export function referenciaAfiliadoBold(afiliadoId: string, periodo: string): string {
  const idAlnum = afiliadoId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
  const periodoAlnum = periodo.replace(/[^a-zA-Z0-9]/g, '');
  return `zsafil${idAlnum}${periodoAlnum}${Date.now()}`.slice(0, 60);
}

function hmacHex(encodedBody: string, key: string): Buffer {
  return Buffer.from(crypto.createHmac('sha256', key).update(encodedBody).digest('hex'), 'hex');
}

function constantTimeEquals(hexA: Buffer, hexB: string): boolean {
  const b = Buffer.from(hexB, 'hex');
  if (hexA.length !== b.length) return false;
  return crypto.timingSafeEqual(hexA, b);
}

/**
 * Verifica la firma de un webhook de Bold: HMAC-SHA256(base64(body), llave)
 * comparado contra el header x-bold-signature. Fail-closed: sin BOLD_SECRET_KEY
 * configurada, ningún webhook pasa (mismo criterio aplicado a Meta/Twilio/WAHA
 * tras la auditoría del 16 jul — nunca aceptar todo por defecto).
 *
 * Confirmado empíricamente el 17 jul contra un webhook de prueba real de Bold:
 * en ambiente de PRUEBAS, Bold firma con string vacío como llave, no con la
 * Secret Key real (documentado por Bold como "en pruebas: string vacío", algo
 * fácil de leer mal a la primera). Se prueban ambas variantes — la real
 * BOLD_SECRET_KEY (para cuando se agreguen llaves de producción) y el string
 * vacío (para el ambiente de pruebas actual) — y basta con que una calce.
 */
export function verificarFirmaBold(rawBody: string, signatureHeader: string | null): boolean {
  const secretKey = process.env.BOLD_SECRET_KEY;
  if (!secretKey || !signatureHeader) return false;

  const encoded = Buffer.from(rawBody).toString('base64');

  if (constantTimeEquals(hmacHex(encoded, secretKey), signatureHeader)) return true;
  if (constantTimeEquals(hmacHex(encoded, ''), signatureHeader)) return true;
  return false;
}
