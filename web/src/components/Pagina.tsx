import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

/** Contenedor de las pantallas que no son el mapa (perfil, staff, etc.). */
export function Pagina({
  titulo,
  subtitulo,
  ancho = 'max-w-2xl',
  acciones,
  children,
}: {
  titulo: string;
  subtitulo?: ReactNode;
  ancho?: string;
  acciones?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="flex-1 px-4 pt-6 pb-28 md:overflow-y-auto md:px-8 md:pt-8 md:pb-10">
      <div className={cn('mx-auto', ancho)}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-[30px] leading-none font-bold">{titulo}</h1>
            {subtitulo && <p className="mt-1.5 text-[13px] text-cream-dim">{subtitulo}</p>}
          </div>
          {acciones}
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
