import 'server-only';
import { adminDb } from '@/lib/supabase-admin';

// Plan Fundadores y Plan de Referidos (definidos por Diego el 4 oct 2026).
// Todo vive en clubs.config — sin tablas nuevas:
//   fundador:            { numero, desde }   cupo 1..CUPOS_FUNDADORES
//   concurso:            true                fundadores y clubes referidos participan
//   recomendado_por:     texto libre del registro ("¿Quién te recomendó?")
//   referido_por_slug:   club real que refirió (lo enlaza ZenSports desde el admin)
//   meses_gratis:        crédito del club que refirió, máx. MAX_MESES_GRATIS
//   referidos_premiados: slugs ya premiados, para no dar dos veces el mismo mes
//   sin_cobro:           club de prueba o cortesía — no ocupa cupo de fundador ni suma al MRR
// Estos campos los bloquea PATCH /api/config del api: el club no puede tocarlos.
export const CUPOS_FUNDADORES = 20;
export const MAX_MESES_GRATIS = 12;

type Config = Record<string, any>;

export async function contarFundadores() {
  const { data } = await adminDb.from('clubs').select('slug, config');
  const fundadores = (data ?? []).filter(c => c.config?.fundador?.numero);
  const usados = fundadores.map(c => Number(c.config.fundador.numero));
  return { total: fundadores.length, siguiente: usados.length ? Math.max(...usados) + 1 : 1 };
}

async function guardarConfig(slug: string, config: Config) {
  const { error } = await adminDb.from('clubs').update({ config }).eq('slug', slug);
  if (error) throw new Error(error.message);
}

export async function asignarFundador(slug: string): Promise<number | null> {
  const { data: club } = await adminDb.from('clubs').select('config').eq('slug', slug).maybeSingle();
  if (!club) throw new Error('Club no encontrado');
  if (club.config?.fundador?.numero) return club.config.fundador.numero;
  if (club.config?.sin_cobro) return null;
  const { total, siguiente } = await contarFundadores();
  if (total >= CUPOS_FUNDADORES || siguiente > CUPOS_FUNDADORES) return null;
  await guardarConfig(slug, { ...club.config, fundador: { numero: siguiente, desde: new Date().toISOString() }, concurso: true });
  return siguiente;
}

// Se llama cuando un club paga el plan ANUAL (webhook de Bold). Idempotente:
// el cupo de fundador y el premio al referidor se dan una sola vez.
export async function aplicarProgramaPorPagoAnual(slug: string) {
  const resultado: { fundador: number | null; referidor: string | null } = { fundador: null, referidor: null };

  resultado.fundador = await asignarFundador(slug);

  const { data: club } = await adminDb.from('clubs').select('config').eq('slug', slug).maybeSingle();
  const referidorSlug = club?.config?.referido_por_slug as string | undefined;
  if (club && referidorSlug && referidorSlug !== slug) {
    if (!club.config.concurso) await guardarConfig(slug, { ...club.config, concurso: true });

    const { data: ref } = await adminDb.from('clubs').select('config').eq('slug', referidorSlug).maybeSingle();
    const premiados: string[] = ref?.config?.referidos_premiados ?? [];
    if (ref && !premiados.includes(slug)) {
      await guardarConfig(referidorSlug, {
        ...ref.config,
        meses_gratis: Math.min((Number(ref.config.meses_gratis) || 0) + 1, MAX_MESES_GRATIS),
        referidos_premiados: [...premiados, slug],
      });
      resultado.referidor = referidorSlug;
    }
  }
  return resultado;
}
