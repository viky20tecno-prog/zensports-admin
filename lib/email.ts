import 'server-only';
import nodemailer from 'nodemailer';

function getTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.ZOHO_SMTP_USER,
      pass: process.env.ZOHO_SMTP_PASS,
    },
  });
}

const FROM = () => process.env.EMAIL_FROM || `ZenSports <${process.env.ZOHO_SMTP_USER}>`;

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

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  await getTransporter().sendMail({
    from: FROM(),
    to: email,
    subject: 'Restablecer contraseña — ZenSports Admin',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#080B12;color:#e5e7eb;border-radius:16px;">
        <h2 style="color:#fff;margin-top:0;">Restablecer contraseña</h2>
        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en el panel de administración de ZenSports.</p>
        <p>Haz clic en el botón para crear una nueva contraseña. El enlace expira en <strong>30 minutos</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;margin:20px 0;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;">
          Restablecer contraseña
        </a>
        <p style="font-size:12px;color:#6b7280;">Si no solicitaste este cambio, ignora este correo. Tu contraseña no cambiará.</p>
        <hr style="border-color:#1f2937;margin:24px 0;">
        <p style="font-size:11px;color:#4b5563;">ZenSports Admin · Acceso restringido</p>
      </div>
    `,
  });
}

export async function sendCuentaCobroEmail(to: string, subject: string, documentoHtml: string) {
  const ok = await sendEmail(to, subject, `<div style="background:#F4F4F8;padding:32px 12px;">${documentoHtml}
      <p style="max-width:640px;margin:16px auto 0;font-family:Arial,sans-serif;font-size:11px;color:#8A8A99;text-align:center;">¿Dudas sobre este cobro? Escríbenos a hola@zenpra.ai</p>
    </div>`);
  if (!ok) throw new Error('No se pudo enviar el correo');
}
