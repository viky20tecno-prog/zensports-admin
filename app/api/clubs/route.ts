import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { computeHealthScore, getTrialDaysLeft, getClubStatus, getOnboardingPct } from '@/lib/health-score';

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 50;
  const offset = (page - 1) * limit;

  let query = adminDb.from('clubs').select('*', { count: 'exact' });
  if (search) query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);

  const { data: clubs, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!clubs?.length) return NextResponse.json({ clubs: [], total: 0 });

  const slugs = clubs.map(c => c.slug);

  const [{ data: playerRows }, { data: activityRows }] = await Promise.all([
    adminDb.from('players').select('club_slug').in('club_slug', slugs),
    adminDb
      .from('audit_logs')
      .select('entity_id')
      .gt('created_at', new Date(Date.now() - 14 * 86400000).toISOString())
      .in('entity_id', slugs),
  ]);

  const playerCount: Record<string, number> = {};
  (playerRows || []).forEach(p => { playerCount[p.club_slug] = (playerCount[p.club_slug] || 0) + 1; });
  const recentSet = new Set((activityRows || []).map(a => a.entity_id));

  const enriched = clubs.map(club => {
    const player_count = playerCount[club.slug] || 0;
    const has_recent_activity = recentSet.has(club.slug);
    const { score, label } = computeHealthScore({ club, player_count, has_recent_activity });
    return {
      ...club,
      player_count,
      health_score: score,
      health_label: label,
      trial_days_left: getTrialDaysLeft(club.config?.trial_ends_at),
      status: getClubStatus(club),
      onboarding_pct: getOnboardingPct(club),
    };
  });

  const filtered = statusFilter ? enriched.filter(c => c.status === statusFilter) : enriched;

  return NextResponse.json({ clubs: filtered, total: count });
}
