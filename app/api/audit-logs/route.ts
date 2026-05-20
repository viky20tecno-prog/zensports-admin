import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { canAccess } from '@/lib/rbac';

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'view_audit_logs')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const action      = searchParams.get('action') || '';
  const entity_id   = searchParams.get('entity_id') || '';
  const admin_email = searchParams.get('admin_email') || '';
  const page        = parseInt(searchParams.get('page') || '1');
  const limit       = 50;
  const offset      = (page - 1) * limit;

  let query = adminDb
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (action)      query = query.eq('action', action);
  if (entity_id)   query = query.ilike('entity_id', `%${entity_id}%`);
  if (admin_email) query = query.ilike('admin_email', `%${admin_email}%`);

  const { data, error, count } = await query.range(offset, offset + limit - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ logs: data || [], total: count ?? 0, page, limit });
}
