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

/**
 * Crea un link de pago Bold (COP, monto fijo). `reference` viaja en
 * data.metadata.reference del webhook — es lo único que usamos para
 * re-encontrar la fila de admin_billing cuando Bold confirma el pago.
 */
export async function crearLinkPagoBold({ monto, descripcion, reference }: CreateLinkParams): Promise<BoldLinkPayload> {
  const identityKey = process.env.BOLD_IDENTITY_KEY;
  if (!identityKey) throw new Error('BOLD_IDENTITY_KEY no configurada');

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
      description: descripcion,
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
 * Verifica la firma de un webhook de Bold: HMAC-SHA256(base64(body), secret_key)
 * comparado contra el header x-bold-signature. Fail-closed: sin BOLD_SECRET_KEY
 * configurada, ningún webhook pasa (mismo criterio aplicado a Meta/Twilio/WAHA
 * tras la auditoría del 16 jul — nunca aceptar todo por defecto).
 */
export function verificarFirmaBold(rawBody: string, signatureHeader: string | null): boolean {
  const secretKey = process.env.BOLD_SECRET_KEY;
  if (!secretKey || !signatureHeader) return false;

  const encoded = Buffer.from(rawBody).toString('base64');
  const expected = crypto.createHmac('sha256', secretKey).update(encoded).digest('hex');

  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(signatureHeader, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
