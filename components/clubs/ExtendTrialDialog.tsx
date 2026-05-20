'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ClubWithMetrics } from '@/types/club';

const PRESETS = [3, 5, 7, 14, 30];

interface Props {
  club: ClubWithMetrics;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ExtendTrialDialog({ club, open, onClose, onSuccess }: Props) {
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setLoading(true);
    setError('');
    const res = await fetch(`/api/clubs/${club.slug}/trial`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days }),
    });
    setLoading(false);
    if (!res.ok) { setError('Error al extender trial'); return; }
    onSuccess();
    onClose();
  }

  const currentExpiry = club.config.trial_ends_at
    ? new Date(club.config.trial_ends_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Sin fecha';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0F1219] border-white/10 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">Extender trial — {club.config.nombre}</DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-4">
          <p className="text-xs text-gray-400">Vencimiento actual: <span className="text-gray-200">{currentExpiry}</span></p>

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Días a agregar</label>
            <div className="flex gap-2 flex-wrap">
              {PRESETS.map(d => (
                <button key={d} onClick={() => setDays(d)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    days === d
                      ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}>
                  +{d}d
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">Cancelar</Button>
          <Button onClick={handleSave} disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white">
            {loading ? 'Guardando...' : `Agregar ${days} días`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
