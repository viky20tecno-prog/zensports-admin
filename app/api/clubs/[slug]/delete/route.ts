import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { writeAuditLog } from '@/lib/audit';
import { canAccess } from '@/lib/rbac';

const CHILD_TABLES = [
  'arbitraje_pagos',
  'asistencia',
  'calendario',
  'suspensiones',
  'pedido_uniformes',
  'torneos',
  'uniformes',
  'pagos',
  'mensualidades',
  'finanzas',
  'nomina_pagos',
  'nomina_empleados',
  'partidos',
] as const;

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'delete_club')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { slug } = await params;

  const { data: club, error: fetchErr } = await adminDb
    .from('clubs').select('id, config').eq('slug', slug).single();
  if (fetchErr || !club) return NextResponse.json({ error: 'Club not found' }, { status: 404 });

  const clubId: string = club.id;

  // Recopilar user_ids antes de borrar club_members
  const { data: members } = await adminDb
    .from('club_members').select('user_id').eq('club_id', clubId);
  const userIds = (members ?? []).map((m: { user_id: string }) => m.user_id).filter(Boolean);

  // Borrar tablas hijas que tienen club_id
  for (const table of CHILD_TABLES) {
    await adminDb.from(table).delete().eq('club_id', clubId);
  }

  // Borrar players y club_members
  await adminDb.from('players').delete().eq('club_id', clubId);
  await adminDb.from('club_members').delete().eq('club_id', clubId);

  // Borrar el club
  const { error } = await adminDb.from('clubs').delete().eq('id', clubId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Borrar usuarios de auth
  for (const uid of userIds) {
    await adminDb.auth.admin.deleteUser(uid);
  }

  await writeAuditLog({
    admin_id: session.id, admin_email: session.email,
    action: 'CLUB_DELETED', entity_type: 'club', entity_id: slug,
    before_state: { nombre: club.config?.nombre, plan: club.config?.plan },
    after_state: { deleted: true },
    metadata: { action_detail: 'permanent_delete', jugadores_eliminados: true, usuarios_eliminados: userIds.length },
  });

  return NextResponse.json({ ok: true });
}
