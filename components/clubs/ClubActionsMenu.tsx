'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, CreditCard, Clock, Ban, Unlock, Trash2, Mail, KeyRound, X, Copy, Check, MessageCircle, UserCheck } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditPlanDialog } from './EditPlanDialog';
import { ExtendTrialDialog } from './ExtendTrialDialog';
import type { ClubWithMetrics } from '@/types/club';

interface ResetResult {
  email: string;
  reset_link: string;
  email_sent: boolean;
}

interface Props {
  club: ClubWithMetrics;
  canChangePlan: boolean;
  canSuspend: boolean;
  canExtendTrial: boolean;
  canDelete: boolean;
  canResetPassword?: boolean;
  canChangeEmail?: boolean;
  canImpersonate?: boolean;
  onRefresh?: (() => void) | undefined;
  redirectOnDelete?: string;
}

export function ClubActionsMenu({ club, canChangePlan, canSuspend, canExtendTrial, canDelete, canResetPassword, canChangeEmail, canImpersonate, onRefresh, redirectOnDelete }: Props) {
  const router = useRouter();
  const [dialog, setDialog] = useState<'plan' | 'trial' | null>(null);
  const [busy, setBusy] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);
  const [resetResult, setResetResult] = useState<ResetResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [emailDialog, setEmailDialog] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);

  async function handleImpersonate() {
    if (!confirm(`¿Impersonar a ${club.config.nombre}?\n\nSe abrirá el dashboard como si fueras el administrador del club. Esta acción queda registrada en auditoría.`)) return;
    setBusy(true);
    const res = await fetch(`/api/clubs/${club.slug}/impersonate`, { method: 'POST' });
    setBusy(false);
    if (res.ok) {
      const { magic_link } = await res.json();
      window.open(magic_link, '_blank', 'noopener,noreferrer');
    } else {
      const json = await res.json().catch(() => ({}));
      alert(json.error || 'No se pudo generar el enlace de impersonación');
    }
  }

  async function handleSendReminder() {
    setBusy(true);
    const res = await fetch(`/api/clubs/${club.slug}/send-payment-reminder`, { method: 'POST' });
    setBusy(false);
    if (res.ok) {
      setReminderSent(true);
      setTimeout(() => setReminderSent(false), 4000);
    }
  }

  async function handleResetPassword() {
    if (!confirm(`¿Generar enlace de recuperación para ${club.config.nombre}?\n\nSe enviará al email del administrador del club.`)) return;
    setBusy(true);
    const res = await fetch(`/api/clubs/${club.slug}/reset-password`, { method: 'POST' });
    setBusy(false);
    if (res.ok) {
      const json = await res.json();
      setResetResult({ email: json.email, reset_link: json.reset_link, email_sent: json.email_sent });
    } else {
      alert('No se pudo generar el enlace. Verifica que el club tenga un email registrado.');
    }
  }

  function copyLink(link: string) {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleChangeEmail() {
    const email = newEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Ingresa un email válido');
      return;
    }
    setEmailError('');
    setEmailSaving(true);
    const res = await fetch(`/api/clubs/${club.slug}/change-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setEmailSaving(false);
    if (res.ok) {
      setEmailDialog(false);
      setNewEmail('');
      doRefresh();
    } else {
      const json = await res.json().catch(() => ({}));
      setEmailError(json.error || 'Error al cambiar el email');
    }
  }

  function doRefresh() {
    if (onRefresh) onRefresh();
    else router.refresh();
  }

  async function handleSuspend() {
    if (!confirm(`¿Suspender ${club.config.nombre}?`)) return;
    setBusy(true);
    await fetch(`/api/clubs/${club.slug}/suspend`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    setBusy(false);
    doRefresh();
  }

  async function handleUnlock() {
    if (!confirm(`¿Reactivar ${club.config.nombre}?`)) return;
    setBusy(true);
    await fetch(`/api/clubs/${club.slug}/unlock`, { method: 'POST' });
    setBusy(false);
    doRefresh();
  }

  async function handleDelete() {
    const nombre = club.config.nombre;
    if (!confirm(`⚠️ Esto eliminará permanentemente "${nombre}" y todos sus datos.\n\n¿Estás seguro?`)) return;
    if (!confirm(`Confirma de nuevo: ¿eliminar "${nombre}" para siempre?`)) return;
    setBusy(true);
    await fetch(`/api/clubs/${club.slug}/delete`, { method: 'DELETE' });
    setBusy(false);
    if (redirectOnDelete) router.push(redirectOnDelete);
    else doRefresh();
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
        <DropdownMenuContent align="end" className="bg-[#0F1219] border-white/10 text-gray-200 w-64 z-50 max-h-[420px] overflow-y-auto">
          {canImpersonate && (
            <DropdownMenuItem onClick={handleImpersonate} className="gap-3 cursor-pointer hover:bg-white/10 focus:bg-white/10 items-start py-2.5">
              <UserCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium leading-none">Impersonar club</p>
                <p className="text-xs text-gray-500 mt-1">Accede al dashboard como el admin del club</p>
              </div>
            </DropdownMenuItem>
          )}
          {(club.status === 'trial' || club.status === 'expired') && (
            <DropdownMenuItem onClick={handleSendReminder} className="gap-3 cursor-pointer hover:bg-white/10 focus:bg-white/10 items-start py-2.5">
              <Mail className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium leading-none">{reminderSent ? '✓ Enviado' : 'Enviar recordatorio'}</p>
                <p className="text-xs text-gray-500 mt-1">Notifica al club sobre su vencimiento de trial</p>
              </div>
            </DropdownMenuItem>
          )}
          {canChangePlan && (
            <DropdownMenuItem onClick={() => setDialog('plan')} className="gap-3 cursor-pointer hover:bg-white/10 focus:bg-white/10 items-start py-2.5">
              <CreditCard className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium leading-none">Cambiar plan</p>
                <p className="text-xs text-gray-500 mt-1">Sube o baja el plan de suscripción</p>
              </div>
            </DropdownMenuItem>
          )}
          {canExtendTrial && (club.status === 'trial' || club.status === 'expired') && (
            <DropdownMenuItem onClick={() => setDialog('trial')} className="gap-3 cursor-pointer hover:bg-white/10 focus:bg-white/10 items-start py-2.5">
              <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium leading-none">Extender trial</p>
                <p className="text-xs text-gray-500 mt-1">Agrega días al período de prueba</p>
              </div>
            </DropdownMenuItem>
          )}
          {canChangeEmail && (
            <DropdownMenuItem onClick={() => { setNewEmail(club.owner_email || ''); setEmailError(''); setEmailDialog(true); }} className="gap-3 cursor-pointer hover:bg-white/10 focus:bg-white/10 items-start py-2.5">
              <Mail className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium leading-none">Cambiar email</p>
                <p className="text-xs text-gray-500 mt-1">Actualiza el correo de acceso del admin</p>
              </div>
            </DropdownMenuItem>
          )}
          {canResetPassword && (
            <DropdownMenuItem onClick={handleResetPassword} className="gap-3 cursor-pointer hover:bg-white/10 focus:bg-white/10 items-start py-2.5">
              <KeyRound className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium leading-none">Restablecer contraseña</p>
                <p className="text-xs text-gray-500 mt-1">Genera un enlace de recuperación</p>
              </div>
            </DropdownMenuItem>
          )}
          {canSuspend && (
            <>
              <DropdownMenuSeparator className="bg-white/10" />
              {club.status === 'suspended' ? (
                <DropdownMenuItem onClick={handleUnlock} className="gap-3 cursor-pointer text-green-400 hover:bg-green-500/10 focus:bg-green-500/10 items-start py-2.5">
                  <Unlock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium leading-none">Reactivar</p>
                    <p className="text-xs text-green-600 mt-1">Restaura el acceso al club</p>
                  </div>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={handleSuspend} className="gap-3 cursor-pointer text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 items-start py-2.5">
                  <Ban className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium leading-none">Suspender</p>
                    <p className="text-xs text-red-700 mt-1">Bloquea el acceso al dashboard</p>
                  </div>
                </DropdownMenuItem>
              )}
            </>
          )}
          {canDelete && (
            <>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem onClick={handleDelete} className="gap-3 cursor-pointer text-red-500 hover:bg-red-500/10 focus:bg-red-500/10 items-start py-2.5">
                <Trash2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium leading-none">Eliminar club</p>
                  <p className="text-xs text-red-800 mt-1">Borra permanentemente todos los datos</p>
                </div>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {dialog === 'plan' && (
        <EditPlanDialog club={club} open onClose={() => setDialog(null)} onSuccess={doRefresh} />
      )}
      {dialog === 'trial' && (
        <ExtendTrialDialog club={club} open onClose={() => setDialog(null)} onSuccess={doRefresh} />
      )}

      {emailDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEmailDialog(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-[#0F1219] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setEmailDialog(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-white font-bold text-lg mb-1">Cambiar email</h3>
            <p className="text-gray-400 text-sm mb-5">
              Actualiza el email de acceso de <span className="text-white font-semibold">{club.config.nombre}</span>
            </p>
            <label className="block text-xs text-gray-500 font-medium mb-1.5">Nuevo email</label>
            <input
              type="email"
              value={newEmail}
              onChange={e => { setNewEmail(e.target.value); setEmailError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleChangeEmail()}
              placeholder="nuevo@email.com"
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500/50 mb-1"
            />
            {emailError && <p className="text-red-400 text-xs mb-3">{emailError}</p>}
            {!emailError && <div className="mb-3" />}
            <button
              onClick={handleChangeEmail}
              disabled={emailSaving}
              className="w-full py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50"
            >
              {emailSaving ? 'Guardando…' : 'Guardar email'}
            </button>
            <button onClick={() => setEmailDialog(false)} className="w-full mt-2 py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {resetResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setResetResult(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-[#0F1219] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setResetResult(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>

            <div className="mb-5">
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1 text-xs font-bold text-indigo-400 uppercase tracking-wide mb-3">
                <KeyRound className="w-3.5 h-3.5" /> Enlace generado
              </div>
              <h3 className="text-white font-bold text-lg">Recuperación de contraseña</h3>
              <p className="text-gray-400 text-sm mt-1">
                Para <span className="text-white font-semibold">{club.config.nombre}</span>
              </p>
            </div>

            <div className="mb-4 flex items-center gap-2 text-sm">
              <span className="text-gray-500">Email:</span>
              <span className="text-gray-200 font-mono text-xs">{resetResult.email}</span>
            </div>

            <div className={`flex items-center gap-2 text-xs mb-5 px-3 py-2 rounded-lg border ${resetResult.email_sent ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'}`}>
              {resetResult.email_sent
                ? '✓ Email enviado automáticamente al administrador'
                : '⚠ Email no enviado — entrega el enlace manualmente'}
            </div>

            <div className="bg-white/5 rounded-xl p-3 mb-5 border border-white/8">
              <p className="text-gray-500 text-[10px] uppercase tracking-wide font-bold mb-2">Enlace de recuperación</p>
              <p className="text-indigo-400 text-xs break-all leading-relaxed">{resetResult.reset_link}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => copyLink(resetResult.reset_link)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-white/8 border border-white/15 text-gray-200 hover:bg-white/12 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado' : 'Copiar enlace'}
              </button>
              {club.config?.whatsapp && (
                <a
                  href={`https://wa.me/57${club.config.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola! Aquí tienes el enlace para crear tu nueva contraseña en ZenSports 🔑\n\n${resetResult.reset_link}\n\nEste enlace es válido por 1 hora.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setResetResult(null)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{ background: '#25D366', color: '#fff' }}
                >
                  <MessageCircle className="w-4 h-4" /> Enviar WA
                </a>
              )}
            </div>
            <button onClick={() => setResetResult(null)} className="w-full mt-2 py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
