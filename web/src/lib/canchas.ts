import type { Cancha } from './tipos';

export type Tipo = 'F5' | 'F6' | 'F7' | 'F8';

export const TIPOS: Tipo[] = ['F5', 'F6', 'F7', 'F8'];

/**
 * La modalidad se deduce de la capacidad total de jugadores (spec 01):
 * 10 -> F5, 12 -> F6, 14 -> F7, 16 -> F8. No hay columna aparte.
 */
export function tipoDeCancha(capacidad: number): Tipo {
  return `F${capacidad / 2}` as Tipo;
}

export function modalidad(tipo: Tipo): string {
  return `Fútbol ${tipo.slice(1)}`;
}

export type NivelOcupacion = 'verde' | 'amarillo' | 'rojo';

/**
 * Color de la cancha segun que tan pedida esta el dia elegido:
 * hasta 30% verde, mas de 30% amarillo, mas de 70% rojo.
 *
 * Mide RESERVAS sobre turnos totales del dia, no turnos libres: una
 * cancha sin reservas no se pone roja al atardecer solo porque ya
 * pasaron sus turnos. Los cortes son de presentacion; quien decide si
 * se puede reservar es siempre la base.
 */
export function nivelDeOcupacion(porcentaje: number): NivelOcupacion {
  if (porcentaje > 70) return 'rojo';
  if (porcentaje > 30) return 'amarillo';
  return 'verde';
}

/** Cancha tal como la necesita el mapa: con su tipo y su ocupacion. */
export interface CanchaMapa extends Cancha {
  tipo: Tipo;
  /** true = no le queda ningun turno libre ese dia (reservado, pasado o bloqueado). */
  ocupada: boolean;
  /** Reservas del dia sobre turnos totales, redondeado. */
  porcentaje: number;
  nivel: NivelOcupacion;
}
