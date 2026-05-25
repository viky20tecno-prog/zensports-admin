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

  // Fetch all matching clubs without pagination first so status filter is accurate
  let query = adminDb.from('clubs').select('*');
  if (search) {
    // config->nombre is the club name; slug is always searchable
    query = query.or(`slug.ilike.%${search}%,config->>nombre.ilike.%${search}%`);
  }

  const { data: allClubs, error } = await query.order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!allClubs?.length) return NextResponse.json({ clubs: [], total: 0 });

  const ids = allClubs.map(c => c.id);
  const slugs = allClubs.map(c => c.slug);
  const idToSlug: Record<string, string> = {};
  allClubs.forEach(c => { idToSlug[c.id] = c.slug; });

  const [{ data: playerRows }, { data: activityRows }] = await Promise.all([
    adminDb.from('players').select('club_id').in('club_id', ids),
    adminDb
      .from('audit_logs')
      .select('entity_id')
      .gt('created_at', new Date(Date.now() - 14 * 86400000).toISOString())
      .in('entity_id', slugs),
  ]);

  const playerCount: Record<string, number> = {};
  (playerRows || []).forEach(p => {
    const slug = idToSlug[p.club_id];
    if (slug) playerCount[slug] = (playerCount[slug] || 0) + 1;
  });
  const recentSet = new Set((activityRows || []).map(a => a.entity_id));

  const enriched = allClubs.map(club => {
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

  // Apply status filter after enrichment (status is computed, not a DB column)
  const filtered = statusFilter ? enriched.filter(c => c.status === statusFilter) : enriched;

  // Paginate after all filters are applied
  const total = filtered.length;
  const clubs = filtered.slice(offset, offset + limit);

  return NextResponse.json({ clubs, total });
}
