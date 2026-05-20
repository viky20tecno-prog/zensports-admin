import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { writeAuditLog } from '@/lib/audit';
import { canAccess } from '@/lib/rbac';

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'suspend_club')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { slug } = await params;
  const { reason } = await req.json() as { reason?: string };

  const { error } = await adminDb.from('clubs').update({
    is_active: false,
    suspended_at: new Date().toISOString(),
    suspended_reason: reason || null,
  }).eq('slug', slug);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    admin_id: session.id, admin_email: session.email,
    action: 'CLUB_SUSPENDED', entity_type: 'club', entity_id: slug,
    after_state: { reason },
  });

  return NextResponse.json({ ok: true });
}
