import type { ReactNode } from 'react';
import { TIPOS, type CanchaMapa } from '../lib/canchas';
import { pesos } from '../lib/formato';

/**
 * Las dos leyendas del mapa, separadas por lo que explica cada una:
 * arriba que significa el color de una cancha, y abajo (pegado al
 * mapa) cuanto sale cada tipo. Antes iban mezcladas en una sola fila y
 * no se entendia que los primeros cuatro chips y los ultimos cuatro
 * hablaban de cosas distintas.
 */

/** Que significa el color de cada cancha, segun su ocupacion del dia. */
export function LeyendaOcupacion() {
  return (
    <Fila etiqueta="Ocupación del día" className="px-[18px] pt-3.5 md:px-8">
      <Chip>
        <Muestra className="bg-turf" />
        Hasta 30%
      </Chip>
      <Chip>
        <Muestra className="bg-mostaza" />
        30 a 70%
      </Chip>
      <Chip>
        <Muestra className="bg-ladrillo" />
        Más de 70%
      </Chip>
      <Chip>
        <Muestra className="bg-occupied" />
        Completa
      </Chip>
    </Fila>
  );
}

/** Cuanto sale una hora en cada tipo de cancha, sin el recargo. */
export function LeyendaPrecios({ canchas }: { canchas: CanchaMapa[] }) {
  const precios = TIPOS.flatMap((tipo) => {
    const deTipo = canchas.filter((c) => c.tipo === tipo);
    return deTipo.length ? [{ tipo, precio: Math.min(...deTipo.map((c) => c.precio_base)) }] : [];
  });

  if (precios.length === 0) return null;

  return (
    <Fila etiqueta="Precio por turno">
      {precios.map(({ tipo, precio }) => (
        <Chip key={tipo}>
          {tipo} <b className="font-semibold text-cream">{pesos(precio)}</b>
        </Chip>
      ))}
    </Fila>
  );
}

function Fila({
  etiqueta,
  className,
  children,
}: {
  etiqueta: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex items-center gap-2 overflow-x-auto scrollbar-none md:gap-2.5 ${className ?? ''}`}>
      <span className="shrink-0 text-[11px] tracking-[1.2px] text-cream-dim uppercase">{etiqueta}</span>
      {children}
    </div>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <div className="flex shrink-0 items-center gap-[7px] rounded-[10px] border border-cream/10 bg-panel px-3 py-[7px] text-xs text-cream-dim md:px-[13px] md:text-[12.5px]">
      {children}
    </div>
  );
}

function Muestra({ className }: { className: string }) {
  return <span className={`size-[9px] rounded-[2px] ${className}`} />;
}
