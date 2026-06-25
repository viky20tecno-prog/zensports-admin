import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { writeAuditLog } from '@/lib/audit';
import { canAccess } from '@/lib/rbac';

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'edit_club')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { slug } = await params;
  const body = await req.json() as Record<string, unknown>;

  const ALLOWED = ['nombre', 'subtitulo', 'ciudad', 'codigo_pais', 'color', 'logo_url',
                   'valor_mensualidad', 'dias_gracia_mora', 'penalidad_mora', 'whatsapp', 'waha_session'];

  const { data: club, error: fetchErr } = await adminDb
    .from('clubs').select('config').eq('slug', slug).single();
  if (fetchErr || !club) return NextResponse.json({ error: 'Club not found' }, { status: 404 });

  const before: Record<string, unknown> = {};
  const patch:  Record<string, unknown> = {};
  for (const key of ALLOWED) {
    if (key in body) {
      before[key] = club.config?.[key];
      patch[key]  = body[key];
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const newConfig = { ...club.config, ...patch };
  const { error } = await adminDb.from('clubs').update({ config: newConfig }).eq('slug', slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    admin_id: session.id, admin_email: session.email,
    action: 'CLUB_CONFIG_EDITED', entity_type: 'club', entity_id: slug,
    before_state: before, after_state: patch,
  });

  return NextResponse.json({ ok: true, config: newConfig });
}
