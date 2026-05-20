import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { computeHealthScore, getTrialDaysLeft, getClubStatus, getOnboardingPct } from '@/lib/health-score';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { slug } = await params;

  const { data: club, error } = await adminDb.from('clubs').select('*').eq('slug', slug).single();
  if (error || !club) return NextResponse.json({ error: 'Club not found' }, { status: 404 });

  const [
    { data: playerRows },
    { data: activityRows },
    { data: pagoRows },
    { data: auditRows },
  ] = await Promise.all([
    adminDb
      .from('players')
      .select('id, cedula, nombre, apellidos, celular, activo, created_at, categoria, equipo, foto_url, posicion, numero_camiseta')
      .eq('club_id', club.id)
      .order('created_at', { ascending: false }),
    adminDb
      .from('audit_logs')
      .select('entity_id')
      .gt('created_at', new Date(Date.now() - 14 * 86400000).toISOString())
      .eq('entity_id', slug),
    adminDb
      .from('pagos')
      .select('id, cedula, monto, banco, concepto, referencia, estado_revision, tipo_origen, created_at')
      .eq('club_id', club.id)
      .order('created_at', { ascending: false })
      .limit(50),
    adminDb
      .from('audit_logs')
      .select('id, admin_email, action, before_state, after_state, metadata, created_at')
      .eq('entity_id', slug)
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  const player_count = playerRows?.length || 0;
  const has_recent_activity = (activityRows?.length || 0) > 0;
  const { score, label } = computeHealthScore({ club, player_count, has_recent_activity });

  return NextResponse.json({
    club: {
      ...club,
      player_count,
      health_score: score,
      health_label: label,
      trial_days_left: getTrialDaysLeft(club.config?.trial_ends_at),
      status: getClubStatus(club),
      onboarding_pct: getOnboardingPct(club),
    },
    players: playerRows || [],
    pagos: pagoRows || [],
    audit_events: auditRows || [],
  });
}
