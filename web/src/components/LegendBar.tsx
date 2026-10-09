import { TIPOS, type CanchaMapa } from '../lib/canchas';
import { pesos } from '../lib/formato';

/** Chips de disponible/ocupada + precio base por tipo (spec de frontend 2). */
export function LegendBar({ canchas }: { canchas: CanchaMapa[] }) {
  const precios = TIPOS.flatMap((tipo) => {
    const deTipo = canchas.filter((c) => c.tipo === tipo);
    return deTipo.length ? [{ tipo, precio: Math.min(...deTipo.map((c) => c.precio_base)) }] : [];
  });

  return (
    <div className="flex gap-2 overflow-x-auto px-[18px] pt-3.5 scrollbar-none md:gap-2.5 md:border-b md:border-cream/6 md:px-8 md:py-3.5">
      {/* Escala de ocupacion del dia elegido: explica por que una
          cancha esta de un color y no de otro. */}
      <Chip>
        <span className="size-[9px] rounded-[2px] bg-turf" />
        Hasta 30%
      </Chip>
      <Chip>
        <span className="size-[9px] rounded-[2px] bg-mostaza" />
        30 a 70%
      </Chip>
      <Chip>
        <span className="size-[9px] rounded-[2px] bg-ladrillo" />
        Más de 70%
      </Chip>
      <Chip>
        <span className="size-[9px] rounded-[2px] bg-occupied" />
        Completa
      </Chip>
      {precios.map(({ tipo, precio }) => (
        <Chip key={tipo}>
          {tipo} <b className="font-semibold text-cream">{pesos(precio)}</b>
        </Chip>
      ))}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex shrink-0 items-center gap-[7px] rounded-[10px] border border-cream/10 bg-panel px-3 py-[7px] text-xs text-cream-dim md:px-[13px] md:text-[12.5px]">
      {children}
    </div>
  );
}
