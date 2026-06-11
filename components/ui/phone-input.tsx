'use client';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const COUNTRIES = [
  { code: '57',  flag: '🇨🇴', name: 'Colombia' },
  { code: '1',   flag: '🇺🇸', name: 'EE.UU. / Canadá' },
  { code: '52',  flag: '🇲🇽', name: 'México' },
  { code: '34',  flag: '🇪🇸', name: 'España' },
  { code: '54',  flag: '🇦🇷', name: 'Argentina' },
  { code: '56',  flag: '🇨🇱', name: 'Chile' },
  { code: '51',  flag: '🇵🇪', name: 'Perú' },
  { code: '593', flag: '🇪🇨', name: 'Ecuador' },
  { code: '58',  flag: '🇻🇪', name: 'Venezuela' },
  { code: '55',  flag: '🇧🇷', name: 'Brasil' },
  { code: '598', flag: '🇺🇾', name: 'Uruguay' },
  { code: '595', flag: '🇵🇾', name: 'Paraguay' },
  { code: '591', flag: '🇧🇴', name: 'Bolivia' },
  { code: '506', flag: '🇨🇷', name: 'Costa Rica' },
  { code: '507', flag: '🇵🇦', name: 'Panamá' },
];

interface PhoneInputProps {
  value: string;
  onChange: (full: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  defaultCountryCode?: string;
}

export function PhoneInput({
  value,
  onChange,
  placeholder = '3001234567',
  required,
  className = '',
  defaultCountryCode = '57',
}: PhoneInputProps) {
  function parseValue(full: string): { code: string; local: string } {
    const digits = full.replace(/\D/g, '');
    for (const c of [...COUNTRIES].sort((a, b) => b.code.length - a.code.length)) {
      if (digits.startsWith(c.code)) {
        return { code: c.code, local: digits.slice(c.code.length) };
      }
    }
    return { code: defaultCountryCode, local: digits };
  }

  const parsed = parseValue(value);
  const [code, setCode]   = useState(parsed.code);
  const [local, setLocal] = useState(parsed.local);
  const [open, setOpen]   = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  function handleCodeChange(newCode: string) {
    setCode(newCode);
    onChange(newCode + local);
    setOpen(false);
  }

  function handleLocalChange(raw: string) {
    const digits = raw.replace(/\D/g, '');
    setLocal(digits);
    onChange(code + digits);
  }

  const selected = COUNTRIES.find(c => c.code === code) ?? COUNTRIES[0];
  const base = 'bg-[#0d1117] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 transition';

  return (
    <div className={`flex gap-1.5 ${className}`}>
      {/* Custom country code dropdown */}
      <div ref={ref} className="relative shrink-0" style={{ width: 110 }}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className={`${base} rounded-xl px-2.5 py-2.5 w-full flex items-center gap-1.5 cursor-pointer`}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>{selected.flag}</span>
          <span className="text-gray-400 text-xs">+{selected.code}</span>
          <ChevronDown size={11} className="text-gray-600 ml-auto shrink-0" />
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-1 z-50 w-52 rounded-xl border border-white/10 overflow-auto"
               style={{ background: '#0d1117', boxShadow: '0 12px 32px rgba(0,0,0,0.7)', maxHeight: 260 }}>
            {COUNTRIES.map(c => (
              <button
                key={c.code}
                type="button"
                onClick={() => handleCodeChange(c.code)}
                className={`flex items-center gap-2 w-full px-3 py-2 text-left text-sm border-none cursor-pointer hover:bg-white/5 ${c.code === code ? 'bg-white/10' : 'bg-transparent'}`}
              >
                <span style={{ fontSize: 18, lineHeight: 1 }}>{c.flag}</span>
                <span className="text-gray-400 text-xs shrink-0">+{c.code}</span>
                <span className="text-gray-300 text-xs truncate">{c.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <input
        type="tel"
        value={local}
        onChange={e => handleLocalChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={`${base} rounded-xl px-4 py-2.5 flex-1 placeholder:text-gray-600`}
      />
    </div>
  );
}
