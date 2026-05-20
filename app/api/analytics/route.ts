import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { PLAN_PRICE } from '@/lib/utils';
import { getClubStatus } from '@/lib/health-score';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: clubs } = await adminDb
    .from('clubs')
    .select('slug, is_active, created_at, config')
    .order('created_at', { ascending: true });

  if (!clubs) return NextResponse.json({ error: 'No data' }, { status: 500 });

  let active = 0, trial = 0, suspended = 0, expired = 0, mrr = 0;

  clubs.forEach(club => {
    const status = getClubStatus(club as never);
    if (status === 'active') {
      active++;
      mrr += PLAN_PRICE[club.config?.plan || ''] || 0;
    } else if (status === 'trial') trial++;
    else if (status === 'suspended') suspended++;
    else if (status === 'expired') expired++;
  });

  const arr = mrr * 12;
  const total_clubs = clubs.length;
  const conversion_rate = total_clubs > 0 ? Math.round((active / total_clubs) * 100) : 0;

  // Growth: last 6 months
  const now = new Date();
  const growth = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthStr = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' });
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString();

    const newClubs = clubs.filter(c => c.created_at?.startsWith(monthStr)).length;
    const mrrSnapshot = clubs
      .filter(c => c.created_at <= endOfMonth && c.config?.plan && c.config.plan !== 'trial')
      .reduce((sum, c) => sum + (PLAN_PRICE[c.config.plan] || 0), 0);

    return { month: label, clubs: newClubs, mrr: mrrSnapshot };
  });

  return NextResponse.json({ mrr, arr, active, trial, suspended, expired, total_clubs, conversion_rate, growth });
}
