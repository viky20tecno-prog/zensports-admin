import type { ClubPlan } from '@/types/club';

// Estas keys deben ser exactamente los ids reales de pestaña del dashboard
// (ver NAV en dashboard/src/pages/Dashboard.jsx) — 'dashboard' y 'jugadores'
// quedan fuera porque el dashboard los muestra siempre, sin importar
// config.modulos (ver Dashboard.jsx: `if (id === 'dashboard' || id === 'jugadores') return true;`).
export const MODULE_KEYS = [
  'calendario',
  'equipos',
  'uniformes',
  'torneos',
  'conciliacion',
  'finanzas',
  'plantillas',
  'documentos',
] as const;

export type ModuleKey = typeof MODULE_KEYS[number];

export const MODULE_LABELS: Record<ModuleKey, string> = {
  calendario:   'Calendario',
  equipos:      'Equipos',
  uniformes:    'Uniformes',
  torneos:      'Torneos',
  conciliacion: 'Conciliación bancaria',
  finanzas:     'Finanzas',
  plantillas:   'Plantillas / recordatorios WhatsApp',
  documentos:   'Documentos',
};

// Módulos incluidos (desbloqueados) por plan — debe coincidir con lo que se
// promete en la tabla de precios del landing (src/pages/LandingPage.jsx).
// Confirmado con Diego (16 jul 2026): Uniformes y Finanzas son de Pro+, no
// de Starter — el código anterior contradecía lo que se vende en el landing.
export const PLAN_MODULES: Record<ClubPlan, ModuleKey[]> = {
  free:    [],
  trial:   ['calendario', 'equipos', 'uniformes', 'torneos', 'conciliacion', 'finanzas', 'plantillas', 'documentos'],
  starter: ['calendario', 'equipos', 'plantillas', 'documentos'],
  pro:     ['calendario', 'equipos', 'plantillas', 'documentos', 'finanzas', 'uniformes', 'torneos'],
  scale:   ['calendario', 'equipos', 'uniformes', 'torneos', 'conciliacion', 'finanzas', 'plantillas', 'documentos'],
  total:   ['calendario', 'equipos', 'uniformes', 'torneos', 'conciliacion', 'finanzas', 'plantillas', 'documentos'],
};

export function isModuleUnlocked(plan: ClubPlan, key: ModuleKey): boolean {
  return PLAN_MODULES[plan]?.includes(key) ?? false;
}

// Arma el objeto config.modulos completo para un plan — dashboard/jugadores
// siempre true (el dashboard los ignora igual, pero se guardan explícitos
// por claridad), y cada ModuleKey según isModuleUnlocked. Usado al crear un
// club y al cambiar de plan, para que config.modulos nunca quede
// desincronizado del plan que el club está pagando.
export function buildModulosForPlan(plan: ClubPlan): Record<string, boolean> {
  const modulos: Record<string, boolean> = { dashboard: true, jugadores: true };
  for (const key of MODULE_KEYS) modulos[key] = isModuleUnlocked(plan, key);
  return modulos;
}
