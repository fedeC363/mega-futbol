import type { CSSProperties } from 'react';
import { CANCHAS_SAN_JUSTO, LIENZO, ZONAS_SAN_JUSTO } from '../config/layoutSanJusto';
import type { CanchaMapa } from '../lib/canchas';
import { CourtTile } from './CourtTile';

/** De coordenadas del lienzo a porcentajes: el mapa escala con el ancho. */
function posicion({ x, y, w, h }: { x: number; y: number; w: number; h: number }): CSSProperties {
  return {
    left: `${(x / LIENZO.ancho) * 100}%`,
    top: `${(y / LIENZO.alto) * 100}%`,
    width: `${(w / LIENZO.ancho) * 100}%`,
    height: `${(h / LIENZO.alto) * 100}%`,
  };
}

/**
 * Mapa del predio: un lienzo de 1000 x 700 unidades donde cada cancha
 * ocupa el lugar que le asigna src/config/layoutSanJusto.ts, con la
 * distribucion real del predio.
 *
 * Las canchas salen de la base (numero, tipo y ocupacion); del archivo
 * de layout sale unicamente donde va cada una y de que tamaño. Si una
 * cancha de la base no tiene lugar asignado, se avisa debajo en vez de
 * desaparecer sin que nadie se entere.
 */
export function CourtsMap({
  canchas,
  onSeleccionar,
}: {
  canchas: CanchaMapa[];
  onSeleccionar: (id: string) => void;
}) {
  const porNumero = new Map(canchas.map((c) => [c.numero, c]));
  const ubicadas = CANCHAS_SAN_JUSTO.flatMap((lugar) => {
    const cancha = porNumero.get(lugar.numero);
    return cancha ? [{ lugar, cancha }] : [];
  });
  const sinLugar = canchas.filter((c) => !CANCHAS_SAN_JUSTO.some((l) => l.numero === c.numero));

  return (
    <>
      {/* En pantallas angostas el predio no se achica hasta volverse
          ilegible: se desplaza de costado. */}
      <div className="overflow-x-auto pb-2">
        <div className="relative aspect-[1000/700] min-w-[720px] rounded-2xl border border-cream/8 bg-predio">
          {ZONAS_SAN_JUSTO.map((zona) => (
            <div
              key={zona.etiqueta}
              style={posicion(zona)}
              className="absolute flex items-center justify-center rounded-xl border border-dashed border-cream/20 bg-hatch-zone p-2 text-center text-[11px] tracking-[1px] text-cream-dim uppercase"
            >
              {zona.etiqueta}
            </div>
          ))}

          {ubicadas.map(({ lugar, cancha }) => (
            <CourtTile
              key={cancha.id}
              cancha={cancha}
              // Mas ancha que alta: los arcos van a los costados.
              horizontal={lugar.w > lugar.h}
              style={posicion(lugar)}
              onSeleccionar={onSeleccionar}
            />
          ))}
        </div>
      </div>

      {sinLugar.length > 0 && (
        <p className="mt-2 text-[11px] text-cream-dim">
          Sin lugar asignado en el mapa: {sinLugar.map((c) => c.numero).join(', ')}.
        </p>
      )}
    </>
  );
}
