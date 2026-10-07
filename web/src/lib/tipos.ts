import type { Database } from './database.types';

type Tablas = Database['public']['Tables'];

export type Sede = Tablas['sede']['Row'];
export type Cancha = Tablas['cancha']['Row'];
export type Reserva = Tablas['reserva']['Row'];
export type Usuario = Tablas['usuario']['Row'];
export type Configuracion = Tablas['configuracion']['Row'];

// Coincide con el check reserva_estado_valido de la base.
export type EstadoReserva =
  | 'pendiente_pago'
  | 'confirmada'
  | 'cancelada'
  | 'completada'
  | 'no_show';

export type Turno = Database['public']['Functions']['disponibilidad']['Returns'][number];
