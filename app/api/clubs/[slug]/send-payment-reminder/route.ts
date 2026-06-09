import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { writeAuditLog } from '@/lib/audit';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'ZenSports <noreply@zensports.co>';

async function sendReminderEmail(to: string, nombre_club: string, nombre_admin: string, dias_restantes: number | null) {
  if (!RESEND_API_KEY) {
    console.warn('[reminder] RESEND_API_KEY no configurada');
    return { ok: false };
  }

  const vencido = dias_restantes !== null && dias_restantes <= 0;
  const subject = vencido
    ? `Tu prueba de ZenSports venció — activa tu plan para seguir usando la plataforma`
    : `Tu prueba de ZenSports vence en ${dias_restantes} día${dias_restantes === 1 ? '' : 's'}`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#060810;font-family:'Inter',system-ui,sans-serif;color:#fff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;margin:0 auto;padding:40px 24px;">
    <tr><td>
      <div style="background:${vencido ? 'rgba(255,94,94,0.05)' : 'rgba(255,193,7,0.05)'};border:1px solid ${vencido ? 'rgba(255,94,94,0.2)' : 'rgba(255,193,7,0.2)'};border-radius:16px;padding:40px;margin-bottom:24px;">
        <p style="font-size:13px;color:${vencido ? '#FF5E5E' : '#FFC107'};font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 16px;">
          ${vencido ? 'Trial vencido' : 'Aviso de vencimiento'}
        </p>
        <h1 style="font-size:26px;font-weight:900;line-height:1.2;margin:0 0 16px;">
          ${vencido
            ? `La prueba de <span style="color:#FF5E5E;">${nombre_club}</span> ha vencido`
            : `Tu prueba vence en <span style="color:#FFC107;">${dias_restantes} día${dias_restantes === 1 ? '' : 's'}</span>`
          }
        </h1>
        <p style="font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;margin:0 0 28px;">
          Hola ${nombre_admin}, para continuar gestionando tu club sin interrupciones elige el plan que mejor se adapte a tus necesidades.
        </p>
        <a href="https://zensports.zenpra.ai/#precios"
           style="display:inline-block;background:linear-gradient(135deg,#E14924,#E14924cc);color:#fff;font-weight:700;font-size:15px;text-decoration:none;border-radius:12px;padding:14px 28px;">
          Ver planes y precios →
        </a>
      </div>

      <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:28px;margin-bottom:24px;">
        <p style="font-size:12px;color:rgba(255,255,255,0.3);font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 16px;">Planes disponibles</p>
        ${[
          { plan: 'Starter', precio: '$149.000 COP/mes', desc: 'Dashboard + Cobro WA + Carnet digital' },
          { plan: 'Pro',     precio: '$399.000 COP/mes', desc: 'Todo Starter + Torneos + Arbitraje + Finanzas' },
          { plan: 'Scale',   precio: '$799.000 COP/mes', desc: 'Todo incluido + múltiples admins + soporte prioritario' },
        ].map(p => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
          <div>
            <span style="font-size:14px;font-weight:700;color:#fff;">${p.plan}</span>
            <span style="font-size:12px;color:rgba(255,255,255,0.35);margin-left:8px;">${p.desc}</span>
          </div>
          <span style="font-size:13px;font-weight:700;color:#E14924;">${p.precio}</span>
        </div>`).join('')}
      </div>

      <p style="text-align:center;font-size:12px;color:rgba(255,255,255,0.2);margin:0;">
        ZenSports · ZENPRA © 2026 · Este recordatorio fue enviado por el equipo de ZenSports.
      </p>
    </td></tr>
  </table>
</body>
</html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
  });
  return { ok: res.ok };
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { slug } = await params;

  const { data: club } = await adminDb.from('clubs').select('*').eq('slug', slug).maybeSingle();
  if (!club) return NextResponse.json({ error: 'Club no encontrado' }, { status: 404 });

  // Obtener email del owner
  const { data: userData } = await adminDb.auth.admin.getUserById(club.owner_user_id);
  const email = userData?.user?.email;
  if (!email) return NextResponse.json({ error: 'No se encontró el email del admin del club' }, { status: 400 });

  const trialEndsAt = club.config?.trial_ends_at;
  let diasRestantes: number | null = null;
  if (trialEndsAt) {
    diasRestantes = Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000);
  }

  const nombreAdmin = userData.user?.user_metadata?.nombre || 'Administrador';

  await sendReminderEmail(
    email,
    club.config?.nombre || club.name,
    nombreAdmin,
    diasRestantes,
  );

  await writeAuditLog({
    admin_email: session.email,
    action:      'PAYMENT_REMINDER_SENT',
    entity_type: 'club',
    entity_id:   slug,
    details:     { email, dias_restantes: diasRestantes },
  });

  return NextResponse.json({ ok: true, email_sent_to: email });
}
