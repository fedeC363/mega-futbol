/** 40000 -> '$40.000' */
export function pesos(monto: number): string {
  return `$${Math.round(monto).toLocaleString('es-AR')}`;
}
