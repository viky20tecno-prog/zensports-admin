import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { writeAuditLog } from '@/lib/audit';
import { canAccess } from '@/lib/rbac';

// PATCH: add or remove a staff phone number
export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'edit_club')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { slug } = await params;
  const { action, celular } = await req.json() as { action: 'add' | 'remove'; celular: string };

  if (!celular || !['add', 'remove'].includes(action)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const digits = celular.replace(/\D/g, '').slice(-10);
  if (digits.length < 10) return NextResponse.json({ error: 'Número inválido' }, { status: 400 });

  const { data: club, error: fetchErr } = await adminDb
    .from('clubs').select('id, config').eq('slug', slug).single();
  if (fetchErr || !club) return NextResponse.json({ error: 'Club not found' }, { status: 404 });

  const prev: string[] = club.config?.celulares_staff ?? [];
  const next = action === 'add'
    ? prev.includes(digits) ? prev : [...prev, digits]
    : prev.filter(n => n !== digits);

  const newConfig = { ...club.config, celulares_staff: next };
  const { error } = await adminDb.from('clubs').update({ config: newConfig }).eq('slug', slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    admin_id: session.id, admin_email: session.email,
    action: action === 'add' ? 'STAFF_ADDED' : 'STAFF_REMOVED',
    entity_type: 'club', entity_id: slug,
    before_state: { celulares_staff: prev },
    after_state:  { celulares_staff: next },
  });

  return NextResponse.json({ celulares_staff: next });
}
