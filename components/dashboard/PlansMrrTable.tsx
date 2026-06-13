'use client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { TrendingUp, ArrowUpRight } from 'lucide-react';
import { formatCOP } from '@/lib/utils';

export interface PlanStat {
  plan: string;
  clubs: number;
  mrr: number;
}

interface Props {
  plans: PlanStat[];
  upgradeStarterPro: number;
  upgradeProScale: number;
}

const PLAN_LABEL: Record<string, string> = {
  trial:   'Trial',
  starter: 'Starter',
  pro:     'Pro',
  scale:   'Scale',
  total:   'Scale',
};

const PLAN_COLOR: Record<string, string> = {
  trial:   '#6B7280',
  starter: '#3B82F6',
  pro:     '#6366F1',
  scale:   '#C678FF',
  total:   '#C678FF',
};

const ORDER = ['trial', 'starter', 'pro', 'scale'];

function CustomTooltip({ active, payload, label }: Record<string, unknown>) {
  if (!active || !Array.isArray(payload) || !payload.length) return null;
  const d = payload[0];
  return (
    <div className="bg-[#0f1219] border border-white/10 rounded-xl px-4 py-3 text-xs shadow-xl">
      <p className="font-bold text-white mb-1">{String(label)}</p>
      <p className="text-gray-400">MRR: <span className="text-white font-semibold">{formatCOP(Number(d.value))}</span></p>
      <p className="text-gray-400">Clubes: <span className="text-white font-semibold">{Number((d.payload as { clubs: number }).clubs)}</span></p>
    </div>
  );
}

export function PlansMrrTable({ plans, upgradeStarterPro, upgradeProScale }: Props) {
  const sorted = ORDER
    .map(p => plans.find(s => s.plan === p) ?? { plan: p, clubs: 0, mrr: 0 })
    .filter(s => s.clubs > 0 || s.plan === 'trial');

  const chartData = sorted.map(s => ({
    name: PLAN_LABEL[s.plan] ?? s.plan,
    mrr: s.mrr,
    clubs: s.clubs,
    plan: s.plan,
  }));

  const totalMrr = sorted.reduce((sum, s) => sum + s.mrr, 0);

  return (
    <div className="glass rounded-2xl p-5 space-y-5">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-indigo-400" />
        <h3 className="text-sm font-semibold text-gray-300">Planes y MRR</h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left pb-2 text-gray-600 font-semibold uppercase tracking-wider">Plan</th>
              <th className="text-right pb-2 text-gray-600 font-semibold uppercase tracking-wider">Clubes</th>
              <th className="text-right pb-2 text-gray-600 font-semibold uppercase tracking-wider">MRR</th>
              <th className="text-right pb-2 text-gray-600 font-semibold uppercase tracking-wider">Ticket prom.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/4">
            {sorted.map(stat => {
              const ticket = stat.clubs > 0 ? Math.round(stat.mrr / stat.clubs) : 0;
              const pct = totalMrr > 0 ? Math.round((stat.mrr / totalMrr) * 100) : 0;
              return (
                <tr key={stat.plan} className="hover:bg-white/3 transition-colors">
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: PLAN_COLOR[stat.plan] ?? '#6B7280' }}
                      />
                      <span className="font-medium text-gray-200">{PLAN_LABEL[stat.plan] ?? stat.plan}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right text-gray-300 tabular-nums">{stat.clubs}</td>
                  <td className="py-2.5 text-right text-gray-200 font-semibold tabular-nums">
                    {stat.mrr > 0 ? formatCOP(stat.mrr) : <span className="text-gray-600">—</span>}
                    {pct > 0 && <span className="ml-1 text-[10px] text-gray-600">{pct}%</span>}
                  </td>
                  <td className="py-2.5 text-right tabular-nums">
                    {ticket > 0
                      ? <span className="text-indigo-400 font-medium">{formatCOP(ticket)}</span>
                      : <span className="text-gray-700">—</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: '#4B5563' }} axisLine={false} tickLine={false}
            tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="mrr" radius={[4, 4, 0, 0]}>
            {chartData.map(d => (
              <Cell key={d.plan} fill={PLAN_COLOR[d.plan] ?? '#6B7280'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Upgrade metrics */}
      {(upgradeStarterPro > 0 || upgradeProScale > 0) && (
        <div className="pt-3 border-t border-white/5 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-500/6 border border-indigo-500/15">
            <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <div>
              <p className="text-[11px] text-gray-500">Starter → Pro</p>
              <p className="text-sm font-bold text-indigo-400">{upgradeStarterPro}</p>
            </div>
            <span className="ml-auto text-[10px] text-gray-600">30d</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/6 border border-purple-500/15">
            <ArrowUpRight className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <div>
              <p className="text-[11px] text-gray-500">Pro → Scale</p>
              <p className="text-sm font-bold text-purple-400">{upgradeProScale}</p>
            </div>
            <span className="ml-auto text-[10px] text-gray-600">30d</span>
          </div>
        </div>
      )}
    </div>
  );
}
