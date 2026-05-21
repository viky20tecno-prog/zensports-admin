import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { writeAuditLog } from '@/lib/audit';

const DEMO_SLUG = 'zensports-demo';
const DEMO_EMAIL = 'demo@zensports.co';
const DEMO_PASS = 'ZenSports2026!';

const JUGADORES = [
  { cedula: '1001001001', nombre: 'Andrés',    apellidos: 'García Torres',     celular: '3001234001', categoria: 'Sub-17', equipo: 'A' },
  { cedula: '1001001002', nombre: 'Carlos',    apellidos: 'Martínez López',    celular: '3001234002', categoria: 'Sub-17', equipo: 'A' },
  { cedula: '1001001003', nombre: 'Sebastián', apellidos: 'Rodríguez Vargas',  celular: '3001234003', categoria: 'Sub-17', equipo: 'B' },
  { cedula: '1001001004', nombre: 'Julián',    apellidos: 'Hernández Castro',  celular: '3001234004', categoria: 'Sub-15', equipo: 'A' },
  { cedula: '1001001005', nombre: 'Miguel',    apellidos: 'Pérez Ríos',        celular: '3001234005', categoria: 'Sub-15', equipo: 'B' },
  { cedula: '1001001006', nombre: 'Daniel',    apellidos: 'González Mora',     celular: '3001234006', categoria: 'Sub-15', equipo: 'A' },
  { cedula: '1001001007', nombre: 'Camilo',    apellidos: 'Sánchez Ruiz',      celular: '3001234007', categoria: 'Sub-13', equipo: 'A' },
  { cedula: '1001001008', nombre: 'Felipe',    apellidos: 'Ramírez Díaz',      celular: '3001234008', categoria: 'Sub-13', equipo: 'B' },
  { cedula: '1001001009', nombre: 'Santiago',  apellidos: 'Torres Medina',     celular: '3001234009', categoria: 'Sub-13', equipo: 'A' },
  { cedula: '1001001010', nombre: 'Nicolás',   apellidos: 'Flores Ortiz',      celular: '3001234010', categoria: 'Sub-17', equipo: 'B' },
  { cedula: '1001001011', nombre: 'Esteban',   apellidos: 'Jiménez Parra',     celular: '3001234011', categoria: 'Sub-17', equipo: 'A' },
  { cedula: '1001001012', nombre: 'Tomás',     apellidos: 'Morales Quintero',  celular: '3001234012', categoria: 'Sub-15', equipo: 'B' },
  { cedula: '1001001013', nombre: 'Alejandro', apellidos: 'Vega Suárez',       celular: '3001234013', categoria: 'Sub-15', equipo: 'A' },
  { cedula: '1001001014', nombre: 'Mateo',     apellidos: 'Castillo Mendoza',  celular: '3001234014', categoria: 'Sub-13', equipo: 'B' },
  { cedula: '1001001015', nombre: 'Valeria',   apellidos: 'Reyes Herrera',     celular: '3001234015', categoria: 'Sub-15', equipo: 'A' },
  { cedula: '1001001016', nombre: 'Laura',     apellidos: 'Vargas Peña',       celular: '3001234016', categoria: 'Sub-13', equipo: 'B' },
  { cedula: '1001001017', nombre: 'Isabella',  apellidos: 'Muñoz Salazar',     celular: '3001234017', categoria: 'Sub-17', equipo: 'A' },
  { cedula: '1001001018', nombre: 'Sofia',     apellidos: 'Guerrero Acosta',   celular: '3001234018', categoria: 'Sub-13', equipo: 'B' },
  { cedula: '1001001019', nombre: 'Valentina', apellidos: 'Álvarez Cano',      celular: '3001234019', categoria: 'Sub-15', equipo: 'A' },
  { cedula: '1001001020', nombre: 'Natalia',   apellidos: 'Cruz Espinoza',     celular: '3001234020', categoria: 'Sub-17', equipo: 'B' },
];

