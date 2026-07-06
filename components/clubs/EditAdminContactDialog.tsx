'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, UserCog } from 'lucide-react';
import { PhoneInput } from '@/components/ui/phone-input';

interface Props {
  slug:          string;
  currentEmail:  string;
  currentCelular: string;
  canChangeEmail?: boolean;
  open:          boolean;
  onClose:       () => void;
  onSuccess:     (email: string, celular: string) => void;
}

export function EditAdminContactDialog({ slug, currentEmail, currentCelular, canChangeEmail = false, open, onClose, onSuccess }: Props) {
  const [email,   setEmail]   = useState(currentEmail);
  const [celular, setCelular] = useState(currentCelular);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleSave() {
    setError(''); setLoading(true);
    try {
      const body: Record<string, string> = {};
      if (email !== currentEmail)     body.email          = email;
      if (celular !== currentCelular) body.celular_admin  = celular;
      if (Object.keys(body).length === 0) { onClose(); return; }

      const res  = await fetch(`/api/clubs/${slug}/admin-contact`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Error al guardar'); return; }
      onSuccess(email, celular);
      onClose();
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0F1219] border-white/10 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <UserCog className="w-4 h-4 text-indigo-400" /> Cambiar contacto admin
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-4">
          <p className="text-xs text-gray-500">
            Actualiza el email de acceso al dashboard y el número WhatsApp del administrador del club.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Email del admin</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@email.com"
              disabled={!canChangeEmail}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-[10px] text-gray-600">
              {canChangeEmail ? 'Cuenta de acceso al dashboard del club' : 'Solo un Super Admin puede cambiar el email de acceso'}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">WhatsApp admin (bot)</label>
            <PhoneInput
              value={celular}
              onChange={setCelular}
              placeholder="3001234567"
            />
            <p className="text-[10px] text-gray-600">Número que el bot Zen reconoce como administrador</p>
          </div>

          {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">Cancelar</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Guardando…</> : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
