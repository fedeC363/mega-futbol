// Todo el sistema asume Buenos Aires (spec 00, regla 12). Las fechas viajan
// como 'YYYY-MM-DD' y las horas como 'HH:MM:SS', igual que en Postgres.

const ZONA = 'America/Argentina/Buenos_Aires';

const fmtIso = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA });
const fmtHora = new Intl.DateTimeFormat('en-GB', { timeZone: ZONA, hour: '2-digit', hourCycle: 'h23' });
const fmtHoraMinuto = new Intl.DateTimeFormat('es-AR', { timeZone: ZONA, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
// Las fechas sueltas se anclan al mediodia UTC y se formatean en UTC, asi el
// dia nunca se corre por la zona horaria del navegador.
const fmtDiaSemana = new Intl.DateTimeFormat('es-AR', { weekday: 'short', timeZone: 'UTC' });
const fmtLarga = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

const aFecha = (iso: string) => new Date(`${iso}T12:00:00Z`);

export function hoyBA(): string {
  return fmtIso.format(new Date());
}

export function horaActualBA(): number {
  return Number(fmtHora.format(new Date()));
}

export function sumarDias(iso: string, dias: number): string {
  const d = aFecha(iso);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Etiqueta corta para la tira de dias: { dia: 'Hoy' | 'Mañana' | 'Sáb', numero: '13' }. */
export function etiquetaDia(iso: string): { dia: string; numero: string } {
  const hoy = hoyBA();
  const numero = String(aFecha(iso).getUTCDate());
  if (iso === hoy) return { dia: 'Hoy', numero };
  if (iso === sumarDias(hoy, 1)) return { dia: 'Mañana', numero };
  const dia = fmtDiaSemana.format(aFecha(iso)).replace('.', '');
  return { dia: dia.charAt(0).toUpperCase() + dia.slice(1), numero };
}

/** 'hoy', 'mañana' o 'sábado 13 de septiembre'. */
export function fechaLegible(iso: string): string {
  const hoy = hoyBA();
  if (iso === hoy) return 'hoy';
  if (iso === sumarDias(hoy, 1)) return 'mañana';
  return fmtLarga.format(aFecha(iso));
}

/** '20:00:00' -> '20:00' */
export function horaCorta(hora: string): string {
  return hora.slice(0, 5);
}

/** '20:00:00' -> '20:00 – 21:00' (los turnos duran 1 hora). */
export function rangoTurno(hora: string): string {
  const fin = String(Number(hora.slice(0, 2)) + 1).padStart(2, '0');
  return `${horaCorta(hora)} – ${fin}:00`;
}

/** Timestamp de Postgres -> 'HH:MM' en Buenos Aires. */
export function horaDeTimestamp(ts: string): string {
  return fmtHoraMinuto.format(new Date(ts));
}
