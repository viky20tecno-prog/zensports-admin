import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { writeAuditLog } from '@/lib/audit';
import { canAccess } from '@/lib/rbac';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'manage_billing')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { data: afiliado } = await adminDb.from('afiliados').select('id').eq('id', id).maybeSingle();
  if (!afiliado) return NextResponse.json({ error: 'Afiliado no encontrado' }, { status: 404 });

  const { data, error } = await adminDb
    .from('afiliados_billing')
    .select('*')
    .eq('afiliado_id', id)
    .order('periodo', { ascending: false })
    .limit(24);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ records: data ?? [] });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'manage_billing')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { monto, periodo, metodo, referencia, notas } = body;

  if (!monto || !periodo || !metodo) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  const { data: afiliado } = await adminDb.from('afiliados').select('id, nombre').eq('id', id).maybeSingle();
  if (!afiliado) return NextResponse.json({ error: 'Afiliado no encontrado' }, { status: 404 });

  const { data, error } = await adminDb
    .from('afiliados_billing')
    .insert({
      afiliado_id: afiliado.id,
      afiliado_nombre: afiliado.nombre,
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
    admin_id: session.id,
    admin_email: session.email,
    action: 'AFILIADO_BILLING_RECORDED',
    entity_type: 'afiliado',
    entity_id: id,
    details: { monto, periodo, metodo },
  });

  return NextResponse.json({ record: data });
}
