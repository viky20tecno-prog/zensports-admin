'use client';
import { cn } from '@/lib/utils';
import type { ClubStatus } from '@/types/club';

const CONFIG: Record<ClubStatus, { label: string; className: string }> = {
  active:    { label: 'Activo',    className: 'bg-green-500/15 text-green-400 border-green-500/25' },
  trial:     { label: 'Trial',     className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25' },
  expired:   { label: 'Expirado', className: 'bg-red-500/15 text-red-400 border-red-500/25' },
  suspended: { label: 'Suspendido', className: 'bg-gray-500/15 text-gray-400 border-gray-500/25' },
};

export function ClubStatusBadge({ status }: { status: ClubStatus }) {
  const { label, className } = CONFIG[status];
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border', className)}>
      {label}
    </span>
  );
}
