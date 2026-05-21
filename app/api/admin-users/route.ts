import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { canAccess } from '@/lib/rbac';
import { writeAuditLog } from '@/lib/audit';
import bcrypt from 'bcryptjs';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'manage_admin_users')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data, error } = await adminDb
    .from('admin_users')
    .select('id, email, name, role, is_active, last_login_at, created_at, created_by')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data || [] });
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'manage_admin_users')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const VALID_ROLES = ['super_admin', 'comercial', 'soporte', 'finanzas', 'ops'];

  const { email, name, role, password } = await req.json();
  if (!email || !name || !role || !password) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: `Rol inválido. Valores permitidos: ${VALID_ROLES.join(', ')}` }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 12);

  const { data, error } = await adminDb.from('admin_users').insert({
    email: email.toLowerCase().trim(),
    name,
    role,
    password_hash: hash,
    is_active: true,
    created_by: session.id,
  }).select('id, email, name, role, is_active, created_at').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    admin_id: session.id, admin_email: session.email,
    action: 'ADMIN_USER_CREATED', entity_type: 'admin_user', entity_id: data.id,
    after_state: { email, name, role },
  });

  return NextResponse.json({ user: data });
}
