import { cn } from '../lib/cn';

/**
 * Progreso de la reserva: un riel con un circulo numerado por paso.
 *
 * `actual` es el indice del paso en curso, empezando en 0. La barra se
 * reparte sola segun cuantos pasos reciba, asi que sumar uno (por
 * ejemplo "Pago", si algun dia se integra Mercado Pago) es agregarlo
 * al arreglo y nada mas.
 */
export function BarraDePasos({ pasos, actual }: { pasos: string[]; actual: number }) {
  // Primer paso 0%, ultimo 100%: el relleno llega hasta el centro del
  // circulo en curso, no hasta el borde de la barra.
  const recorrido = pasos.length > 1 ? (actual / (pasos.length - 1)) * 100 : 100;

  return (
    <div className="relative mx-auto w-full max-w-[560px] px-7">
      {/* El riel arranca y termina en el centro de los circulos de los
          extremos: por eso el padding lateral y el top a media altura. */}
      <div
        aria-hidden="true"
        className="absolute top-[22px] right-7 left-7 h-2.5 -translate-y-1/2 overflow-hidden rounded-full bg-occupied"
      >
        <div
          className="h-full rounded-full bg-orange transition-[width] duration-[350ms] ease-[cubic-bezier(0.3,0.7,0.4,1)] motion-reduce:transition-none"
          style={{ width: `${recorrido}%` }}
        />
      </div>

      <ol aria-label="Progreso de la reserva" className="relative flex list-none justify-between p-0">
        {pasos.map((paso, i) => {
          const esActual = i === actual;
          const hecho = i < actual;
          return (
            <li
              key={paso}
              aria-current={esActual ? 'step' : undefined}
              className="flex w-14 flex-col items-center"
            >
              <span
                className={cn(
                  // El borde del color del fondo recorta el circulo
                  // sobre el riel.
                  'flex size-11 items-center justify-center rounded-full border-[3px] border-pitch font-display text-xl font-bold',
                  'transition-colors duration-200 motion-reduce:transition-none',
                  esActual
                    ? 'bg-orange text-ink shadow-[0_0_0_5px_rgba(242,98,46,0.25)]'
                    : hecho
                      ? 'bg-orange text-ink'
                      : 'bg-occupied text-[#7f9286]',
                )}
              >
                {i + 1}
              </span>
              <span
                className={cn(
                  'mt-2.5 text-xs font-semibold tracking-[0.8px] whitespace-nowrap uppercase',
                  'transition-colors duration-200 motion-reduce:transition-none',
                  esActual ? 'text-orange' : hecho ? 'text-cream' : 'text-[#7f9286]',
                )}
              >
                {paso}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
