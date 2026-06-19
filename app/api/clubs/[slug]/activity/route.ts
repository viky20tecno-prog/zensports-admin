import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200);

  const { data: club } = await adminDb.from('clubs').select('id').eq('slug', slug).single();
  if (!club) return NextResponse.json({ error: 'Club no encontrado' }, { status: 404 });

  const { data, error } = await adminDb
    .from('club_activity_logs')
    .select('*')
    .eq('club_id', club.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ logs: data || [] });
}
