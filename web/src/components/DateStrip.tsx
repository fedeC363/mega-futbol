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
}: {
  fecha: string | null;
  onCambiar: (fecha: string) => void;
  dias?: number;
}) {
  const hoy = hoyBA();
  const lista = Array.from({ length: dias }, (_, i) => sumarDias(hoy, i));

  return (
    <div
      role="radiogroup"
      aria-label="Elegí el día"
      className="flex gap-2 overflow-x-auto px-3.5 pt-3.5 scrollbar-none md:px-8 md:pt-5"
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
            onClick={() => onCambiar(f)}
            className={cn(
              'flex min-w-[58px] shrink-0 flex-col items-center rounded-[10px] border px-3 py-1.5 transition',
              activo
                ? 'border-orange bg-orange text-ink'
                : 'border-cream/10 bg-panel text-cream-dim hover:text-cream',
            )}
          >
            <span className="text-[11px] font-medium tracking-wide uppercase">{dia}</span>
            <span className="font-display text-lg leading-tight font-bold">{numero}</span>
          </button>
        );
      })}
    </div>
  );
}
