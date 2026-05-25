import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { canAccess } from '@/lib/rbac';
import { writeAuditLog } from '@/lib/audit';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'impersonate')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { slug } = await params;

  const { data: club } = await adminDb.from('clubs').select('*').eq('slug', slug).maybeSingle();
  if (!club) return NextResponse.json({ error: 'Club no encontrado' }, { status: 404 });

  const { data: userData } = await adminDb.auth.admin.getUserById(club.owner_user_id);
  const email = userData?.user?.email;
  if (!email) return NextResponse.json({ error: 'No se encontró el email del administrador del club' }, { status: 400 });

  const { data: linkData, error: linkError } = await adminDb.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: 'https://zensports.vercel.app/auth/callback' },
  });

  if (linkError || !linkData) {
    return NextResponse.json({ error: 'No se pudo generar el enlace de impersonación' }, { status: 500 });
  }

  const magicLink = (linkData as any).properties?.action_link as string;

  await writeAuditLog({
    admin_email: session.email,
    action: 'IMPERSONATE',
    entity_type: 'club',
    entity_id: slug,
    details: { target_email: email },
  });

  return NextResponse.json({ magic_link: magicLink, email });
}
