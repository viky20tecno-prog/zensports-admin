'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const INITIAL = { nombre_club: '', ciudad: '', email: '', password: '', nombre_admin: '', celular_admin: '' };

export function CreateClubDialog({ open, onClose, onSuccess }: Props) {
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleCreate() {
    setError('');
    setLoading(true);
    const res = await fetch('/api/clubs/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setError(json.error || 'Error creando club'); return; }
    setForm(INITIAL);
    onSuccess();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { setError(''); setForm(INITIAL); onClose(); } }}>
      <DialogContent className="bg-[#0F1219] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Crear nuevo club</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Nombre del club *</label>
              <Input value={form.nombre_club} onChange={e => set('nombre_club', e.target.value)}
                placeholder="ej. Club Atlético Norte"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-9" />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Ciudad</label>
              <Input value={form.ciudad} onChange={e => set('ciudad', e.target.value)}
                placeholder="ej. Bogotá"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-9" />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Celular admin</label>
              <Input value={form.celular_admin} onChange={e => set('celular_admin', e.target.value)}
                placeholder="3001234567"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-9" />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Nombre admin</label>
              <Input value={form.nombre_admin} onChange={e => set('nombre_admin', e.target.value)}
                placeholder="Nombre del presidente"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-9" />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Email *</label>
              <Input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="admin@club.com"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-9" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Contraseña inicial *</label>
              <Input type="text" value={form.password} onChange={e => set('password', e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-9" />
              <p className="text-xs text-gray-600 mt-1">El club puede cambiarla desde su perfil.</p>
            </div>
          </div>

          {error && <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">Cancelar</Button>
          <Button onClick={handleCreate} disabled={loading || !form.nombre_club || !form.email || !form.password}
            className="bg-indigo-600 hover:bg-indigo-500 text-white">
            {loading ? 'Creando...' : 'Crear club'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
