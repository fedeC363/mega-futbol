import type { CanchaMapa } from '../lib/canchas';
import { modalidad } from '../lib/canchas';
import { cn } from '../lib/cn';

/**
 * Proporcion de la tarjeta, en unidades del viewBox. 3:2 apaisado,
 * cerca de los 105 x 68 metros de una cancha real: cuadrada se veia
 * mal. Es la misma en mobile y en desktop, y tiene que coincidir con
 * la clase aspect-[3/2] de abajo para que el dibujo no se deforme.
 */
const MEDIDAS = { ancho: 150, alto: 100 } as const;

/**
 * Lineas de una cancha vista desde arriba: perimetro, mediocampo,
 * circulo central con su punto y las dos areas.
 *
 * Se dibuja con las medidas de cada formato en vez de un viewBox fijo:
 * asi el dibujo llena la tarjeta entera (preserveAspectRatio="none" no
 * deforma nada porque el viewBox ya tiene la proporcion real) y el
 * circulo central sigue siendo un circulo en mobile y en desktop.
 *
 * El color sale de currentColor, asi el estado ocupado solo cambia una
 * clase de texto.
 */
function DibujoDeCancha({ ancho, alto }: { ancho: number; alto: number }) {
  const menor = Math.min(ancho, alto);
  const margen = menor * 0.07;
  const trazo = menor * 0.018;
  const radio = menor * 0.17;
  const areaAncho = ancho * 0.46;
  const areaAlto = alto * 0.15;
  const areaX = (ancho - areaAncho) / 2;

  return (
    <svg
      viewBox={`0 0 ${ancho} ${alto}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full"
    >
      <g fill="none" stroke="currentColor" strokeWidth={trazo}>
        <rect
          x={margen}
          y={margen}
          width={ancho - margen * 2}
          height={alto - margen * 2}
          rx={menor * 0.03}
        />
        <line x1={margen} y1={alto / 2} x2={ancho - margen} y2={alto / 2} />
        <circle cx={ancho / 2} cy={alto / 2} r={radio} />
        <circle cx={ancho / 2} cy={alto / 2} r={trazo * 1.4} fill="currentColor" stroke="none" />
        <rect x={areaX} y={margen} width={areaAncho} height={areaAlto} />
        <rect x={areaX} y={alto - margen - areaAlto} width={areaAncho} height={areaAlto} />
      </g>
    </svg>
  );
}

/**
 * Una cancha del mapa (spec de frontend 2.2). Muestra numero + tipo en el
 * badge, no la capacidad, para no confundir jugadores con modalidad.
 */
export function CourtTile({
  cancha,
  variante,
  seleccionada,
  onSeleccionar,
  className,
}: {
  cancha: CanchaMapa;
  variante: 'mobile' | 'desktop';
  seleccionada: boolean;
  onSeleccionar: (id: string) => void;
  className?: string;
}) {
  const { ocupada } = cancha;
  const desktop = variante === 'desktop';

  return (
    <button
      type="button"
      disabled={ocupada}
      aria-pressed={seleccionada}
      aria-label={`Cancha ${cancha.numero}, ${modalidad(cancha.tipo)}, ${ocupada ? 'sin turnos libres' : 'disponible'}`}
      onClick={() => onSeleccionar(cancha.id)}
      className={cn(
        'relative flex items-center justify-center overflow-hidden rounded-[10px] border border-cream/20 transition duration-150',
        'aspect-[3/2]',
        desktop && 'min-w-0 flex-1',
        ocupada
          ? 'cursor-not-allowed bg-occupied text-cream/25 opacity-55'
          : cn(
              'cursor-pointer bg-turf text-cream/55 active:scale-[0.94]',
              desktop && 'hover:-translate-y-[3px] hover:shadow-[0_10px_20px_rgba(0,0,0,0.35)] active:scale-100',
            ),
        seleccionada && 'outline-2 outline-offset-2 outline-orange',
        className,
      )}
    >
      <DibujoDeCancha ancho={MEDIDAS.ancho} alto={MEDIDAS.alto} />

      <span
        className={cn(
          'relative z-10 min-w-[34px] rounded-lg px-2 pt-[7px] pb-1.5 text-center font-display leading-none font-bold shadow-[0_4px_10px_rgba(0,0,0,0.25)]',
          desktop ? 'min-w-[38px] px-2.5 pt-2 pb-[7px] text-[15px]' : 'text-sm',
          ocupada ? 'bg-[#5b675e] text-[#c9d2cb]' : 'bg-orange text-ink',
        )}
      >
        {cancha.numero}
        <small
          className={cn(
            'mt-0.5 block font-sans text-[8px] font-medium tracking-[0.3px]',
            desktop && 'text-[8.5px]',
            ocupada ? 'text-[#8a9990]' : 'text-[#3a1d0d]',
          )}
        >
          {cancha.tipo}
        </small>
      </span>
    </button>
  );
}
