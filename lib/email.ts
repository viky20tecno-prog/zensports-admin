import 'server-only';
// Envío genérico que no lanza: devuelve false si falla, para que la ruta que lo
// llama decida qué responder. El correo sale por la API (/api/internal/send-email),
// que es donde viven las credenciales de Zoho — igual que forgot-password.
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const apiUrl = process.env.API_URL || 'https://city-fc-api-v2.vercel.app';
    const res = await fetch(`${apiUrl}/api/internal/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.INTERNAL_API_SECRET ?? '' },
      body: JSON.stringify({ to, subject, html }),
    });
    if (!res.ok) console.error('[email] API respondió', res.status, await res.text().catch(() => ''));
    return res.ok;
  } catch (err) {
    console.error('[email] error enviando correo:', err instanceof Error ? err.message : err);
    return false;
  }
}

export async function sendCuentaCobroEmail(to: string, subject: string, documentoHtml: string) {
  const ok = await sendEmail(to, subject, `<div style="background:#F4F4F8;padding:32px 12px;">${documentoHtml}
      <p style="max-width:640px;margin:16px auto 0;font-family:Arial,sans-serif;font-size:11px;color:#8A8A99;text-align:center;">¿Dudas sobre este cobro? Escríbenos a hola@zenpra.ai</p>
    </div>`);
  if (!ok) throw new Error('No se pudo enviar el correo');
}
