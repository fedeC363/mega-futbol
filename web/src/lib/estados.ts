import type { EstadoReserva } from './tipos';

// Sin rojo: el naranja es el unico acento (spec de frontend, seccion 1).
export const ESTADOS: Record<EstadoReserva, { etiqueta: string; clases: string }> = {
  pendiente_pago: {
    etiqueta: 'Pendiente de seña',
    clases: 'border-orange/50 bg-orange/10 text-orange',
  },
  confirmada: {
    etiqueta: 'Confirmada',
    clases: 'border-turf-light/40 bg-turf-light/15 text-turf-light',
  },
  cancelada: {
    etiqueta: 'Cancelada',
    clases: 'border-cream/15 bg-cream/5 text-cream-dim',
  },
  completada: {
    etiqueta: 'Jugada',
    clases: 'border-cream/15 bg-cream/5 text-cream-dim',
  },
  no_show: {
    etiqueta: 'No se presentó',
    clases: 'border-cream/15 bg-cream/5 text-cream-dim',
  },
};

export function estadoDe(estado: string) {
  return ESTADOS[estado as EstadoReserva] ?? { etiqueta: estado, clases: ESTADOS.cancelada.clases };
}
