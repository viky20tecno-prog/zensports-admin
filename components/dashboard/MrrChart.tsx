'use client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DataPoint {
  month: string;
  mrr: number;
}

function formatCOPShort(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

export function MrrChart({ data }: { data: DataPoint[] }) {
  return (
    <div className="glass rounded-2xl p-5 h-64">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">MRR Mensual</p>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#6366F1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={formatCOPShort} tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#0E1219', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, color: '#F0F4FF' }}
            formatter={(v) => [formatCOPShort(Number(v)), 'MRR']}
          />
          <Area type="monotone" dataKey="mrr" stroke="#6366F1" strokeWidth={2} fill="url(#mrrGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
