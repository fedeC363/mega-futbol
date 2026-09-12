/**
 * Mensaje para mostrarle al usuario a partir de un error de Supabase.
 *
 * Los errores de negocio ya vienen en castellano desde las funciones de
 * Postgres ("Ese turno ya fue reservado", etc.) y se muestran tal cual:
 * el frontend no reinterpreta reglas de negocio.
 */
export function mensajeDeError(error: unknown): string {
  const mensaje =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : String(error ?? '');

  if (/failed to fetch|networkerror|load failed/i.test(mensaje)) {
    return 'No hay conexión con el servidor. Revisá tu internet y probá de nuevo.';
  }
  if (/permission denied|jwt/i.test(mensaje)) {
    return 'No tenés permiso para hacer esto. Probá ingresar de nuevo.';
  }
  return mensaje || 'Ocurrió un error inesperado.';
}

/** Traduce los errores de Supabase Auth, que vienen en ingles. */
export function mensajeDeErrorAuth(error: unknown): string {
  const mensaje = mensajeDeError(error);
  if (/invalid login credentials/i.test(mensaje)) return 'Email o contraseña incorrectos.';
  if (/email not confirmed/i.test(mensaje)) return 'Tenés que confirmar tu email antes de ingresar. Revisá tu casilla.';
  if (/already registered|already been registered/i.test(mensaje)) return 'Ya existe una cuenta con ese email.';
  if (/password should be at least/i.test(mensaje)) return 'La contraseña tiene que tener al menos 6 caracteres.';
  if (/rate limit|too many/i.test(mensaje)) return 'Demasiados intentos seguidos. Esperá unos minutos y probá de nuevo.';
  if (/valid email|invalid format/i.test(mensaje)) return 'Ese email no parece válido.';
  return mensaje;
}
