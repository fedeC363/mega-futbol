import type { ReactNode } from 'react';
import { TIPOS, type CanchaMapa } from '../lib/canchas';
import { pesos } from '../lib/formato';

/**
 * Una fila de filtros del mapa: etiqueta a la izquierda, contenido a la
 * derecha.
 *
 * La columna de la etiqueta tiene ancho fijo, asi que las tres filas
 * (ocupacion, precios y fecha) arrancan sus chips en la misma linea
 * vertical. En pantallas angostas la etiqueta pasa arriba, pero el
 * borde izquierdo sigue siendo el mismo.
 */
export function FilaDeFiltro({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1.5 md:grid-cols-[150px_1fr] md:items-center md:gap-3">
      <p className="text-[11px] tracking-[1.2px] text-cream-dim uppercase">{etiqueta}</p>
      {children}
    </div>
  );
}

/** Que significa el color de cada cancha, segun su ocupacion del dia. */
export function LeyendaOcupacion() {
  return (
    <FilaDeFiltro etiqueta="Ocupación del día">
      <div className="flex flex-wrap gap-2">
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
      </div>
    </FilaDeFiltro>
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
    <FilaDeFiltro etiqueta="Precio por turno">
      <div className="flex flex-wrap gap-2">
        {precios.map(({ tipo, precio }) => (
          <Chip key={tipo}>
            {tipo} <b className="font-semibold text-cream">{pesos(precio)}</b>
          </Chip>
        ))}
      </div>
    </FilaDeFiltro>
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
