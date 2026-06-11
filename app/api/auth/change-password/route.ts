import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';

const schema = z.object({
  current_password: z.string().min(1),
  new_password:     z.string().min(8, 'Mínimo 8 caracteres'),
});

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { current_password, new_password } = parsed.data;

  const { data: admin } = await adminDb
    .from('admin_users')
    .select('id, password_hash')
    .eq('id', session.id)
    .single();

  if (!admin) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const valid = await bcrypt.compare(current_password, admin.password_hash);
  if (!valid) return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 400 });

  const password_hash = await bcrypt.hash(new_password, 10);
  await adminDb.from('admin_users').update({ password_hash }).eq('id', admin.id);

  return NextResponse.json({ ok: true });
}
