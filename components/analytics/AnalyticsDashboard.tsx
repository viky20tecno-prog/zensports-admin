'use client';
import { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { TrendingUp, Users, Building2, DollarSign, Percent, UserCheck } from 'lucide-react';
import { formatCOP } from '@/lib/utils';

const PLAN_COLORS: Record<string, string> = {
  trial:   '#6B7280',
  starter: '#3B82F6',
  pro:     '#8B5CF6',
  total:   '#10B981',
};

interface AnalyticsData {
  mrr: number; arr: number;
  active: number; trial: number; suspended: number; expired: number; total_clubs: number;
  conversion_rate: number;
  totalPlayers: number; activePlayers: number; totalRevenue: number;
  growthChart: { mes: string; clubes: number }[];
  revenueChart: { mes: string; ingreso: number }[];
  planChart: { plan: string; count: number }[];
}

function KpiCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/2 p-4 space-y-2">
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

  return (
    <div className="space-y-6">
      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard icon={DollarSign} label="MRR"          value={formatCOP(data.mrr)}    sub={`ARR: ${formatCOP(data.arr)}`} />
        <KpiCard icon={DollarSign} label="Ingresos tot." value={formatCOP(data.totalRevenue)} sub="pagos aprobados" />
        <KpiCard icon={Building2}  label="Clubes"        value={String(data.total_clubs)} sub={`${data.active} activos · ${data.trial} trial`} />
        <KpiCard icon={Percent}    label="Conversión"    value={`${data.conversion_rate}%`} sub="trial → activo" />
        <KpiCard icon={Users}      label="Jugadores"     value={String(data.totalPlayers)} sub={`${data.activePlayers} activos`} />
        <KpiCard icon={UserCheck}  label="Suspendidos"   value={String(data.suspended)} sub={`${data.expired} expirados`} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue bar chart */}
        <div className="lg:col-span-2 rounded-xl border border-white/8 bg-white/2 p-4">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Ingresos por mes (COP)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.revenueChart} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="mes" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => v === 0 ? '0' : `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F1219', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                labelStyle={{ color: '#9CA3AF', fontSize: 12 }}
                formatter={(v) => [formatCOP(Number(v)), 'Ingresos']} />
              <Bar dataKey="ingreso" fill="#6366F1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

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
      </div>

      {/* Growth line chart */}
      <div className="rounded-xl border border-white/8 bg-white/2 p-4">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Nuevos clubes por mes</h3>
        <ResponsiveContainer width="100%" height={160}>
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
  );
}
