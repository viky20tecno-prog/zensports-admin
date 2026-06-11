import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { adminDb } from '@/lib/supabase-admin';

const schema = z.object({
  token:    z.string().min(1),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

  const { token, password } = parsed.data;

  const { data: admin } = await adminDb
    .from('admin_users')
    .select('id, reset_token, reset_token_expires_at, is_active')
    .eq('reset_token', token)
    .single();

  if (!admin || !admin.is_active) {
    return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 400 });
  }

  if (!admin.reset_token_expires_at || new Date(admin.reset_token_expires_at) < new Date()) {
    return NextResponse.json({ error: 'El enlace expiró. Solicita uno nuevo.' }, { status: 400 });
  }

  const password_hash = await bcrypt.hash(password, 10);

  await adminDb.from('admin_users').update({
    password_hash,
    reset_token:            null,
    reset_token_expires_at: null,
  }).eq('id', admin.id);

  return NextResponse.json({ ok: true });
}
