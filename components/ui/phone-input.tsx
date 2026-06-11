'use client';
import { useState } from 'react';

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
  { code: '57',  flag: '🇨🇴', name: 'Colombia' },
  { code: '55',  flag: '🇧🇷', name: 'Brasil' },
  { code: '598', flag: '🇺🇾', name: 'Uruguay' },
  { code: '595', flag: '🇵🇾', name: 'Paraguay' },
  { code: '591', flag: '🇧🇴', name: 'Bolivia' },
  { code: '506', flag: '🇨🇷', name: 'Costa Rica' },
  { code: '507', flag: '🇵🇦', name: 'Panamá' },
];

// Deduplicate keeping first occurrence
const COUNTRY_LIST = COUNTRIES.filter((c, i) => COUNTRIES.findIndex(x => x.code === c.code) === i);

interface PhoneInputProps {
  value: string;           // full number with country code, e.g. "573023903192"
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
  // Parse stored value: try to detect country code prefix
  function parseValue(full: string): { code: string; local: string } {
    const digits = full.replace(/\D/g, '');
    for (const c of [...COUNTRY_LIST].sort((a, b) => b.code.length - a.code.length)) {
      if (digits.startsWith(c.code)) {
        return { code: c.code, local: digits.slice(c.code.length) };
      }
    }
    return { code: defaultCountryCode, local: digits };
  }

  const parsed = parseValue(value);
  const [code, setCode] = useState(parsed.code);
  const [local, setLocal] = useState(parsed.local);

  function handleCodeChange(newCode: string) {
    setCode(newCode);
    onChange(newCode + local);
  }

  function handleLocalChange(raw: string) {
    const digits = raw.replace(/\D/g, '');
    setLocal(digits);
    onChange(code + digits);
  }

  const selectedCountry = COUNTRY_LIST.find(c => c.code === code) ?? COUNTRY_LIST[0];

  const base = 'bg-[#0d1117] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 transition';

  return (
    <div className={`flex gap-1.5 ${className}`}>
      <select
        value={code}
        onChange={e => handleCodeChange(e.target.value)}
        className={`${base} rounded-xl px-2 py-2.5 w-[110px] shrink-0 cursor-pointer`}
      >
        {COUNTRY_LIST.map(c => (
          <option key={c.code} value={c.code}>
            {c.flag} +{c.code}
          </option>
        ))}
      </select>
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
