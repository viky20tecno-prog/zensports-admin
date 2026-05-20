import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { writeAuditLog } from '@/lib/audit';
import { canAccess } from '@/lib/rbac';

export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'suspend_club')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { slug } = await params;

  const { error } = await adminDb.from('clubs').update({
    is_active: true,
    suspended_at: null,
    suspended_reason: null,
  }).eq('slug', slug);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    admin_id: session.id, admin_email: session.email,
    action: 'CLUB_UNLOCKED', entity_type: 'club', entity_id: slug,
  });

  return NextResponse.json({ ok: true });
}
