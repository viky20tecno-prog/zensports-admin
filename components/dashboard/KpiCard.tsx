'use client';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: 'indigo' | 'green' | 'yellow' | 'red';
  prefix?: string;
  suffix?: string;
  animate?: boolean;
  trend?: number | null; // % cambio vs período anterior, null = sin datos
}

export function KpiCard({ label, value, sub, color = 'indigo', prefix, suffix, animate: doAnimate = true, trend }: KpiCardProps) {
  const glowMap = {
    indigo: 'glow-blue',
    green:  'glow-green',
    yellow: 'glow-yellow',
    red:    'glow-red',
  };

  const dotMap = {
    indigo: 'bg-indigo-500',
    green:  'bg-green-500',
    yellow: 'bg-yellow-500',
    red:    'bg-red-500',
  };

  const numericValue = typeof value === 'number' ? value : null;
  const count = useMotionValue(0);
  const rounded = useTransform(count, v => Math.round(v));

  useEffect(() => {
    if (doAnimate && numericValue !== null) {
      const controls = animate(count, numericValue, { duration: 1.2, ease: 'easeOut' });
      return controls.stop;
    }
  }, [numericValue, doAnimate, count]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn('glass rounded-2xl p-5 space-y-3', glowMap[color])}
    >
      <div className="flex items-center gap-2">
        <span className={cn('w-2 h-2 rounded-full', dotMap[color])} />
        <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      </div>

      <div className="text-2xl font-bold text-white tabular-nums">
        {prefix}
        {numericValue !== null && doAnimate ? (
          <motion.span>{rounded}</motion.span>
        ) : (
          <span>{value}</span>
        )}
        {suffix}
      </div>

      <div className="flex items-center gap-2">
        {sub && <p className="text-xs text-gray-600 flex-1">{sub}</p>}
        {trend !== undefined && trend !== null && (
          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${trend >= 0 ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </motion.div>
  );
}
