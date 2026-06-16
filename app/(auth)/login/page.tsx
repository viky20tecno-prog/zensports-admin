'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Error al iniciar sesión');
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080B12] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(ellipse, rgba(106,0,255,0.14) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] rounded-full blur-[120px]"
          style={{ background: 'rgba(174,104,255,0.05)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          {/* Z isotipo */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 relative"
            style={{
              background: 'linear-gradient(135deg, #6A00FF 0%, #AE68FF 100%)',
              boxShadow: '0 0 40px rgba(106,0,255,0.45), 0 0 80px rgba(106,0,255,0.15)',
            }}>
            <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
              <path d="M6 9H26L6 23H26" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <h1 className="text-2xl font-semibold text-white tracking-tight"
            style={{ fontFamily: "'Clash Display','Space Grotesk',sans-serif" }}>
            <span style={{ fontWeight: 400, opacity: 0.8 }}>ZEN</span>SPORTS
            <span className="text-base font-medium ml-2" style={{ color: '#AE68FF', fontFamily: 'Space Grotesk, sans-serif' }}>Admin</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Centro de operaciones</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="admin@zensports.co"
                className="w-full bg-[#111827] border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none transition"
                style={{ '--tw-ring-color': '#6A00FF' } as React.CSSProperties}
                onFocus={e => (e.target.style.borderColor = 'rgba(106,0,255,0.5)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Contraseña</label>
                <Link href="/forgot-password" className="text-xs transition" style={{ color: '#AE68FF' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#C084FF')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#AE68FF')}>
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#111827] border border-white/8 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder:text-gray-600 focus:outline-none transition"
                  onFocus={e => (e.target.style.borderColor = 'rgba(106,0,255,0.5)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full disabled:opacity-50 text-white font-semibold rounded-xl py-2.5 text-sm transition flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #6A00FF 0%, #8B2AFF 100%)',
                boxShadow: '0 0 20px rgba(106,0,255,0.3)',
              }}
              onMouseEnter={e => !loading && (e.currentTarget.style.boxShadow = '0 0 28px rgba(106,0,255,0.5)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 20px rgba(106,0,255,0.3)')}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Ingresando...</>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Acceso restringido — Solo personal autorizado
        </p>
      </motion.div>
    </div>
  );
}
