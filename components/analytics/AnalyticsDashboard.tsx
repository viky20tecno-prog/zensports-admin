'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { TrendingUp, Users, Building2, DollarSign, Percent, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatCOP } from '@/lib/utils';

const PLAN_COLORS: Record<string, string> = {
  trial:   '#6B7280',
  starter: '#3B82F6',
  pro:     '#8B5CF6',
  scale:   '#10B981',
  total:   '#10B981',
};

interface AtRiskClub { slug: string; nombre: string; days_in_trial: number; days_left: number }
interface FunnelStage { stage: string; count: number; color: string }

interface AnalyticsData {
  mrr: number; arr: number;
  active: number; trial: number; suspended: number; expired: number; total_clubs: number;
  conversion_rate: number;
  totalPlayers: number; activePlayers: number; totalRevenue: number;
  realMrrThisMonth: number; clubsPaidThisMonth: number; totalBillingRevenue: number;
  growthChart: { mes: string; clubes: number }[];
  revenueChart: { mes: string; ingreso: number; mrrReal: number; mrrTeorico: number }[];
  planChart: { plan: string; count: number }[];
  funnel: FunnelStage[];
  atRiskClubs: AtRiskClub[];
}

function KpiCard({ icon: Icon, label, value, sub, accent }: {
  icon: React.ElementType; label: string; value: string; sub?: string; accent?: string;
}) {
  return (
    <div className={`rounded-xl border bg-white/2 p-4 space-y-2 ${accent ?? 'border-white/8'}`}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-gray-500" />
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-gray-600">{sub}</div>}
    </div>
  );
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-600 text-sm py-12 text-center">Cargando analytics...</div>;
  if (!data)   return <div className="text-red-400 text-sm py-12 text-center">Error cargando datos</div>;

  const mrrGap = data.mrr - data.realMrrThisMonth;
  const collectionRate = data.mrr > 0 ? Math.round(data.realMrrThisMonth / data.mrr * 100) : 0;

  return (
    <div className="space-y-6">

      {/* KPI grid — row 1: negocio */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={DollarSign} label="MRR teórico"   value={formatCOP(data.mrr)}              sub={`ARR: ${formatCOP(data.arr)}`} />
        <KpiCard icon={DollarSign} label="MRR real (mes)" value={formatCOP(data.realMrrThisMonth)} sub={`${collectionRate}% cobrado`}
          accent={collectionRate >= 80 ? 'border-green-500/20' : collectionRate >= 50 ? 'border-yellow-500/20' : 'border-red-500/20'} />
        <KpiCard icon={DollarSign} label="Sin cobrar"     value={formatCOP(Math.max(0, mrrGap))}   sub={`${data.active - data.clubsPaidThisMonth} clubs pendientes`}
          accent={mrrGap > 0 ? 'border-yellow-500/20' : 'border-white/8'} />
        <KpiCard icon={DollarSign} label="Total histórico" value={formatCOP(data.totalBillingRevenue)} sub="desde admin_billing" />
      </div>

      {/* KPI grid — row 2: clubs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={Building2}  label="Clubes activos" value={String(data.active)}          sub={`de ${data.total_clubs} total`} />
        <KpiCard icon={Percent}    label="Conversión"      value={`${data.conversion_rate}%`}  sub="trial → activo" />
        <KpiCard icon={Users}      label="Jugadores"       value={String(data.totalPlayers)}   sub={`${data.activePlayers} activos`} />
        <KpiCard icon={AlertTriangle} label="En riesgo"   value={String(data.atRiskClubs.length)} sub="trial ≤5 días"
          accent={data.atRiskClubs.length > 0 ? 'border-red-500/20' : 'border-white/8'} />
      </div>

      {/* Funnel + At-risk clubs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Funnel de conversión */}
        <div className="rounded-xl border border-white/8 bg-white/2 p-4 space-y-3">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5" /> Funnel de conversión
          </h3>
          <div className="space-y-2">
            {data.funnel.map((stage, i) => {
              const pct = data.funnel[0].count > 0 ? (stage.count / data.funnel[0].count) * 100 : 0;
              return (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">{stage.stage}</span>
                    <span className="text-sm font-bold text-white">{stage.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: stage.color }} />
                  </div>
                  {i < data.funnel.length - 1 && (
                    <p className="text-xs text-gray-700 text-right mt-0.5">{pct.toFixed(0)}% del total</p>
                  )}
                </div>
              );
            })}
          </div>
          <div className="pt-2 border-t border-white/8">
            <p className="text-xs text-gray-600">
              Tasa de conversión real: <span className="text-indigo-400 font-semibold">{data.conversion_rate}%</span> de los trials se convierten en activos
            </p>
          </div>
        </div>

        {/* Clubs en riesgo */}
        <div className="rounded-xl border border-white/8 bg-white/2 p-4 space-y-3">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" /> Trials en riesgo (≤5 días)
          </h3>
          {data.atRiskClubs.length === 0 ? (
            <div className="flex items-center gap-2 py-6 justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <p className="text-sm text-gray-500">Sin clubs en riesgo</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.atRiskClubs.map(club => (
                <Link key={club.slug} href={`/clubs/${club.slug}`}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-white/8 hover:bg-white/5 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-200">{club.nombre}</p>
                    <p className="text-xs text-gray-600">{club.days_in_trial}d en trial</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    club.days_left <= 1 ? 'bg-red-500/15 text-red-400' :
                    club.days_left <= 3 ? 'bg-orange-500/15 text-orange-400' :
                    'bg-yellow-500/15 text-yellow-400'
                  }`}>
                    {club.days_left === 0 ? 'Vence hoy' : `${club.days_left}d`}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MRR real vs teórico por mes */}
      <div className="rounded-xl border border-white/8 bg-white/2 p-4">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">MRR real vs teórico (últimos 6 meses)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.revenueChart} barSize={20} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="mes" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={v => v === 0 ? '0' : `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0F1219', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
              labelStyle={{ color: '#9CA3AF', fontSize: 12 }}
              formatter={(v, name) => [formatCOP(Number(v)), name === 'mrrReal' ? 'MRR real' : 'MRR teórico']} />
            <Legend formatter={v => v === 'mrrReal' ? 'MRR real' : 'MRR teórico'}
              wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }} />
            <Bar dataKey="mrrTeorico" fill="rgba(99,102,241,0.3)" radius={[4, 4, 0, 0]} name="mrrTeorico" />
            <Bar dataKey="mrrReal"    fill="#6366F1"              radius={[4, 4, 0, 0]} name="mrrReal" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom row: plan donut + growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Plan donut */}
        <div className="rounded-xl border border-white/8 bg-white/2 p-4">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Clubes por plan</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={data.planChart} dataKey="count" nameKey="plan" cx="50%" cy="50%"
                innerRadius={45} outerRadius={70} paddingAngle={3}>
                {data.planChart.map(entry => (
                  <Cell key={entry.plan} fill={PLAN_COLORS[entry.plan] || '#6B7280'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#0F1219', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                formatter={(v, name) => [Number(v), String(name)]} />
            </PieChart>
          </ResponsiveContainer>
          <ul className="space-y-1 mt-2">
            {data.planChart.map(p => (
              <li key={p.plan} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PLAN_COLORS[p.plan] || '#6B7280' }} />
                  <span className="text-gray-400 capitalize">{p.plan}</span>
                </div>
                <span className="text-gray-300 font-medium">{p.count}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Growth */}
        <div className="rounded-xl border border-white/8 bg-white/2 p-4">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Nuevos clubes por mes</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.growthChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="mes" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F1219', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                labelStyle={{ color: '#9CA3AF', fontSize: 12 }}
                formatter={(v) => [Number(v), 'Nuevos clubes']} />
              <Line type="monotone" dataKey="clubes" stroke="#6366F1" strokeWidth={2} dot={{ fill: '#6366F1', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
