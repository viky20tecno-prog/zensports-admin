import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { writeAuditLog } from '@/lib/audit';
import { canAccess } from '@/lib/rbac';

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'extend_trial')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { slug } = await params;
  const { days } = await req.json() as { days: number };

  const { data: club, error: fetchErr } = await adminDb.from('clubs').select('config').eq('slug', slug).single();
  if (fetchErr || !club) return NextResponse.json({ error: 'Club not found' }, { status: 404 });

  const base = club.config?.trial_ends_at ? new Date(club.config.trial_ends_at) : new Date();
  if (base < new Date()) base.setTime(Date.now());
  base.setDate(base.getDate() + days);
  const trial_ends_at = base.toISOString();

  const before = { trial_ends_at: club.config?.trial_ends_at };
  const newConfig = { ...club.config, plan: 'trial', trial_ends_at };

  const { error } = await adminDb.from('clubs').update({ config: newConfig }).eq('slug', slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    admin_id: session.id, admin_email: session.email,
    action: 'CLUB_TRIAL_EXTENDED', entity_type: 'club', entity_id: slug,
    before_state: before, after_state: { trial_ends_at, days_added: days },
  });

  return NextResponse.json({ ok: true, trial_ends_at });
}
