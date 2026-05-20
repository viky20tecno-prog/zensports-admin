import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { computeHealthScore, getTrialDaysLeft, getClubStatus, getOnboardingPct } from '@/lib/health-score';
import { ClubsTable } from '@/components/clubs/ClubsTable';
import type { ClubWithMetrics } from '@/types/club';

async function getClubs(): Promise<ClubWithMetrics[]> {
  const { data: clubs } = await adminDb
    .from('clubs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (!clubs?.length) return [];

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

  return clubs.map(club => {
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
}

export default async function ClubsPage() {
  const session = await getAdminSession();
  if (!session) redirect('/login');

  const clubs = await getClubs();

  const stats = clubs.reduce(
    (acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Clubes</h2>
        <p className="text-sm text-gray-500 mt-1">
          {clubs.length} clubes registrados · {stats.active || 0} activos · {stats.trial || 0} en trial · {stats.expired || 0} expirados
        </p>
      </div>

      <ClubsTable initialClubs={clubs} role={session.role} />
    </div>
  );
}
