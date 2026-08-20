import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));
}

export function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

export const PLAN_PRICE: Record<string, number> = {
  free:    0,
  trial:   0,
  starter: 149000,
  pro:     399000,
  scale:   799000,
  total:   799000,
};

// Oferta de lanzamiento (no permanente): pagando el año completo de una vez,
// el club se lleva 12 meses por el precio de 10 ("2 meses gratis"). Precios
// fijos aprobados por Diego el 14 ago 2026 (ver Plan Maestro de Lanzamiento)
// — no se muestra ningún % públicamente, solo "2 meses gratis". Cuando la
// oferta termine, basta con dejar de mostrar la opción anual en la UI; este
// precio puede quedar sin uso sin romper nada.
export const PLAN_PRICE_ANUAL: Record<string, number> = {
  starter: 1490000,
  pro:     3990000,
  scale:   7990000,
};

// Precios por defecto de los tiers de Afiliados — organizaciones, tiendas
// deportivas o de servicios relacionados con el deporte que pagan por
// aparecer ante TODOS los jugadores de los clubes en ZenSports (no clubes,
// no tiene relación con PLAN_PRICE de arriba). Son solo el valor inicial que
// precarga el formulario, no un límite: el precio real de cada afiliado se
// guarda editable en afiliados.precio_mensual y puede sobreescribirse por
// trato individual. Definido con Diego el 18 ago 2026.
export const AFILIADO_TIER_PRICE: Record<string, number> = {
  bronce: 49900,
  plata:  99900,
  oro:    149900,
};
