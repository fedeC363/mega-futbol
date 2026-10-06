import { cn } from '../lib/cn';

/**
 * Barra de progreso de la reserva: le muestra al usuario cuanto le
 * falta para terminar. `actual` es el indice del paso en curso.
 */
export function BarraDePasos({ pasos, actual }: { pasos: string[]; actual: number }) {
  const porcentaje = ((actual + 1) / pasos.length) * 100;

  return (
    <div className="mx-auto w-full max-w-sm">
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={pasos.length}
        aria-valuenow={actual + 1}
        aria-valuetext={`Paso ${actual + 1} de ${pasos.length}: ${pasos[actual]}`}
        className="h-1.5 overflow-hidden rounded-full bg-cream/10"
      >
        <div
          className="h-full rounded-full bg-orange transition-[width] duration-300"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      <ol className="mt-2 flex justify-between text-[11px] font-medium tracking-wide uppercase">
        {pasos.map((paso, i) => (
          <li key={paso} className={cn(i <= actual ? 'text-orange' : 'text-cream-dim')}>
            {paso}
          </li>
        ))}
      </ol>
    </div>
  );
}
