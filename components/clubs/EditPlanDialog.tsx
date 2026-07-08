'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ClubWithMetrics } from '@/types/club';

const PLANS = [
  { value: 'free',    label: 'Free (20 jugadores, siempre)' },
  { value: 'trial',   label: 'Trial (gratis)' },
  { value: 'starter', label: 'Starter — $149.000/mes' },
  { value: 'pro',     label: 'Pro — $399.000/mes' },
  { value: 'scale',   label: 'Scale — $799.000/mes' },
];

interface Props {
  club: ClubWithMetrics;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditPlanDialog({ club, open, onClose, onSuccess }: Props) {
  const [plan, setPlan] = useState(club.config.plan);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setLoading(true);
    setError('');
    const res = await fetch(`/api/clubs/${club.slug}/plan`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    setLoading(false);
    if (!res.ok) { setError('Error al cambiar plan'); return; }
    onSuccess();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0F1219] border-white/10 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">Cambiar plan — {club.config.nombre}</DialogTitle>
        </DialogHeader>

        <div className="py-2">
          <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Plan</label>
          <Select value={plan} onValueChange={v => setPlan(v as typeof plan)}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0F1219] border-white/10">
              {PLANS.map(p => (
                <SelectItem key={p.value} value={p.value} className="text-gray-200 focus:bg-white/10 focus:text-white">
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">Cancelar</Button>
          <Button onClick={handleSave} disabled={loading || plan === club.config.plan}
            className="bg-indigo-600 hover:bg-indigo-500 text-white">
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
