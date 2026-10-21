import { useEffect } from 'react';
import { TERMINOS_TEXTO } from '../content/terminos';
import { Aviso, Boton } from './ui';

/**
 * Los terminos y condiciones.
 *
 * - modo "aceptar": tapa la pagina y no se puede cerrar sin aceptar.
 *   No hay boton de rechazar: quien no acepta, no usa la plataforma.
 * - modo "lectura": el mismo texto, abierto desde el boton flotante,
 *   con Escape y un boton para cerrar. No vuelve a pedir la aceptacion.
 */
export function ModalTerminos({
  modo,
  enviando = false,
  error,
  onAceptar,
  onCerrar,
}: {
  modo: 'aceptar' | 'lectura';
  enviando?: boolean;
  error?: string | null;
  onAceptar?: () => void;
  onCerrar?: () => void;
}) {
  const esLectura = modo === 'lectura';

  useEffect(() => {
    // Mientras está abierto, la página de atrás no scrollea.
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const alPresionar = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && esLectura) onCerrar?.();
    };
    window.addEventListener('keydown', alPresionar);

    return () => {
      document.body.style.overflow = previo;
      window.removeEventListener('keydown', alPresionar);
    };
  }, [esLectura, onCerrar]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-terminos"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(4_8_6/0.78)] p-4"
      // En modo aceptar, tocar afuera no cierra: hay que aceptar.
      onClick={esLectura ? onCerrar : undefined}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[86dvh] w-full max-w-2xl flex-col rounded-2xl border border-cream/12 bg-panel shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-cream/10 px-5 py-4">
          <div>
            <h2 id="titulo-terminos" className="font-display text-2xl leading-none font-bold">
              Términos y condiciones
            </h2>
            {!esLectura && (
              <p className="mt-1.5 text-[13px] text-cream-dim">
                Para usar Mega Fútbol tenés que aceptarlos.
              </p>
            )}
          </div>
          {esLectura && (
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar"
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-cream/8 text-cream-dim hover:text-cream"
            >
              ✕
            </button>
          )}
        </header>

        <div className="overflow-y-auto px-5 py-4 text-[13px] leading-relaxed whitespace-pre-wrap text-cream/90">
          {TERMINOS_TEXTO}
        </div>

        <footer className="border-t border-cream/10 px-5 py-4">
          {error && (
            <div className="mb-3">
              <Aviso>{error}</Aviso>
            </div>
          )}
          {esLectura ? (
            <Boton autoFocus variante="secundaria" className="w-full" onClick={onCerrar}>
              Cerrar
            </Boton>
          ) : (
            <Boton autoFocus className="w-full py-3.5" disabled={enviando} onClick={onAceptar}>
              {enviando ? 'Guardando…' : 'Acepto los términos y condiciones'}
            </Boton>
          )}
        </footer>
      </div>
    </div>
  );
}
