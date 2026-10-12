import type { CSSProperties } from 'react';
import type { CanchaMapa, NivelOcupacion } from '../lib/canchas';
import { modalidad } from '../lib/canchas';
import { cn } from '../lib/cn';

/**
 * Colores segun que tan pedida esta la cancha. `tarjeta` pinta el fondo
 * y, via currentColor, las lineas del dibujo y el circulo central.
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
 * Lineas rectas de la cancha: perimetro, mediocampo y las dos areas.
 *
 * El viewBox se estira al tamaño de la tarjeta (preserveAspectRatio
 * none), pero vector-effect mantiene el grosor del trazo parejo en
 * canchas anchas y angostas por igual. El circulo central NO va acá:
 * estirado seria una elipse. Lo dibuja el componente con un elemento
 * cuadrado aparte.
 */
function LineasDeCancha({ horizontal }: { horizontal: boolean }) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full"
    >
      <g fill="none" stroke="currentColor" strokeWidth={2} vectorEffect="non-scaling-stroke">
        {horizontal ? (
          <>
            <rect x={4} y={6} width={92} height={88} rx={2} />
            <line x1={50} y1={6} x2={50} y2={94} />
            <rect x={4} y={28} width={12} height={44} />
            <rect x={84} y={28} width={12} height={44} />
          </>
        ) : (
          <>
            <rect x={6} y={4} width={88} height={92} rx={2} />
            <line x1={6} y1={50} x2={94} y2={50} />
            <rect x={28} y={4} width={44} height={11} />
            <rect x={28} y={85} width={44} height={11} />
          </>
        )}
      </g>
    </svg>
  );
}

/**
 * Una cancha del mapa (spec de frontend 2.2). Muestra numero + tipo en
 * el badge, no la capacidad, para no confundir jugadores con modalidad.
 *
 * No decide ni su tamaño ni su lugar: los recibe en `style` desde el
 * layout del predio (src/config/layoutSanJusto.ts).
 */
export function CourtTile({
  cancha,
  horizontal,
  style,
  onSeleccionar,
}: {
  cancha: CanchaMapa;
  horizontal: boolean;
  style: CSSProperties;
  onSeleccionar: (id: string) => void;
}) {
  const { ocupada } = cancha;

  return (
    <button
      type="button"
      disabled={ocupada}
      style={style}
      aria-label={`Cancha ${cancha.numero}, ${modalidad(cancha.tipo)}, ${
        ocupada ? 'sin turnos libres' : `${cancha.porcentaje}% ocupada, disponible`
      }`}
      onClick={() => onSeleccionar(cancha.id)}
      className={cn(
        'absolute flex origin-center items-center justify-center overflow-hidden rounded-[10px] border border-cream/15',
        ocupada
          ? // Sin turnos libres: no se clickea, asi que tampoco se anima.
            'cursor-not-allowed bg-occupied text-cream/25 opacity-60'
          : cn(
              // La sombra en reposo es la misma con la que arranca y
              // termina el pulso del hover (ver cancha-clickeable).
              'cancha-clickeable cursor-pointer shadow-[0_6px_14px_rgba(0,0,0,0.35)] active:scale-[0.94]',
              PALETA[cancha.nivel].tarjeta,
            ),
      )}
    >
      <LineasDeCancha horizontal={horizontal} />

      {/* Circulo central: cuadrado y redondeado, asi nunca se deforma. */}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute top-1/2 left-1/2 aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-current',
          horizontal ? 'h-[58%]' : 'w-[62%]',
        )}
      />

      <span
        className={cn(
          'relative z-10 min-w-9 rounded-lg px-2.5 pt-[7px] pb-1.5 text-center font-display text-[17px] leading-none font-bold shadow-[0_4px_10px_rgba(0,0,0,0.25)]',
          ocupada ? 'bg-[#5b675e] text-[#c9d2cb]' : PALETA[cancha.nivel].badge,
        )}
      >
        {cancha.numero}
        <small
          className={cn(
            'mt-0.5 block font-sans text-[8.5px] font-medium tracking-[0.3px]',
            ocupada ? 'text-[#8a9990]' : PALETA[cancha.nivel].tipo,
          )}
        >
          {cancha.tipo}
        </small>
      </span>
    </button>
  );
}
