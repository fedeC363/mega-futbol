/**
 * Validacion propia de los campos de texto.
 *
 * Los formularios no usan inputs nativos con step ni selectores del
 * navegador: se escribe con el teclado y los errores los muestra la
 * app, en castellano y explicando que hacer. El cartel nativo del
 * navegador ("los dos valores mas proximos son 14901 y 15001") no
 * aparece nunca.
 */

export type Validado<T> = { ok: true; valor: T } | { ok: false; error: string };

/**
 * 'HH:MM'. Exige minutos 00 a proposito: los turnos duran una hora en
 * punto y es_turno_valido() rechaza cualquier otra cosa, asi que un
 * horario con minutos mostraria turnos que nadie podria reservar.
 */
export function validarHora(texto: string): Validado<string> {
  const t = texto.trim();
  const partes = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!partes) {
    return { ok: false, error: 'Escribí la hora como HH:MM. Por ejemplo, 08:00.' };
  }
  const hora = Number(partes[1]);
  const minutos = Number(partes[2]);
  if (hora > 23 || minutos > 59) {
    return { ok: false, error: 'Esa hora no existe. Tiene que estar entre 00:00 y 23:59.' };
  }
  if (minutos !== 0) {
    return { ok: false, error: 'Los turnos son de una hora en punto: los minutos tienen que ser 00.' };
  }
  return { ok: true, valor: `${String(hora).padStart(2, '0')}:00` };
}

/**
 * Numero entero. Acepta puntos y espacios como separador de miles
 * ("15.000"), porque es como se escribe un precio en castellano.
 */
export function validarEntero(
  texto: string,
  { min, max }: { min: number; max: number },
): Validado<number> {
  const limpio = texto.trim().replace(/[.\s]/g, '');
  if (limpio === '') return { ok: false, error: 'Completá este campo.' };
  if (!/^\d+$/.test(limpio)) {
    return { ok: false, error: 'Escribí solo números enteros, sin centavos ni letras.' };
  }
  const valor = Number(limpio);
  if (valor < min || valor > max) {
    return { ok: false, error: `Tiene que ser un número entre ${min} y ${max}.` };
  }
  return { ok: true, valor };
}

/** Telefono: al menos 8 digitos, con los separadores que quiera. */
export function validarTelefono(texto: string): Validado<string> {
  const digitos = texto.replace(/\D/g, '');
  if (digitos.length < 8) {
    return { ok: false, error: 'El teléfono tiene que tener al menos 8 dígitos.' };
  }
  return { ok: true, valor: texto.trim() };
}
