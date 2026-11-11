import type { ReactNode } from 'react';

/**
 * Iconos propios en SVG, con motivos de cancha: camiseta, pizarra
 * tactica, podio, la pelota en el calendario. Mismo trazo (1.75) y caja
 * de 24 en todos, y un relleno tenue (RELLENO) que les da cuerpo sin
 * sumar un color: todo sale de currentColor.
 */
const RELLENO = { fill: 'currentColor', fillOpacity: 0.22, stroke: 'none' } as const;
const SOLIDO = { fill: 'currentColor', stroke: 'none' } as const;

const TRAZOS = {
  // Reservar: calendario con la pelota marcando el dia.
  calendario: (
    <>
      <path {...RELLENO} d="M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v2H3Z" />
      <rect x={3} y={5} width={18} height={16} rx={3} />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <circle cx={15} cy={15.5} r={3} />
      <path {...SOLIDO} d="m15 14.2 1.2.9-.45 1.4h-1.5l-.45-1.4Z" />
    </>
  ),
  // Perfil: tu camiseta, con el 7 en el pecho.
  perfil: (
    <>
      <path
        {...RELLENO}
        d="M8 3 4 5.5 2.5 10 6 11v10h12V11l3.5-1L20 5.5 16 3c-.7 1.5-2.2 2.3-4 2.3S8.7 4.5 8 3Z"
      />
      <path d="M8 3 4 5.5 2.5 10 6 11v10h12V11l3.5-1L20 5.5 16 3c-.7 1.5-2.2 2.3-4 2.3S8.7 4.5 8 3Z" />
      <path d="M10.5 11h3.5l-2.2 6" />
    </>
  ),
  // Beelup: la camara que transmite en vivo (el punto lleno es el "en vivo").
  camara: (
    <>
      <rect {...RELLENO} x={2} y={7} width={13} height={10} rx={2.5} />
      <rect x={2} y={7} width={13} height={10} rx={2.5} />
      <path d="m15 10.5 5-2.7v8.4l-5-2.7" />
      <circle cx={8.5} cy={12} r={2.3} />
      <circle {...SOLIDO} cx={20} cy={4} r={1.6} />
    </>
  ),
  // Contacto: globo de charla con los tres puntitos de "escribiendo".
  chat: (
    <>
      <path {...RELLENO} d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
      <circle {...SOLIDO} cx={9} cy={12} r={1.1} />
      <circle {...SOLIDO} cx={13} cy={12} r={1.1} />
      <circle {...SOLIDO} cx={17} cy={12} r={1.1} />
    </>
  ),
  // Panel de staff: la pizarra del DT, con la jugada dibujada.
  staff: (
    <>
      <rect {...RELLENO} x={4} y={4} width={16} height={17} rx={2.5} />
      <rect x={4} y={4} width={16} height={17} rx={2.5} />
      <rect {...SOLIDO} x={9} y={2.5} width={6} height={3} rx={1} />
      <circle cx={8.5} cy={10.5} r={1.6} />
      <path d="M14 13.5l2.5 2.5M16.5 13.5 14 16" />
      <path d="M9.6 12.2c.6 2.6 2 3.7 3.2 3.6" strokeDasharray="1.6 1.8" />
    </>
  ),
  // Panel de admin: perillas de parametros, con las perillas llenas.
  ajustes: (
    <>
      <path d="M4 6h3M11 6h9M4 12h9M17 12h3M4 18h5M13 18h7" />
      <circle {...SOLIDO} cx={9} cy={6} r={2.2} />
      <circle {...SOLIDO} cx={15} cy={12} r={2.2} />
      <circle {...SOLIDO} cx={11} cy={18} r={2.2} />
    </>
  ),
  // Estadisticas: el podio, con la estrella del primero.
  grafico: (
    <>
      <path {...RELLENO} d="M3 21v-7h6v-4h6v6h6v5Z" />
      <path d="M3 21v-7h6v-4h6v6h6v5ZM9 14v7M15 16v5" />
      <path {...SOLIDO} d="m12 2.8.8 1.7 1.8.2-1.4 1.2.4 1.8-1.6-.9-1.6.9.4-1.8-1.4-1.2 1.8-.2Z" />
    </>
  ),
  instagram: (
    <>
      <rect {...RELLENO} x={3} y={3} width={18} height={18} rx={5} />
      <rect x={3} y={3} width={18} height={18} rx={5} />
      <circle cx={12} cy={12} r={4} />
      <circle {...SOLIDO} cx={17.5} cy={6.5} r={1} />
    </>
  ),
  // Menu: tres lineas de distinto largo, como una formacion.
  menu: <path d="M4 7h16M4 12h11M4 17h14" />,
  cerrar: <path d="M6 6l12 12M18 6 6 18" />,
  externo: <path d="M7 17 17 7M8 7h9v9" />,
} satisfies Record<string, ReactNode>;

export type NombreIcono = keyof typeof TRAZOS;

export function Icono({ nombre, className = 'size-5' }: { nombre: NombreIcono; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {TRAZOS[nombre]}
    </svg>
  );
}
