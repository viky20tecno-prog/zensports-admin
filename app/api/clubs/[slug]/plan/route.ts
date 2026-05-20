import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { writeAuditLog } from '@/lib/audit';
import { canAccess } from '@/lib/rbac';
import type { ClubPlan } from '@/types/club';

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'change_plan')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { slug } = await params;
  const { plan } = await req.json() as { plan: ClubPlan };

  const { data: club, error: fetchErr } = await adminDb.from('clubs').select('config').eq('slug', slug).single();
  if (fetchErr || !club) return NextResponse.json({ error: 'Club not found' }, { status: 404 });

  const before = { plan: club.config?.plan };
  const newConfig = { ...club.config, plan };

  const { error } = await adminDb.from('clubs').update({ config: newConfig, is_active: true }).eq('slug', slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    admin_id: session.id, admin_email: session.email,
    action: 'CLUB_PLAN_CHANGED', entity_type: 'club', entity_id: slug,
    before_state: before, after_state: { plan },
  });

  return NextResponse.json({ ok: true });
}
