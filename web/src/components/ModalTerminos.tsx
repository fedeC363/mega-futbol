import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TERMINOS_TEXTO } from '../content/terminos';
import { Icono } from './Iconos';
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

  const caja = useRef<HTMLDivElement>(null);

  // Al cerrar, el foco vuelve a donde estaba (por ejemplo, el boton "i").
  // Se toma en el render: el autoFocus de adentro mueve el foco antes de
  // que corra cualquier efecto.
  const [antes] = useState(() => document.activeElement as HTMLElement | null);
  useEffect(() => () => antes?.focus(), [antes]);

  useEffect(() => {
    // Mientras está abierto, la página de atrás no scrollea.
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // La app de atras queda inerte: Tab no se escapa del modal y los
    // lectores de pantalla solo leen el modal. Por eso el modal se monta
    // fuera de #root (portal al body).
    const raiz = document.getElementById('root');
    raiz?.setAttribute('inert', '');
    // Si el foco quedo afuera (en desarrollo, StrictMode monta dos veces y
    // lo devuelve al boton "i"), va al boton principal, que es el ultimo.
    if (!caja.current?.contains(document.activeElement)) {
      [...(caja.current?.querySelectorAll<HTMLElement>('button') ?? [])].at(-1)?.focus();
    }

    const alPresionar = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && esLectura) onCerrar?.();
      if (e.key !== 'Tab' || !caja.current) return;
      // Inert no alcanza: despues del ultimo boton, Tab se iria a la barra
      // del navegador. Se cicla a mano entre los controles del modal.
      const controles = [...caja.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href]')];
      if (!controles.length) return;
      const primero = controles[0];
      const ultimo = controles[controles.length - 1];
      const dentro = caja.current.contains(document.activeElement);
      if (e.shiftKey && (!dentro || document.activeElement === primero)) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && (!dentro || document.activeElement === ultimo)) {
        e.preventDefault();
        primero.focus();
      }
    };
    window.addEventListener('keydown', alPresionar);

    return () => {
      document.body.style.overflow = previo;
      raiz?.removeAttribute('inert');
      window.removeEventListener('keydown', alPresionar);
    };
  }, [esLectura, onCerrar]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-terminos"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(4_8_6/0.78)] p-4"
      // En modo aceptar, tocar afuera no cierra: hay que aceptar.
      onClick={esLectura ? onCerrar : undefined}
    >
      <div
        ref={caja}
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
              <Icono nombre="cerrar" className="size-4" />
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
    </div>,
    document.body,
  );
}
