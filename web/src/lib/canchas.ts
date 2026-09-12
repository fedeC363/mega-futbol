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

/** Cancha tal como la necesita el mapa: con su tipo y si le quedan turnos. */
export interface CanchaMapa extends Cancha {
  tipo: Tipo;
  /** true = no le queda ningun turno libre ese dia. */
  ocupada: boolean;
}
