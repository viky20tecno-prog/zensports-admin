import type { ClubWithMetrics, Club } from '@/types/club';

interface HealthInput {
  club: Club;
  player_count: number;
  has_recent_activity: boolean;
}

export function computeHealthScore(input: HealthInput): {
  score: number;
  label: 'healthy' | 'warning' | 'inactive';
} {
  const { club, player_count, has_recent_activity } = input;
  const cfg = club.config;
  let score = 0;

  if (cfg.onboarding_completed) score += 20;
  score += Math.min(player_count, 10) / 10 * 20;
  if (cfg.plan !== 'trial') score += 20;
  if (cfg.plan === 'trial' && cfg.trial_ends_at && new Date(cfg.trial_ends_at) > new Date()) score += 15;
  if (cfg.whatsapp) score += 15;
  if (has_recent_activity) score += 10;

  const rounded = Math.round(score);
  const label = rounded >= 80 ? 'healthy' : rounded >= 50 ? 'warning' : 'inactive';
  return { score: rounded, label };
}

export function getTrialDaysLeft(trial_ends_at?: string): number | null {
  if (!trial_ends_at) return null;
  const diff = new Date(trial_ends_at).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

export function getClubStatus(club: Club): ClubWithMetrics['status'] {
  if (!club.is_active) return 'suspended';
  const plan = club.config?.plan;
  if (!plan || plan === 'trial') {
    const days = getTrialDaysLeft(club.config?.trial_ends_at);
    return days !== null && days <= 0 ? 'expired' : 'trial';
  }
  return 'active';
}

export function getOnboardingPct(club: Club): number {
  const cfg = club.config;
  const steps = [
    !!cfg.nombre,
    !!cfg.logo_url,
    !!cfg.color,
    !!cfg.whatsapp,
    !!cfg.valor_mensualidad,
    cfg.onboarding_completed === true,
  ];
  return Math.round(steps.filter(Boolean).length / steps.length * 100);
}
