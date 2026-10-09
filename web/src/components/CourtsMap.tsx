import type { ReactNode } from 'react';
import type { CanchaMapa, Tipo } from '../lib/canchas';
import { cn } from '../lib/cn';
import { CourtTile } from './CourtTile';

/**
 * Mapa del predio. Respeta el agrupamiento por fila de los bocetos
 * (F8 arriba, F7 y F6/F5 en el medio con el predio al costado, F5 finales
 * + estacionamiento abajo), pero toma las canchas de la base: la
 * numeracion y el tipo salen de los datos, no estan fijos en el layout.
 */
export function CourtsMap({
  canchas,
  seleccionadaId,
  onSeleccionar,
}: {
  canchas: CanchaMapa[];
  seleccionadaId: string | null;
  onSeleccionar: (id: string) => void;
}) {
  const de = (tipo: Tipo) => canchas.filter((c) => c.tipo === tipo);
  const [f8, f7, f6, f5] = [de('F8'), de('F7'), de('F6'), de('F5')];

  const tile = (c: CanchaMapa, variante: 'mobile' | 'desktop', className?: string) => (
    <CourtTile
      key={c.id}
      cancha={c}
      variante={variante}
      seleccionada={c.id === seleccionadaId}
      onSeleccionar={onSeleccionar}
      className={className}
    />
  );

  return (
    <>
      {/* Pantallas angostas y medianas: grilla de 6 columnas del boceto
          mobile. Se usa hasta 1024px y no hasta 768px porque con el
          menu fijo al costado, la fila de 7 canchas del otro diseño
          queda tan apretada que el numero no entra en la tarjeta. */}
      <div className="grid grid-cols-6 gap-2 lg:hidden">
        {f8.map((c) => tile(c, 'mobile', 'col-span-3'))}
        {f7.map((c) => tile(c, 'mobile', 'col-span-2'))}
        <Zona className="col-span-6 mt-2 min-h-[52px]">Predio · vestuarios &amp; buffet</Zona>
        {f6.map((c, i) => tile(c, 'mobile', cn('col-span-3', i < 2 && 'mt-2')))}
        {f5.map((c) => tile(c, 'mobile', 'col-span-2'))}
        <Zona className="col-span-6 mt-2 min-h-10">Estacionamiento</Zona>
      </div>

      {/* Desktop ancho: filas del boceto desktop */}
      <div className="hidden flex-col gap-2.5 lg:flex">
        <div className="flex gap-2.5">{f8.map((c) => tile(c, 'desktop'))}</div>
        <div className="flex items-stretch gap-2.5">
          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <div className="flex gap-2.5">{f7.map((c) => tile(c, 'desktop'))}</div>
            <div className="flex gap-2.5">{[...f6, ...f5.slice(0, 3)].map((c) => tile(c, 'desktop'))}</div>
          </div>
          {/* Angosto hasta que sobre ancho: lo que le saque al predio se
              lo lleva la fila de canchas, que es la que lo necesita. */}
          <Zona className="w-[150px] shrink-0 xl:w-[220px]">Predio · vestuarios &amp; buffet</Zona>
        </div>
        <div className="flex gap-2.5">
          {/* Mas ancho que el resto de la fila: son tres canchas apaisadas
              y si el bloque es angosto quedan demasiado chatas. */}
          <div className="flex w-[340px] shrink-0 gap-2.5">{f5.slice(3).map((c) => tile(c, 'desktop'))}</div>
          <Zona className="flex-1">Estacionamiento</Zona>
        </div>
      </div>
    </>
  );
}

/** Bloque decorativo del mapa, no interactivo (spec de frontend 2.3). */
function Zona({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-[10px] border border-dashed border-cream/25 bg-hatch-zone px-2 text-center text-[11px] tracking-[0.5px] text-cream-dim uppercase md:text-xs',
        className,
      )}
    >
      {children}
    </div>
  );
}
