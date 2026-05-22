import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { writeAuditLog } from '@/lib/audit';
import { canAccess } from '@/lib/rbac';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'ZenSports <noreply@zensports.co>';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'reset_password')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { slug } = await params;

  const { data: club } = await adminDb.from('clubs').select('*').eq('slug', slug).maybeSingle();
  if (!club) return NextResponse.json({ error: 'Club no encontrado' }, { status: 404 });

  const { data: userData } = await adminDb.auth.admin.getUserById(club.owner_user_id);
  const email = userData?.user?.email;
  if (!email) return NextResponse.json({ error: 'No se encontró el email del administrador del club' }, { status: 400 });

  const { data: linkData, error: linkError } = await adminDb.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: 'https://zensports.vercel.app/login' },
  });

  if (linkError || !linkData) {
    return NextResponse.json({ error: 'No se pudo generar el enlace de recuperación' }, { status: 500 });
  }

  const resetLink = (linkData as any).properties?.action_link as string;

  let emailSent = false;
  if (RESEND_API_KEY && resetLink) {
    const nombreAdmin = userData?.user?.user_metadata?.nombre || 'Administrador';
    const nombreClub  = club.config?.nombre || club.name || slug;

    const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Restablece tu contraseña</title></head>
<body style="margin:0;padding:0;background:#060810;font-family:'Inter',system-ui,sans-serif;color:#fff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <tr><td>
      <div style="background:rgba(99,102,241,0.05);border:1px solid rgba(99,102,241,0.2);border-radius:16px;padding:40px;margin-bottom:24px;">
        <p style="font-size:13px;color:#818CF8;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 16px;">
          Recuperación de acceso
        </p>
        <h1 style="font-size:24px;font-weight:900;line-height:1.2;margin:0 0 16px;">
          Restablece tu contraseña de <span style="color:#818CF8;">${nombreClub}</span>
        </h1>
        <p style="font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;margin:0 0 28px;">
          Hola ${nombreAdmin}, el equipo de ZenSports generó un enlace para que puedas crear una nueva contraseña. El enlace es válido por 1 hora.
        </p>
        <a href="${resetLink}"
           style="display:inline-block;background:linear-gradient(135deg,#6366F1,#8B5CF6);color:#fff;font-weight:700;font-size:15px;text-decoration:none;border-radius:12px;padding:14px 28px;">
          Crear nueva contraseña →
        </a>
      </div>
      <p style="text-align:center;font-size:12px;color:rgba(255,255,255,0.2);margin:0;">
        Si no solicitaste este cambio, ignora este mensaje.<br>
        ZenSports · ZENPRA © 2026
      </p>
    </td></tr>
  </table>
</body>
</html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: EMAIL_FROM, to: email, subject: 'Restablece tu contraseña en ZenSports', html }),
    });
    emailSent = res.ok;
  }

  await writeAuditLog({
    admin_email: session.email,
    action:      'RESET_PASSWORD_SENT',
    entity_type: 'club',
    entity_id:   slug,
    details:     { email, email_sent: emailSent },
  });

  return NextResponse.json({ ok: true, email, reset_link: resetLink, email_sent: emailSent });
}
