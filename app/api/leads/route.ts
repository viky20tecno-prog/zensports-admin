import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { canAccess } from '@/lib/rbac';

export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'view_clubs')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const convertido = searchParams.get('convertido');

  let q = adminDb.from('leads').select('*').order('created_at', { ascending: false }).limit(500);
  if (convertido === 'true')  q = q.eq('convertido', true);
  if (convertido === 'false') q = q.eq('convertido', false);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ leads: data || [] });
}

export async function PATCH(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'view_clubs')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, convertido, notas, club_slug } = await req.json();
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (convertido !== undefined) updates.convertido = convertido;
  if (notas      !== undefined) updates.notas      = notas;
  if (club_slug  !== undefined) updates.club_slug  = club_slug;

  const { error } = await adminDb.from('leads').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'view_clubs')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

  const { error } = await adminDb.from('leads').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
