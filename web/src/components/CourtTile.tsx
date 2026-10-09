import type { CanchaMapa, NivelOcupacion } from '../lib/canchas';
import { modalidad } from '../lib/canchas';
import { cn } from '../lib/cn';

/**
 * Colores segun que tan pedida esta la cancha. `tarjeta` pinta el fondo
 * y, via currentColor, las lineas del dibujo.
 *
 * El badge es naranja sobre el verde, pero blanco sobre el mostaza y el
 * ladrillo: contra esos dos fondos calidos el naranja se pierde.
 *
 * Los tres niveles tienen turnos libres, asi que los tres se clickean.
 */
const PALETA: Record<NivelOcupacion, { tarjeta: string; badge: string; tipo: string }> = {
  verde: {
    tarjeta: 'bg-turf text-cream/60',
    badge: 'bg-orange text-ink',
    tipo: 'text-[#3a1d0d]',
  },
  amarillo: {
    tarjeta: 'bg-mostaza text-[#fff7e0]/65',
    badge: 'bg-cream text-ink',
    tipo: 'text-ink/65',
  },
  rojo: {
    tarjeta: 'bg-ladrillo text-[#ffe6de]/60',
    badge: 'bg-cream text-ink',
    tipo: 'text-ink/65',
  },
};

/**
 * Orientacion de la tarjeta en el mapa. Una cancha es rectangular, asi
 * que la tarjeta tambien: vertical donde la ranura de la grilla es
 * angosta, y la misma proporcion rotada donde es ancha. Nunca cuadrada.
 */
export type Orientacion = 'vertical' | 'horizontal';

const MEDIDAS: Record<Orientacion, { ancho: number; alto: number; clase: string }> = {
  vertical: { ancho: 100, alto: 150, clase: 'aspect-[2/3]' },
  horizontal: { ancho: 150, alto: 100, clase: 'aspect-[3/2]' },
};

/**
 * Lineas de una cancha vista desde arriba: perimetro, mediocampo,
 * circulo central con su punto y las dos areas.
 *
 * El mediocampo siempre cruza el lado corto y las areas van en los dos
 * extremos largos, igual que en una cancha de verdad: al rotar la
 * tarjeta rota el dibujo, no se estira.
 *
 * El viewBox tiene la misma proporcion que la tarjeta, asi que
 * preserveAspectRatio="none" llena el espacio sin deformar nada y el
 * circulo central sigue siendo un circulo.
 *
 * El color sale de currentColor: el estado ocupado solo cambia una
 * clase de texto.
 */
function DibujoDeCancha({ ancho, alto, vertical }: { ancho: number; alto: number; vertical: boolean }) {
  const menor = Math.min(ancho, alto);
  const margen = menor * 0.07;
  const trazo = menor * 0.022;
  const radio = menor * 0.19;
  // El area es ancha en el sentido del arco y poco profunda hacia adentro.
  const largo = (vertical ? ancho : alto) * 0.5;
  const profundidad = (vertical ? alto : ancho) * 0.12;

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

        {vertical ? (
          <>
            <line x1={margen} y1={alto / 2} x2={ancho - margen} y2={alto / 2} />
            <rect x={(ancho - largo) / 2} y={margen} width={largo} height={profundidad} />
            <rect x={(ancho - largo) / 2} y={alto - margen - profundidad} width={largo} height={profundidad} />
          </>
        ) : (
          <>
            <line x1={ancho / 2} y1={margen} x2={ancho / 2} y2={alto - margen} />
            <rect x={margen} y={(alto - largo) / 2} width={profundidad} height={largo} />
            <rect x={ancho - margen - profundidad} y={(alto - largo) / 2} width={profundidad} height={largo} />
          </>
        )}

        <circle cx={ancho / 2} cy={alto / 2} r={radio} />
        <circle cx={ancho / 2} cy={alto / 2} r={trazo * 1.4} fill="currentColor" stroke="none" />
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
  orientacion = 'vertical',
  seleccionada,
  onSeleccionar,
  className,
}: {
  cancha: CanchaMapa;
  variante: 'mobile' | 'desktop';
  orientacion?: Orientacion;
  seleccionada: boolean;
  onSeleccionar: (id: string) => void;
  className?: string;
}) {
  const { ocupada } = cancha;
  const desktop = variante === 'desktop';
  const medidas = MEDIDAS[orientacion];

  return (
    <button
      type="button"
      disabled={ocupada}
      aria-pressed={seleccionada}
      aria-label={`Cancha ${cancha.numero}, ${modalidad(cancha.tipo)}, ${
        ocupada ? 'sin turnos libres' : `${cancha.porcentaje}% ocupada, disponible`
      }`}
      onClick={() => onSeleccionar(cancha.id)}
      className={cn(
        'relative flex items-center justify-center overflow-hidden rounded-[10px] border border-cream/20 transition duration-150',
        medidas.clase,
        desktop && 'min-w-0 flex-1',
        ocupada
          ? 'cursor-not-allowed bg-occupied text-cream/25 opacity-55'
          : cn(
              'cursor-pointer active:scale-[0.94]',
              PALETA[cancha.nivel].tarjeta,
              desktop && 'hover:-translate-y-[3px] hover:shadow-[0_10px_20px_rgba(0,0,0,0.35)] active:scale-100',
            ),
        seleccionada && 'outline-2 outline-offset-2 outline-orange',
        className,
      )}
    >
      <DibujoDeCancha ancho={medidas.ancho} alto={medidas.alto} vertical={orientacion === 'vertical'} />

      <span
        className={cn(
          'relative z-10 min-w-[34px] rounded-lg px-2 pt-[7px] pb-1.5 text-center font-display leading-none font-bold shadow-[0_4px_10px_rgba(0,0,0,0.25)]',
          desktop ? 'min-w-[38px] px-2.5 pt-2 pb-[7px] text-[15px]' : 'text-sm',
          ocupada ? 'bg-[#5b675e] text-[#c9d2cb]' : PALETA[cancha.nivel].badge,
        )}
      >
        {cancha.numero}
        <small
          className={cn(
            'mt-0.5 block font-sans text-[8px] font-medium tracking-[0.3px]',
            desktop && 'text-[8.5px]',
            ocupada ? 'text-[#8a9990]' : PALETA[cancha.nivel].tipo,
          )}
        >
          {cancha.tipo}
        </small>
      </span>
    </button>
  );
}
