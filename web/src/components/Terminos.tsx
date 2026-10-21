import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { TERMINOS_VERSION } from '../content/terminos';
import { mensajeDeError } from '../lib/errores';
import { supabase } from '../lib/supabase';
import { ModalTerminos } from './ModalTerminos';

/**
 * Decide cuando mostrar los terminos, y deja el boton flotante para
 * consultarlos cuando se quiera.
 *
 * - Con sesion: se piden una sola vez. La aceptacion queda guardada en
 *   usuario.terminos_aceptados_at, asi que no vuelve a aparecer.
 * - Sin sesion: se piden en cada visita. No hay donde guardar la
 *   aceptacion de alguien que no tiene cuenta, y tampoco se guarda en
 *   el navegador a proposito: el pedido fue que aparezca siempre hasta
 *   que se registre.
 */
export function Terminos() {
  const { session, perfil, cargando, recargarPerfil } = useAuth();
  const [aceptadoSinCuenta, setAceptadoSinCuenta] = useState(false);
  const [enLectura, setEnLectura] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mientras se resuelve la sesión no se muestra nada: si no, a quien ya
  // los aceptó le aparecerían un segundo y se irían solos.
  const debeAceptar = !cargando && (session ? perfil !== null && !perfil.terminos_aceptados_at : !aceptadoSinCuenta);

  async function aceptar() {
    if (!session) {
      setAceptadoSinCuenta(true);
      return;
    }
    setEnviando(true);
    setError(null);
    const { error } = await supabase.rpc('aceptar_terminos', { p_version: TERMINOS_VERSION });
    setEnviando(false);
    if (error) return setError(mensajeDeError(error));
    recargarPerfil();
  }

  return (
    <>
      {!debeAceptar && (
        <button
          type="button"
          onClick={() => setEnLectura(true)}
          aria-label="Ver los términos y condiciones"
          title="Términos y condiciones"
          className="fixed right-4 bottom-5 z-30 flex size-11 items-center justify-center rounded-full border border-cream/15 bg-panel font-display text-xl font-bold text-cream-dim shadow-lg shadow-black/30 hover:border-cream/35 hover:text-cream"
        >
          i
        </button>
      )}

      {debeAceptar && <ModalTerminos modo="aceptar" enviando={enviando} error={error} onAceptar={aceptar} />}

      {!debeAceptar && enLectura && <ModalTerminos modo="lectura" onCerrar={() => setEnLectura(false)} />}
    </>
  );
}
