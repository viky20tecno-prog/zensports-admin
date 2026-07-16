// Rate limiter simple en memoria — protege el login del admin (cuentas con
// permisos de borrar clubes, facturación, impersonar) contra fuerza bruta.
// Limitación conocida: en serverless (Vercel) la memoria no se comparte entre
// instancias frías, así que esto es una primera barrera, no una garantía
// distribuida — para algo más fuerte habría que pasar el contador a la base
// de datos (ej. failed_login_attempts/locked_until en admin_users) o a un
// store compartido (Vercel KV/Redis). Suficiente para frenar un script naive.
const attempts = new Map<string, { count: number; resetAt: number }>();

// Limpieza periódica para no acumular memoria indefinidamente
setInterval(() => {
  const now = Date.now();
  Array.from(attempts.entries()).forEach(([key, v]) => {
    if (v.resetAt < now) attempts.delete(key);
  });
}, 5 * 60 * 1000).unref?.();

export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}
