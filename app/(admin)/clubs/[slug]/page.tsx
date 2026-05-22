import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { computeHealthScore, getTrialDaysLeft, getClubStatus, getOnboardingPct } from '@/lib/health-score';
import { ClubStatusBadge } from '@/components/clubs/ClubStatusBadge';
import { ClubActionsMenu } from '@/components/clubs/ClubActionsMenu';
import { ClubDetailTabs } from '@/components/clubs/detail/ClubDetailTabs';
import { canAccess } from '@/lib/rbac';
import type { ClubFullDetail, Player, Pago, AuditEvent } from '@/types/club';

async function getClubDetail(slug: string): Promise<ClubFullDetail | null> {
  const { data: club, error } = await adminDb.from('clubs').select('*').eq('slug', slug).single();
  if (error || !club) return null;

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

  const { data: userData } = await adminDb.auth.admin.getUserById(club.owner_user_id);
  const owner_email = userData?.user?.email;

  return {
    ...club,
    owner_email,
    player_count,
    health_score: score,
    health_label: label,
    trial_days_left: getTrialDaysLeft(club.config?.trial_ends_at),
    status: getClubStatus(club),
    onboarding_pct: getOnboardingPct(club),
    players: (playerRows || []) as Player[],
    pagos: (pagoRows || []) as Pago[],
    audit_events: (auditRows || []) as AuditEvent[],
  };
}

export default async function ClubDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getAdminSession();
  if (!session) redirect('/login');

  const { slug } = await params;
  const detail = await getClubDetail(slug);
  if (!detail) notFound();

  const role = session.role;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link
          href="/clubs"
          className="flex items-center gap-1 text-gray-500 hover:text-gray-200 text-sm transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Clubes
        </Link>
        <span className="text-gray-700">/</span>
        <span className="text-sm text-gray-400">{detail.config.nombre}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {detail.config.logo_url ? (
            <img
              src={detail.config.logo_url}
              alt={detail.config.nombre}
              className="w-14 h-14 rounded-xl object-cover border border-white/10"
            />
          ) : (
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl border border-white/10"
              style={{ backgroundColor: detail.config.color || '#4F46E5' }}
            >
              {detail.config.nombre.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">{detail.config.nombre}</h2>
              <ClubStatusBadge status={detail.status} />
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {detail.slug}
              {detail.config.ciudad ? ` · ${detail.config.ciudad}` : ''}
            </p>
          </div>
        </div>

        <ClubActionsMenu
          club={detail}
          canChangePlan={canAccess(role, 'change_plan')}
          canSuspend={canAccess(role, 'suspend_club')}
          canExtendTrial={canAccess(role, 'extend_trial')}
          canDelete={canAccess(role, 'delete_club')}
          canResetPassword={canAccess(role, 'reset_password')}
          onRefresh={undefined}
          redirectOnDelete="/clubs"
        />
      </div>

      {/* Tabs */}
      <ClubDetailTabs detail={detail} role={role} />
    </div>
  );
}
