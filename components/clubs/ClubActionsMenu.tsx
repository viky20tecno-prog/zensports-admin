'use client';
import { useState } from 'react';
import { MoreHorizontal, CreditCard, Clock, Ban, Unlock, Trash2 } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditPlanDialog } from './EditPlanDialog';
import { ExtendTrialDialog } from './ExtendTrialDialog';
import type { ClubWithMetrics } from '@/types/club';

interface Props {
  club: ClubWithMetrics;
  canChangePlan: boolean;
  canSuspend: boolean;
  canExtendTrial: boolean;
  canDelete: boolean;
  onRefresh: () => void;
}

export function ClubActionsMenu({ club, canChangePlan, canSuspend, canExtendTrial, canDelete, onRefresh }: Props) {
  const [dialog, setDialog] = useState<'plan' | 'trial' | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSuspend() {
    if (!confirm(`¿Suspender ${club.config.nombre}?`)) return;
    setBusy(true);
    await fetch(`/api/clubs/${club.slug}/suspend`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    setBusy(false);
    onRefresh();
  }

  async function handleUnlock() {
    if (!confirm(`¿Reactivar ${club.config.nombre}?`)) return;
    setBusy(true);
    await fetch(`/api/clubs/${club.slug}/unlock`, { method: 'POST' });
    setBusy(false);
    onRefresh();
  }

  async function handleDelete() {
    const nombre = club.config.nombre;
    if (!confirm(`⚠️ Esto eliminará permanentemente "${nombre}" y todos sus datos.\n\n¿Estás seguro?`)) return;
    if (!confirm(`Confirma de nuevo: ¿eliminar "${nombre}" para siempre?`)) return;
    setBusy(true);
    await fetch(`/api/clubs/${club.slug}/delete`, { method: 'DELETE' });
    setBusy(false);
    onRefresh();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="h-7 w-7 flex items-center justify-center rounded text-gray-500 hover:text-white hover:bg-white/10 disabled:opacity-50 transition-colors"
          disabled={busy}
        >
          <MoreHorizontal className="w-4 h-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-[#0F1219] border-white/10 text-gray-200 w-48">
          {canChangePlan && (
            <DropdownMenuItem onClick={() => setDialog('plan')} className="gap-2 cursor-pointer hover:bg-white/10 focus:bg-white/10">
              <CreditCard className="w-3.5 h-3.5" /> Cambiar plan
            </DropdownMenuItem>
          )}
          {canExtendTrial && (club.status === 'trial' || club.status === 'expired') && (
            <DropdownMenuItem onClick={() => setDialog('trial')} className="gap-2 cursor-pointer hover:bg-white/10 focus:bg-white/10">
              <Clock className="w-3.5 h-3.5" /> Extender trial
            </DropdownMenuItem>
          )}
          {canSuspend && (
            <>
              <DropdownMenuSeparator className="bg-white/10" />
              {club.status === 'suspended' ? (
                <DropdownMenuItem onClick={handleUnlock} className="gap-2 cursor-pointer text-green-400 hover:bg-green-500/10 focus:bg-green-500/10">
                  <Unlock className="w-3.5 h-3.5" /> Reactivar
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={handleSuspend} className="gap-2 cursor-pointer text-red-400 hover:bg-red-500/10 focus:bg-red-500/10">
                  <Ban className="w-3.5 h-3.5" /> Suspender
                </DropdownMenuItem>
              )}
            </>
          )}
          {canDelete && (
            <>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem onClick={handleDelete} className="gap-2 cursor-pointer text-red-500 hover:bg-red-500/10 focus:bg-red-500/10 font-medium">
                <Trash2 className="w-3.5 h-3.5" /> Eliminar club
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {dialog === 'plan' && (
        <EditPlanDialog club={club} open onClose={() => setDialog(null)} onSuccess={onRefresh} />
      )}
      {dialog === 'trial' && (
        <ExtendTrialDialog club={club} open onClose={() => setDialog(null)} onSuccess={onRefresh} />
      )}
    </>
  );
}
