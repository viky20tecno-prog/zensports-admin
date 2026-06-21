'use client';
import { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import { MessageSquare, Users, Bot, TrendingUp, Zap, Send } from 'lucide-react';

const ROL_COLORS: Record<string, string> = {
  admin:     '#AE68FF',
  jugador:   '#22C55E',
  visitante: '#F59E0B',
};
const ROL_LABEL: Record<string, string> = {
  admin: 'Admins', jugador: 'Jugadores', visitante: 'Visitantes',
};

interface WAData {
  resumen: {
    total_sesiones: number; activos_hoy: number; activos_semana: number;
    activos_mes: number; total_mensajes: number; leads_wa: number;
  };
  porRol: { admin: number; jugador: number; visitante: number; unknown: number };
  topTools: { tool: string; count: number }[];
  actividadChart: { fecha: string; sesiones: number }[];
  leadsChart: { mes: string; leads: number }[];
  recordatoriosClubs: { slug: string; nombre: string; total_recordatorios: number; ultimo_recordatorio: string | null; ultimo_enviados: number }[];
  mensajesPorClub: { club: string; sesiones: number; mensajes: number }[];
  ultimasConversaciones: { phone: string; rol: string; ultima_interaccion: string; mensajes: number; club: string | null }[];
}

const TOOL_LABEL: Record<string, string> = {
  consultar_pagos:          'Consultar pagos',
  consultar_morosos:        'Ver morosos',
  enviar_recordatorio_pago: 'Recordatorio masivo',
  buscar_jugador:           'Buscar jugador',
  consultar_calendario:     'Calendario',
  consultar_partidos:       'Partidos',
  consultar_asistencia:     'Asistencia',
  consultar_pagos_club:     'Resumen club',
  info_zensports:           'Info ZenSports',
  registrar_lead:           'Registrar lead',
  obtener_carnet:           'Carnet digital',
  enviar_mensaje_jugador:   'Mensaje individual',
  consultar_asistencia_hoy: 'Asistencia hoy',
  consultar_metricas_wa:    'Métricas WA',
};

function KpiCard({ icon: Icon, label, value, sub, accent = '' }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; accent?: string;
}) {
  return (
    <div className={`rounded-xl border bg-white/2 p-4 space-y-2 ${accent || 'border-white/8'}`}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-gray-500" />
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-gray-600">{sub}</div>}
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function WAAnalytics() {
  const [data, setData] = useState<WAData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/wa-analytics')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-600 text-sm py-12 text-center">Cargando analítica WhatsApp...</div>;
  if (!data)   return <div className="text-red-400 text-sm py-12 text-center">Error cargando datos</div>;

  const { resumen, porRol, topTools, actividadChart, leadsChart, recordatoriosClubs, mensajesPorClub, ultimasConversaciones } = data;
  const totalRol = porRol.admin + porRol.jugador + porRol.visitante;

  return (
    <div className="space-y-6">

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard icon={Users}         label="Sesiones totales" value={resumen.total_sesiones} />
        <KpiCard icon={Zap}           label="Activos hoy"      value={resumen.activos_hoy}    accent={resumen.activos_hoy > 0 ? 'border-violet-500/20' : ''} />
        <KpiCard icon={TrendingUp}    label="Activos 7 días"   value={resumen.activos_semana} />
        <KpiCard icon={MessageSquare} label="Mensajes totales" value={resumen.total_mensajes} />
        <KpiCard icon={Bot}           label="Leads vía WA"     value={resumen.leads_wa}       accent={resumen.leads_wa > 0 ? 'border-green-500/20' : ''} />
        <KpiCard icon={Send}          label="Activos 30 días"  value={resumen.activos_mes}    />
      </div>

      {/* Actividad + roles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Actividad 14 días */}
        <div className="lg:col-span-2 rounded-xl border border-white/8 bg-white/2 p-4">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Sesiones activas — últimos 14 días</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={actividadChart} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="fecha" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F1219', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                labelStyle={{ color: '#9CA3AF', fontSize: 11 }}
                formatter={(v) => [Number(v), 'Sesiones']} />
              <Bar dataKey="sesiones" fill="#6A00FF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Breakdown por rol */}
        <div className="rounded-xl border border-white/8 bg-white/2 p-4">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Usuarios por rol</h3>
          <div className="space-y-3 mt-2">
            {(['admin', 'jugador', 'visitante'] as const).map(rol => {
              const count = porRol[rol];
              const pct   = totalRol > 0 ? Math.round(count / totalRol * 100) : 0;
              return (
                <div key={rol}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium" style={{ color: ROL_COLORS[rol] }}>{ROL_LABEL[rol]}</span>
                    <span className="text-sm font-bold text-white">{count} <span className="text-xs text-gray-600">({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: ROL_COLORS[rol] }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-white/6 text-xs text-gray-600">
            Total sesiones únicas: <span className="text-gray-400 font-semibold">{resumen.total_sesiones}</span>
          </div>
        </div>
      </div>

      {/* Herramientas más usadas + leads WA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Top tools */}
        <div className="rounded-xl border border-white/8 bg-white/2 p-4">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Herramientas más usadas por el bot</h3>
          {topTools.length === 0 ? (
            <p className="text-xs text-gray-600 py-6 text-center">Sin datos de herramientas aún. Las conversaciones nuevas empezarán a rastrear esto.</p>
          ) : (
            <div className="space-y-2">
              {topTools.map((t, i) => {
                const max = topTools[0].count;
                const pct = Math.round(t.count / max * 100);
                return (
                  <div key={t.tool}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs text-gray-400">{TOOL_LABEL[t.tool] || t.tool}</span>
                      <span className="text-xs font-bold text-white">{t.count}</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: i === 0 ? '#AE68FF' : i < 3 ? '#6A00FF' : 'rgba(174,104,255,0.4)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Leads WA por mes */}
        <div className="rounded-xl border border-white/8 bg-white/2 p-4">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Leads capturados por WhatsApp (6 meses)</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={leadsChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="mes" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F1219', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                labelStyle={{ color: '#9CA3AF', fontSize: 12 }}
                formatter={(v) => [Number(v), 'Leads WA']} />
              <Line type="monotone" dataKey="leads" stroke="#22C55E" strokeWidth={2} dot={{ fill: '#22C55E', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-600 mt-2">Total acumulado: <span className="text-green-400 font-semibold">{resumen.leads_wa}</span> leads vía bot</p>
        </div>
      </div>

      {/* Recordatorios por club */}
      {recordatoriosClubs.length > 0 && (
        <div className="rounded-xl border border-white/8 bg-white/2 p-4">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Recordatorios de cobro enviados por club</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/6">
                  <th className="text-left text-xs text-gray-600 font-medium pb-2 pr-4">Club</th>
                  <th className="text-right text-xs text-gray-600 font-medium pb-2 pr-4">Total enviados</th>
                  <th className="text-right text-xs text-gray-600 font-medium pb-2 pr-4">Último batch</th>
                  <th className="text-right text-xs text-gray-600 font-medium pb-2">Último envío</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {recordatoriosClubs.map(c => (
                  <tr key={c.slug} className="hover:bg-white/3 transition-colors">
                    <td className="py-2 pr-4 text-gray-200 font-medium">{c.nombre}</td>
                    <td className="py-2 pr-4 text-right text-violet-400 font-bold">{c.total_recordatorios}</td>
                    <td className="py-2 pr-4 text-right text-gray-400">{c.ultimo_enviados > 0 ? `${c.ultimo_enviados} msgs` : '—'}</td>
                    <td className="py-2 text-right text-gray-600 text-xs">
                      {c.ultimo_recordatorio ? new Date(c.ultimo_recordatorio).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mensajes por club este mes */}
      {mensajesPorClub && mensajesPorClub.length > 0 && (
        <div className="rounded-xl border border-white/8 bg-white/2 p-4">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Mensajes por club — este mes</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/6">
                  <th className="text-left text-xs text-gray-600 font-medium pb-2 pr-4">Club</th>
                  <th className="text-right text-xs text-gray-600 font-medium pb-2 pr-4">Sesiones</th>
                  <th className="text-right text-xs text-gray-600 font-medium pb-2">Mensajes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {mensajesPorClub.map((c, i) => (
                  <tr key={i} className="hover:bg-white/3 transition-colors">
                    <td className="py-2 pr-4 text-gray-200 font-medium">{c.club}</td>
                    <td className="py-2 pr-4 text-right text-gray-400">{c.sesiones}</td>
                    <td className="py-2 text-right text-violet-400 font-bold">{c.mensajes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Últimas conversaciones */}
      <div className="rounded-xl border border-white/8 bg-white/2 p-4">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Últimas conversaciones</h3>
        {ultimasConversaciones.length === 0 ? (
          <p className="text-xs text-gray-600 py-4 text-center">Sin conversaciones registradas aún.</p>
        ) : (
          <div className="space-y-1">
            {ultimasConversaciones.map((c, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/4 transition-colors">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                  style={{ background: `${ROL_COLORS[c.rol] || '#6B7280'}18`, color: ROL_COLORS[c.rol] || '#6B7280', border: `1px solid ${ROL_COLORS[c.rol] || '#6B7280'}30` }}>
                  {c.rol === 'admin' ? 'A' : c.rol === 'jugador' ? 'J' : 'V'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-300">{c.phone}</span>
                    {c.club && <span className="text-xs text-gray-600 truncate">· {c.club}</span>}
                  </div>
                  <div className="text-[10px] text-gray-600 capitalize">{ROL_LABEL[c.rol] || c.rol} · {c.mensajes} mensajes</div>
                </div>
                <span className="text-xs text-gray-700 shrink-0">{timeAgo(c.ultima_interaccion)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
