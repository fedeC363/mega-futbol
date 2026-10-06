import { supabase } from './supabase';
import type { Cancha, Sede, Turno } from './tipos';

/**
 * Parametros de negocio leidos de la base (funciones de la migracion
 * parametros_y_helpers). El frontend los usa solo para MOSTRAR (horarios,
 * monto de la seña, texto del recargo); nunca para calcular un precio.
 */
export interface Parametros {
  primerTurno: string;
  ultimoTurno: string;
  sena: number;
  recargoDesde: string;
  factorRecargo: number;
}

/** Cachea una carga que no cambia durante la sesion; si falla, se reintenta. */
function unaVez<T>(cargar: () => Promise<T>): () => Promise<T> {
  let promesa: Promise<T> | null = null;
  return () => {
    promesa ??= cargar().catch((error: unknown) => {
      promesa = null;
      throw error;
    });
    return promesa;
  };
}

// Hoy existe una sola sede (spec 04). Cuando haya mas, se elige en la UI.
export const cargarSede = unaVez(async (): Promise<Sede> => {
  const { data, error } = await supabase
    .from('sede')
    .select('*')
    .order('created_at')
    .limit(1)
    .single();
  if (error) throw error;
  return data;
});

export const cargarParametros = unaVez(async (): Promise<Parametros> => {
  const [primer, ultimo, sena, recargo, factor] = await Promise.all([
    supabase.rpc('hora_primer_turno'),
    supabase.rpc('hora_ultimo_turno'),
    supabase.rpc('monto_sena_default'),
    supabase.rpc('hora_recargo_desde'),
    supabase.rpc('factor_recargo'),
  ]);
  for (const r of [primer, ultimo, sena, recargo, factor]) {
    if (r.error) throw r.error;
  }
  return {
    primerTurno: primer.data!,
    ultimoTurno: ultimo.data!,
    sena: sena.data!,
    recargoDesde: recargo.data!,
    factorRecargo: factor.data!,
  };
});

export async function cargarCanchas(sedeId: string): Promise<Cancha[]> {
  const { data, error } = await supabase
    .from('cancha')
    .select('*')
    .eq('sede_id', sedeId)
    .eq('activa', true)
    .order('numero');
  if (error) throw error;
  return data;
}

export async function cargarCancha(id: string): Promise<Cancha> {
  const { data, error } = await supabase
    .from('cancha')
    .select('*')
    .eq('id', id)
    .eq('activa', true)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Esa cancha no existe o no está disponible.');
  return data;
}

/** Turnos del dia para una cancha, con su precio ya calculado por la base. */
export async function cargarDisponibilidad(canchaId: string, fecha: string): Promise<Turno[]> {
  const { data, error } = await supabase.rpc('disponibilidad', {
    p_cancha_id: canchaId,
    p_fecha: fecha,
  });
  if (error) throw error;
  return data;
}

/** cancha_id -> cantidad de turnos libres ese dia. */
export async function cargarOcupacion(sedeId: string, fecha: string): Promise<Map<string, number>> {
  const { data, error } = await supabase.rpc('ocupacion_del_dia', {
    p_sede_id: sedeId,
    p_fecha: fecha,
  });
  if (error) throw error;
  return new Map(data.map((fila) => [fila.cancha_id, fila.turnos_libres]));
}

export function porcentajeRecargo(p: Parametros): number {
  return Math.round((p.factorRecargo - 1) * 100);
}

/** La base de un turno sin recargo arranca en la hora de recargo? */
export function horaEntera(hora: string): number {
  return Number(hora.slice(0, 2));
}
