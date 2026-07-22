import 'server-only';
import { adminDb } from './supabase-admin';

export interface ClubMember {
  userId: string;
  email: string;
}

// Valida el JWT de Supabase de un usuario del CLUB (no un admin de Zenpra) y
// confirma que es ADMIN activo del club `slug`. Usa el cliente de
// service_role para validar el token (auth.getUser no depende de RLS) y para
// consultar club_members directo — el cliente anon del usuario no puede ver
// membresías de otros clubes ni le alcanza la política de RLS para este
// chequeo cruzado (usuario autenticado → rol en un club específico).
export async function getClubAdminFromToken(token: string, slug: string): Promise<ClubMember | null> {
  const { data: userData, error: userError } = await adminDb.auth.getUser(token);
  if (userError || !userData?.user) return null;

  const { data: membership } = await adminDb
    .from('club_members')
    .select('user_id')
    .eq('user_id', userData.user.id)
    .eq('club_id', slug)
    .eq('role', 'ADMIN')
    .eq('activo', true)
    .maybeSingle();

  if (!membership) return null;

  return { userId: userData.user.id, email: userData.user.email ?? '' };
}
