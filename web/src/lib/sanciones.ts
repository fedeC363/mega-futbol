import type { Parametros } from './datos';
import { fechaDeTimestamp } from './fechas';

/** Los campos de sancion de un usuario, vengan del perfil o de un join. */
export interface UsuarioSancionable {
  inasistencias: number;
  suspendido_hasta: string | null;
  vetado: boolean;
}

export interface Sancion {
  tipo: 'vetado' | 'suspendido' | 'aviso';
  /** Texto corto, para una insignia al lado del nombre. */
  etiqueta: string;
  /** Texto largo, para el aviso en el perfil del usuario. */
  mensaje: string;
}

/**
 * Estado de amonestaciones de un usuario, o null si esta en orden.
 * Es solo para mostrar: quien decide de verdad si puede reservar es
 * crear_reserva en la base.
 */
export function sancionDe(usuario: UsuarioSancionable, p?: Parametros): Sancion | null {
  if (usuario.vetado) {
    return {
      tipo: 'vetado',
      etiqueta: 'Vetado',
      mensaje:
        'Tu cuenta no puede hacer reservas por inasistencias reiteradas. Si creés que es un error, comunicate con el predio.',
    };
  }

  if (usuario.suspendido_hasta && new Date(usuario.suspendido_hasta) > new Date()) {
    const hasta = fechaDeTimestamp(usuario.suspendido_hasta);
    return {
      tipo: 'suspendido',
      etiqueta: `Suspendido hasta ${hasta}`,
      mensaje: `Estás suspendido por inasistencias hasta el ${hasta}. No vas a poder reservar hasta esa fecha.`,
    };
  }

  if (p && usuario.inasistencias >= p.inasistenciasAviso) {
    return {
      tipo: 'aviso',
      etiqueta: `${usuario.inasistencias} inasistencias`,
      mensaje: `Acumulás ${usuario.inasistencias} inasistencias: reservaste y no te presentaste a jugar. Al llegar a ${p.inasistenciasSuspension}, la cuenta queda suspendida y no vas a poder reservar por un tiempo.`,
    };
  }

  return null;
}

export const CLASES_SANCION: Record<Sancion['tipo'], string> = {
  vetado: 'border-orange/60 bg-orange/15 text-orange',
  suspendido: 'border-orange/50 bg-orange/10 text-orange',
  aviso: 'border-cream/20 bg-cream/5 text-cream-dim',
};
