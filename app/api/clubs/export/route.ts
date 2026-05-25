import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { PLAN_PRICE } from '@/lib/utils';
import { getClubStatus, getTrialDaysLeft } from '@/lib/health-score';

function escape(val: string | number | null | undefined): string {
  if (val == null) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [{ data: clubs }, { data: players }] = await Promise.all([
    adminDb.from('clubs').select('*').order('created_at', { ascending: false }),
    adminDb.from('players').select('club_id, activo'),
  ]);

  const playersByClub: Record<string, { total: number; active: number }> = {};
  for (const p of players || []) {
    if (!playersByClub[p.club_id]) playersByClub[p.club_id] = { total: 0, active: 0 };
    playersByClub[p.club_id].total++;
    if (p.activo) playersByClub[p.club_id].active++;
  }

  const headers = [
    'Slug', 'Nombre', 'Ciudad', 'Plan', 'Estado',
    'MRR (COP)', 'Jugadores', 'Jugadores Activos',
    'Trial vence', 'Días trial restantes',
    'WhatsApp', 'Email admin', 'Onboarding', 'Creado',
  ];

  const rows = (clubs || []).map(club => {
    const status  = getClubStatus(club as never);
    const plan    = club.config?.plan || 'trial';
    const mrr     = (PLAN_PRICE as Record<string, number>)[plan] || 0;
    const counts  = playersByClub[club.id] ?? { total: 0, active: 0 };
    const daysLeft = getTrialDaysLeft(club.config?.trial_ends_at);
    return [
      escape(club.slug),
      escape(club.config?.nombre),
      escape(club.config?.ciudad),
      escape(plan),
      escape(status),
      escape(mrr),
      escape(counts.total),
      escape(counts.active),
      escape(club.config?.trial_ends_at?.slice(0, 10)),
      escape(daysLeft),
      escape(club.config?.whatsapp),
      escape(club.owner_user_id),
      escape(club.config?.onboarding_completed ? 'Sí' : 'No'),
      escape(club.created_at?.slice(0, 10)),
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="zensports-clubs-${date}.csv"`,
    },
  });
}
