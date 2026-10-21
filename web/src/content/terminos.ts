import texto from './terminos.txt?raw';

/**
 * El texto vive en terminos.txt, al lado de este archivo: se edita como
 * un documento, sin tocar codigo ni escapar comillas.
 *
 * Si el texto cambia de verdad, subí esta version. Queda guardada en
 * usuario.terminos_version, asi que el dia que haga falta volver a
 * pedir la aceptacion alcanza con comparar contra la vigente.
 */
export const TERMINOS_VERSION = 'v1';

export const TERMINOS_TEXTO = texto;
