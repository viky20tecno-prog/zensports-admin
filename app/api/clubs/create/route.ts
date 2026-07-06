import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { canAccess } from '@/lib/rbac';

function generarSlug(nombre: string) {
  return nombre
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'create_club')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { nombre_club, ciudad, email, password, nombre_admin, celular_admin } = await request.json();

  if (!nombre_club?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: 'Nombre del club, email y contraseña son requeridos.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'La contraseña debe tener mínimo 8 caracteres.' }, { status: 400 });
  }

  const slug = generarSlug(nombre_club.trim());

  const { data: existing } = await adminDb.from('clubs').select('id').eq('slug', slug).maybeSingle();
  if (existing) {
    return NextResponse.json({ error: `Ya existe un club con el nombre "${nombre_club}".` }, { status: 400 });
  }

  const { data: authData, error: authError } = await adminDb.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { nombre: nombre_admin || '', club_slug: slug },
  });

  if (authError) {
    const msg = authError.message?.toLowerCase() || '';
    if (msg.includes('already registered') || msg.includes('already exists')) {
      return NextResponse.json({ error: 'Ya existe una cuenta con ese email.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error creando la cuenta: ' + authError.message }, { status: 500 });
  }

  const userId = authData.user.id;

  const { error: clubError } = await adminDb.from('clubs').insert({
    slug,
    name: nombre_club.trim(),
    is_active: true,
    owner_user_id: userId,
    celular_admin: celular_admin || null,
    config: {
      nombre: nombre_club.trim(),
      ciudad: ciudad?.trim() || '',
      valor_mensualidad: 65000,
      color: '#00AAFF',
      subtitulo: '',
      codigo_pais: '57',
      plan: 'trial',
      trial_ends_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      modulos: {
        dashboard: true, jugadores: true, uniformes: true,
        arbitraje: true, cobro: true, whatsapp: true, conciliacion: true,
      },
    },
  });

  if (clubError) {
    await adminDb.auth.admin.deleteUser(userId).catch(() => {});
    return NextResponse.json({ error: 'Error creando el club: ' + clubError.message }, { status: 500 });
  }

  await adminDb.from('club_members').insert({ user_id: userId, club_id: slug });

  return NextResponse.json({ success: true, slug });
}
