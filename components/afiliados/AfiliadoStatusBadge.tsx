'use client';
import { cn } from '@/lib/utils';
import type { AfiliadoEstado, AfiliadoTier } from '@/types/afiliado';

const ESTADO_CONFIG: Record<AfiliadoEstado, { label: string; className: string }> = {
  activo:         { label: 'Activo',         className: 'bg-green-500/15 text-green-400 border-green-500/25' },
  pendiente_pago: { label: 'Pendiente pago', className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25' },
  inactivo:       { label: 'Inactivo',       className: 'bg-gray-500/15 text-gray-400 border-gray-500/25' },
  vencido:        { label: 'Vencido',        className: 'bg-red-500/15 text-red-400 border-red-500/25' },
};

export function AfiliadoStatusBadge({ estado }: { estado: AfiliadoEstado }) {
  const cfg = ESTADO_CONFIG[estado] ?? ESTADO_CONFIG.pendiente_pago;
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border', cfg.className)}>
      {cfg.label}
    </span>
  );
}

const TIER_CONFIG: Record<AfiliadoTier, { label: string; className: string }> = {
  bronce: { label: 'Bronce', className: 'bg-orange-500/15 text-orange-300 border-orange-500/25' },
  plata:  { label: 'Plata',  className: 'bg-slate-400/15 text-slate-300 border-slate-400/25' },
  oro:    { label: 'Oro',    className: 'bg-amber-400/15 text-amber-300 border-amber-400/25' },
};

export function AfiliadoTierBadge({ tier }: { tier: AfiliadoTier }) {
  const cfg = TIER_CONFIG[tier] ?? TIER_CONFIG.bronce;
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border capitalize', cfg.className)}>
      {cfg.label}
    </span>
  );
}
