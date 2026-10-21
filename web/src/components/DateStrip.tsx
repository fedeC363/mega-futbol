import { cn } from '../lib/cn';
import { etiquetaDia, hoyBA, sumarDias } from '../lib/fechas';

/**
 * Selector de dia. NO esta en los bocetos: el spec de frontend deja abierto
 * si el mapa refleja solo "hoy" o si hay selector de fecha. Para la demo se
 * muestran los proximos 7 dias (la base admite hasta 30).
 */
export function DateStrip({
  fecha,
  onCambiar,
  dias = 7,
  // Por defecto se ubica como una barra de la pagina; quien la mete
  // adentro de un contenedor le pasa su propio espaciado.
  className = 'px-3.5 pt-3.5 md:px-8 md:pt-5',
}: {
  fecha: string | null;
  onCambiar: (fecha: string) => void;
  dias?: number;
  className?: string;
}) {
  const hoy = hoyBA();
  const lista = Array.from({ length: dias }, (_, i) => sumarDias(hoy, i));

  return (
    <div
      role="radiogroup"
      aria-label="Elegí el día"
      className={cn('menu-chico flex gap-1.5 overflow-x-auto scrollbar-none', className)}
    >
      {lista.map((f) => {
        const { dia, numero } = etiquetaDia(f);
        const activo = f === fecha;
        return (
          <button
            key={f}
            type="button"
            role="radio"
            aria-checked={activo}
            aria-label={`${dia} ${numero}`}
            onClick={() => onCambiar(f)}
            className="opcion-menu flex min-w-[58px] shrink-0 flex-col items-center px-3 py-1.5"
          >
            <span className="text-[11px] font-medium tracking-wide uppercase">{dia}</span>
            <span className="font-display text-lg leading-tight font-bold">{numero}</span>
          </button>
        );
      })}
    </div>
  );
}
