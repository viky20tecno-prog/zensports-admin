import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { writeAuditLog } from '@/lib/audit';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { slug } = await params;
  const { data: club } = await adminDb.from('clubs').select('id').eq('slug', slug).maybeSingle();
  if (!club) return NextResponse.json({ error: 'Club no encontrado' }, { status: 404 });

  const { data, error } = await adminDb
    .from('admin_billing')
    .select('*')
    .eq('club_id', club.id)
    .order('periodo', { ascending: false })
    .limit(24);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ records: data ?? [] });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { slug } = await params;
  const body = await req.json();
  const { monto, periodo, metodo, referencia, notas } = body;

  if (!monto || !periodo || !metodo) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  const { data: club } = await adminDb.from('clubs').select('id').eq('slug', slug).maybeSingle();
  if (!club) return NextResponse.json({ error: 'Club no encontrado' }, { status: 404 });

  const { data, error } = await adminDb
    .from('admin_billing')
    .insert({
      club_id: club.id,
      club_slug: slug,
      monto: Number(monto),
      periodo,
      metodo,
      referencia: referencia || null,
      notas: notas || null,
      recorded_by: session.email,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    admin_email: session.email,
    action: 'BILLING_RECORDED',
    entity_type: 'club',
    entity_id: slug,
    details: { monto, periodo, metodo },
  });

  return NextResponse.json({ record: data });
}
