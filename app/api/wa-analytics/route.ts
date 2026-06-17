import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { canAccess } from '@/lib/rbac';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'view_analytics')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const now = new Date();
  const hace24h = new Date(now.getTime() - 86400000).toISOString();
  const hace7d  = new Date(now.getTime() - 7 * 86400000).toISOString();
  const hace30d = new Date(now.getTime() - 30 * 86400000).toISOString();

  const [{ data: sessions }, { data: leads }, { data: clubs }] = await Promise.all([
    adminDb.from('wa_sessions').select('phone, rol, updated_at, messages, last_interaction, tools_used, contexto').order('updated_at', { ascending: false }),
    adminDb.from('leads').select('created_at, fuente, nombre_club, deporte, ciudad').eq('fuente', 'whatsapp').order('created_at', { ascending: false }),
    adminDb.from('clubs').select('id, slug, config').not('config->wa_metrics', 'is', null),
  ]);

  const allSessions = sessions || [];
  const allLeads    = leads    || [];
  const allClubs    = clubs    || [];

  // Sesiones por rol
  const porRol = { admin: 0, jugador: 0, visitante: 0, unknown: 0 };
  allSessions.forEach(s => {
    const rol = s.rol as string;
    if (rol === 'admin' || rol === 'jugador' || rol === 'visitante') porRol[rol]++;
    else porRol.unknown++;
  });

  // Activos por ventana de tiempo
  const activos24h = allSessions.filter(s => (s.last_interaction || s.updated_at) >= hace24h).length;
  const activos7d  = allSessions.filter(s => (s.last_interaction || s.updated_at) >= hace7d).length;
  const activos30d = allSessions.filter(s => (s.last_interaction || s.updated_at) >= hace30d).length;

  // Total mensajes
  const totalMensajes = allSessions.reduce((sum, s) => {
    return sum + (Array.isArray(s.messages) ? s.messages.length : 0);
  }, 0);

  // Herramientas más usadas — agregado global
  const toolsGlobal: Record<string, number> = {};
  allSessions.forEach(s => {
    const tools = s.tools_used as Record<string, number> | null;
    if (!tools) return;
    Object.entries(tools).forEach(([tool, count]) => {
      toolsGlobal[tool] = (toolsGlobal[tool] || 0) + count;
    });
  });
  const topTools = Object.entries(toolsGlobal)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tool, count]) => ({ tool, count }));

  // Actividad por día — últimos 14 días
  const actividadDias: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000).toISOString().split('T')[0];
    actividadDias[d] = 0;
  }
  allSessions.forEach(s => {
    const fecha = ((s.last_interaction || s.updated_at) as string).split('T')[0];
    if (actividadDias[fecha] !== undefined) actividadDias[fecha]++;
  });
  const actividadChart = Object.entries(actividadDias).map(([fecha, sesiones]) => ({
    fecha: fecha.slice(5), // MM-DD
    sesiones,
  }));

  // Métricas de recordatorios por club
  const recordatoriosClubs = allClubs
    .map(c => ({
      slug: c.slug,
      nombre: c.config?.nombre || c.slug,
      total_recordatorios: c.config?.wa_metrics?.total_recordatorios || 0,
      ultimo_recordatorio: c.config?.wa_metrics?.ultimo_recordatorio?.fecha || null,
      ultimo_enviados: c.config?.wa_metrics?.ultimo_recordatorio?.enviados || 0,
    }))
    .filter(c => c.total_recordatorios > 0)
    .sort((a, b) => b.total_recordatorios - a.total_recordatorios);

  // Leads vía WA por mes (últimos 6 meses)
  const leadsChart: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    leadsChart[key] = 0;
  }
  allLeads.forEach(l => {
    const key = (l.created_at as string).slice(0, 7);
    if (leadsChart[key] !== undefined) leadsChart[key]++;
  });
  const leadsChartArr = Object.entries(leadsChart).map(([mes, leads]) => ({
    mes: mes.slice(5), // MM
    leads,
  }));

  // Últimas 10 conversaciones
  const ultimasConversaciones = allSessions.slice(0, 10).map(s => ({
    phone: String(s.phone || '').slice(-4).padStart(String(s.phone || '').length, '*'),
    rol:   s.rol,
    ultima_interaccion: s.last_interaction || s.updated_at,
    mensajes: Array.isArray(s.messages) ? s.messages.length : 0,
    club: (s.contexto as Record<string, string> | null)?.club_nombre || null,
  }));

  return NextResponse.json({
    resumen: {
      total_sesiones:  allSessions.length,
      activos_hoy:     activos24h,
      activos_semana:  activos7d,
      activos_mes:     activos30d,
      total_mensajes:  totalMensajes,
      leads_wa:        allLeads.length,
    },
    porRol,
    topTools,
    actividadChart,
    leadsChart: leadsChartArr,
    recordatoriosClubs,
    ultimasConversaciones,
  });
}
