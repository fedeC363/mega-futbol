import type { CanchaMapa } from '../lib/canchas';
import { modalidad } from '../lib/canchas';
import { cn } from '../lib/cn';

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
        'relative flex items-center justify-center rounded-[10px] border border-cream/20 transition duration-150',
        desktop ? 'aspect-[1/0.85] min-w-0 flex-1' : 'aspect-[1/1.05]',
        ocupada
          ? 'cursor-not-allowed bg-occupied opacity-55'
          : cn(
              'cursor-pointer bg-hatch-turf active:scale-[0.94]',
              desktop && 'hover:-translate-y-[3px] hover:shadow-[0_10px_20px_rgba(0,0,0,0.35)] active:scale-100',
            ),
        seleccionada && 'outline-2 outline-offset-2 outline-orange',
        className,
      )}
    >
      <span
        className={cn(
          'min-w-[34px] rounded-lg px-2 pt-[7px] pb-1.5 text-center font-display leading-none font-bold',
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
