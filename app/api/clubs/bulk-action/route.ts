import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { writeAuditLog } from '@/lib/audit';
import { canAccess } from '@/lib/rbac';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'ZenSports <noreply@zensports.co>';

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'extend_trial')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { action, slugs } = await req.json();
  if (!action || !Array.isArray(slugs) || slugs.length === 0) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
  }

  const results: { slug: string; ok: boolean; error?: string }[] = [];

  if (action === 'send_reminder') {
    const { data: clubs } = await adminDb
      .from('clubs')
      .select('id, slug, config, owner_user_id')
      .in('slug', slugs);

    for (const club of clubs || []) {
      try {
        const { data: userData } = await adminDb.auth.admin.getUserById(club.owner_user_id);
        const email = userData?.user?.email;
        if (!email) { results.push({ slug: club.slug, ok: false, error: 'Sin email' }); continue; }

        let sent = false;
        if (RESEND_API_KEY) {
          const nombre = club.config?.nombre || club.slug;
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: EMAIL_FROM,
              to: email,
              subject: `Recordatorio: tu trial de ${nombre} está por vencer`,
              html: `<p>Hola, tu período de prueba en <strong>${nombre}</strong> está próximo a vencer. Activa tu plan para seguir usando ZenSports sin interrupciones.</p>`,
            }),
          });
          sent = res.ok;
        }

        await writeAuditLog({
          admin_email: session.email,
          action: 'PAYMENT_REMINDER_SENT',
          entity_type: 'club',
          entity_id: club.slug,
          details: { email, bulk: true, sent },
        });

        results.push({ slug: club.slug, ok: true });
      } catch (e) {
        results.push({ slug: club.slug, ok: false, error: String(e) });
      }
    }
  } else {
    return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 });
  }

  const succeeded = results.filter(r => r.ok).length;
  return NextResponse.json({ results, succeeded, total: slugs.length });
}