// Estado de mensualidades por jugador (índice 0..19)
// AL_DIA=12, PARCIAL=5, MORA=3
const ESTADOS_MES: ('AL_DIA' | 'PARCIAL' | 'MORA' | 'PENDIENTE')[] = [
  'AL_DIA', 'AL_DIA', 'AL_DIA', 'AL_DIA', 'AL_DIA',
  'AL_DIA', 'AL_DIA', 'AL_DIA', 'AL_DIA', 'AL_DIA',
  'AL_DIA', 'AL_DIA', 'PARCIAL', 'PARCIAL', 'PARCIAL',
  'PARCIAL', 'PARCIAL', 'MORA', 'MORA', 'MORA',
];

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
               'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export async function POST() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Solo super_admin puede ejecutar el seeder.' }, { status: 403 });
  }

  try {
    // 1. Limpiar club demo existente
    const { data: existingClub } = await adminDb
      .from('clubs').select('id').eq('slug', DEMO_SLUG).maybeSingle();

    if (existingClub) {
      const clubId = existingClub.id;
      await Promise.all([
        adminDb.from('mensualidades').delete().eq('club_id', clubId),
        adminDb.from('pagos').delete().eq('club_id', clubId),
        adminDb.from('uniformes').delete().eq('club_id', clubId),
        adminDb.from('torneos').delete().eq('club_id', clubId),
        adminDb.from('players').delete().eq('club_id', clubId),
        adminDb.from('club_members').delete().eq('club_id', DEMO_SLUG),
      ]);
      await adminDb.from('clubs').delete().eq('id', clubId);
    }

    // 2. Crear usuario demo en Supabase Auth (o reusar si ya existe)
    let demoUserId: string;
    const { data: existingUser } = await adminDb.auth.admin.listUsers();
    const found = existingUser?.users?.find(u => u.email === DEMO_EMAIL);
    if (found) {
      demoUserId = found.id;
    } else {
      const { data: newUser, error: userErr } = await adminDb.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASS,
        email_confirm: true,
        user_metadata: { nombre: 'Admin Demo', club_slug: DEMO_SLUG },
      });
      if (userErr) throw new Error('Error creando usuario demo: ' + userErr.message);
      demoUserId = newUser.user.id;
    }

    // 3. Crear el club demo
    const now = new Date();
    const trialEnds = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const { data: club, error: clubErr } = await adminDb
      .from('clubs')
      .insert({
        slug:          DEMO_SLUG,
        name:          'Academia ZenSports FC',
        is_active:     true,
        owner_user_id: demoUserId,
        celular_admin: '3009999999',
        config: {
          nombre:            'Academia ZenSports FC',
          ciudad:            'Bogotá',
          valor_mensualidad: 70000,
          color:             '#E14924',
          subtitulo:         'Formando campeones desde 2019',
          codigo_pais:       '57',
          plan:              'total',
          trial_ends_at:     trialEnds.toISOString(),
          whatsapp_number:   '573009999999',
          modulos: {
            dashboard:    true,
            jugadores:    true,
            uniformes:    true,
            arbitraje:    true,
            cobro:        true,
            whatsapp:     true,
            conciliacion: true,
            finanzas:     true,
            torneos:      true,
          },
        },
      })
      .select()
      .single();

    if (clubErr) throw new Error('Error creando club demo: ' + clubErr.message);
    const clubUuid = club.id;

    // 4. Vincular usuario al club
    try { await adminDb.from('club_members').insert({ user_id: demoUserId, club_id: DEMO_SLUG }); } catch { /* optional link */ }

    // 5. Crear jugadores
    const jugadoresInsert = JUGADORES.map(j => ({
      club_id:  clubUuid,
      cedula:   j.cedula,
      nombre:   j.nombre,
      apellidos: j.apellidos,
      celular:  j.celular,
      activo:   true,
      categoria: j.categoria,
      equipo:   j.equipo,
      municipio: 'Bogotá',
    }));
    const { error: playersErr } = await adminDb.from('players').insert(jugadoresInsert);
    if (playersErr) throw new Error('Error creando jugadores: ' + playersErr.message);

    // 6. Crear mensualidades para los últimos 3 meses
    const mesActual = now.getMonth(); // 0-indexed
    const anio = now.getFullYear();
    const mensualidades: object[] = [];

    for (let deltaM = 2; deltaM >= 0; deltaM--) {
      let mes = mesActual - deltaM;
      let anioMes = anio;
      if (mes < 0) { mes += 12; anioMes -= 1; }

      JUGADORES.forEach((j, idx) => {
        const estadoBase = deltaM === 0 ? ESTADOS_MES[idx] : 'AL_DIA';
        const valorOficial = 70000;
        let valorPagado = 0;
        let saldoPendiente = valorOficial;
        let estado = estadoBase;

        if (estadoBase === 'AL_DIA') {
          valorPagado = valorOficial;
          saldoPendiente = 0;
        } else if (estadoBase === 'PARCIAL') {
          valorPagado = 35000;
          saldoPendiente = 35000;
        } else if (estadoBase === 'MORA') {
          valorPagado = 0;
          saldoPendiente = valorOficial + 10000; // penalidad
          estado = 'MORA';
        }

        mensualidades.push({
          club_id:    clubUuid,
          cedula:     j.cedula,
          numero_mes: mes + 1,
          mes:        MESES[mes],
          anio:       anioMes,
          valor_oficial:    valorOficial,
          valor_pagado:     valorPagado,
          saldo_pendiente:  saldoPendiente,
          estado,
          penalidad: estadoBase === 'MORA' ? 10000 : 0,
          fecha_ultima_actualizacion: now.toISOString(),
        });
      });
    }

    const { error: mensErr } = await adminDb.from('mensualidades').insert(mensualidades);
    if (mensErr) throw new Error('Error creando mensualidades: ' + mensErr.message);

    // 7. Crear algunos pagos históricos (para los AL_DIA del mes actual)
    const pagosInsert = JUGADORES.slice(0, 12).map(j => ({
      club_id:        clubUuid,
      cedula:         j.cedula,
      monto:          70000,
      banco:          ['Bancolombia', 'Nequi', 'Daviplata', 'Davivienda'][Math.floor(Math.random() * 4)],
      referencia:     `REF${Math.floor(Math.random() * 900000) + 100000}`,
      concepto:       'mensualidad',
      estado_revision: 'aprobado',
      created_at:     new Date(now.getTime() - Math.random() * 10 * 86400000).toISOString(),
    }));
    try { await adminDb.from('pagos').insert(pagosInsert); } catch { /* non-critical */ }

    // 8. Audit log
    await writeAuditLog({
      admin_email:  session.email,
      admin_name:   session.name,
      admin_role:   session.role,
      action:       'DEMO_SEEDED',
      entity_type:  'club',
      entity_id:    DEMO_SLUG,
      details:      { jugadores: JUGADORES.length, meses: 3 },
    });

    return NextResponse.json({
      ok: true,
      club_slug: DEMO_SLUG,
      club_id:   clubUuid,
      jugadores: JUGADORES.length,
      email_demo: DEMO_EMAIL,
      password_demo: DEMO_PASS,
      message: 'Club demo creado exitosamente con 20 jugadores y 3 meses de datos.',
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
