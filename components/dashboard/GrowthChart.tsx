'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DataPoint {
  month: string;
  clubs: number;
}

export function GrowthChart({ data }: { data: DataPoint[] }) {
  return (
    <div className="glass rounded-2xl p-5 h-64">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Clubes Nuevos / Mes</p>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#0E1219', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, color: '#F0F4FF' }}
            formatter={(v) => [v, 'Clubes']}
          />
          <Bar dataKey="clubs" fill="#22C55E" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
