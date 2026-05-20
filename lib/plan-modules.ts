import type { ClubPlan } from '@/types/club';

export const MODULE_KEYS = [
  'jugadores',
  'uniformes',
  'cobro',
  'torneos',
  'arbitraje',
  'whatsapp',
  'conciliacion',
  'finanzas',
] as const;

export type ModuleKey = typeof MODULE_KEYS[number];

export const MODULE_LABELS: Record<ModuleKey, string> = {
  jugadores:    'Gestión de jugadores',
  uniformes:    'Uniformes',
  cobro:        'Cobro automático WA',
  torneos:      'Torneos',
  arbitraje:    'Arbitraje',
  whatsapp:     'WhatsApp',
  conciliacion: 'Conciliación bancaria',
  finanzas:     'Finanzas',
};

// Modules included (unlocked) in each plan
export const PLAN_MODULES: Record<ClubPlan, ModuleKey[]> = {
  trial:   ['jugadores'],
  starter: ['jugadores', 'uniformes', 'cobro'],
  pro:     ['jugadores', 'uniformes', 'cobro', 'torneos', 'arbitraje', 'whatsapp'],
  total:   ['jugadores', 'uniformes', 'cobro', 'torneos', 'arbitraje', 'whatsapp', 'conciliacion', 'finanzas'],
};

export function isModuleUnlocked(plan: ClubPlan, key: ModuleKey): boolean {
  return PLAN_MODULES[plan]?.includes(key) ?? false;
}
