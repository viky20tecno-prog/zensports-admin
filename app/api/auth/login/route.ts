import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { adminDb } from '@/lib/supabase-admin';
import { signAdminToken, COOKIE_NAME } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const TTL = 4 * 60 * 60; // 4 hours

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const { data: admin, error } = await adminDb
    .from('admin_users')
    .select('id, email, name, role, password_hash, is_active')
    .eq('email', email.toLowerCase())
    .single();

  if (error || !admin) {
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
  }

  if (!admin.is_active) {
    return NextResponse.json({ error: 'Cuenta inactiva' }, { status: 403 });
  }

  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) {
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
  }

  // Update last_login_at
  await adminDb
    .from('admin_users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', admin.id);

  const token = await signAdminToken({
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  });

  await writeAuditLog({
    admin_id: admin.id,
    admin_email: admin.email,
    action: 'ADMIN_LOGIN',
    entity_type: 'admin_user',
    entity_id: admin.id,
    metadata: {
      ip: req.headers.get('x-forwarded-for') ?? 'unknown',
      user_agent: req.headers.get('user-agent') ?? 'unknown',
    },
  });

  const res = NextResponse.json({ name: admin.name, role: admin.role });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TTL,
    path: '/',
  });
  return res;
}
