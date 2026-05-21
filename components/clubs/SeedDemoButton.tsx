'use client';

import { useState } from 'react';
import { Database, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface SeedResult {
  club_slug: string;
  jugadores: number;
  email_demo: string;
  password_demo: string;
}

export function SeedDemoButton() {
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<SeedResult | null>(null);
  const [error, setError]   = useState('');

  async function handleSeed() {
    if (!confirm('¿Crear / recrear el club demo "zensports-demo" con 20 jugadores? Si ya existe se borrará y recreará.')) return;
    setStatus('loading');
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/admin/seed-demo', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error desconocido');
      setResult(data);
      setStatus('success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
      setStatus('error');
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={handleSeed}
        disabled={status === 'loading'}
        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-all
          bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'loading'
          ? <Loader2 size={15} className="animate-spin" />
          : <Database size={15} />
        }
        {status === 'loading' ? 'Creando demo…' : 'Crear Club Demo'}
      </button>

      {status === 'success' && result && (
        <div className="flex items-start gap-2 text-xs text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2 max-w-xs">
          <CheckCircle size={13} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Demo creado — {result.jugadores} jugadores</p>
            <p className="text-green-400/70 mt-0.5">
              Email: {result.email_demo}<br />
              Pass: {result.password_demo}
            </p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 max-w-xs">
          <AlertCircle size={13} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
