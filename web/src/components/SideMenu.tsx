import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { cn } from '../lib/cn';
import { BEELUP_URL } from '../lib/contacto';

interface Item {
  icono: string;
  etiqueta: string;
  /** Ruta interna, o `href` para links externos (Beelup). */
  to?: string;
  href?: string;
}

/**
 * Menu principal (spec de frontend 2.1). Mismo orden en los dos formatos:
 *  - mobile: FAB abajo a la izquierda que despliega los items hacia arriba.
 *  - desktop: rail fijo a la izquierda, colapsado muestra solo iconos.
 */
export function SideMenu() {
  const { empleado } = useAuth();
  const [railAbierto, setRailAbierto] = useState(false);
  const [fabAbierto, setFabAbierto] = useState(false);
  const { pathname } = useLocation();

  // Al navegar se cierra el FAB.
  useEffect(() => setFabAbierto(false), [pathname]);

  const items: Item[] = [
    { icono: '📅', etiqueta: 'Reservar', to: '/' },
    { icono: '👤', etiqueta: 'Perfil', to: '/perfil' },
    { icono: '📹', etiqueta: 'Beelup', href: BEELUP_URL },
    { icono: '💬', etiqueta: 'Contacto y redes', to: '/contacto' },
    // Solo para quien tiene una fila activa en empleado.
    ...(empleado ? [{ icono: '🗂️', etiqueta: 'Panel de staff', to: '/staff' }] : []),
  ];

  return (
    <>
      {/* Desktop: rail */}
      <nav
        aria-label="Menú principal"
        className={cn(
          'relative z-40 hidden shrink-0 flex-col gap-1.5 border-r border-cream/8 bg-pitch-2 py-[18px] transition-[width] duration-200 md:flex',
          railAbierto ? 'w-[220px] px-3' : 'w-16 items-center',
        )}
      >
        <button
          type="button"
          onClick={() => setRailAbierto((v) => !v)}
          aria-expanded={railAbierto}
          aria-label={railAbierto ? 'Contraer menú' : 'Expandir menú'}
          className={cn(
            'mb-[18px] size-[38px] shrink-0 rounded-[10px] bg-orange text-[17px] text-ink',
            railAbierto && 'self-start',
          )}
        >
          ☰
        </button>
        {items.map((item) => (
          <EnlaceMenu
            key={item.etiqueta}
            item={item}
            title={railAbierto ? undefined : item.etiqueta}
            className={({ activo }) =>
              cn(
                'flex items-center gap-3 overflow-hidden rounded-[10px] p-2.5 text-[13.5px] whitespace-nowrap hover:bg-cream/6 hover:text-cream',
                activo ? 'bg-cream/6 text-cream' : 'text-cream-dim',
              )
            }
          >
            <span className="w-5 shrink-0 text-center text-base" aria-hidden="true">
              {item.icono}
            </span>
            <span className={railAbierto ? '' : 'sr-only'}>{item.etiqueta}</span>
          </EnlaceMenu>
        ))}
      </nav>

      {/* Mobile: FAB */}
      <div className="fixed bottom-5 left-4 z-30 flex flex-col items-start gap-2.5 md:hidden">
        {items.map((item, i) => (
          <EnlaceMenu
            key={item.etiqueta}
            item={item}
            oculto={!fabAbierto}
            style={{ transitionDelay: fabAbierto ? `${(items.length - 1 - i) * 30}ms` : '0ms' }}
            onClick={() => setFabAbierto(false)}
            className={() =>
              cn(
                'flex items-center gap-[9px] rounded-full border border-cream/12 bg-panel py-[9px] pr-3.5 pl-[9px] text-[13px] whitespace-nowrap text-cream shadow-lg shadow-black/30 transition duration-200',
                fabAbierto ? 'translate-y-0 scale-100 opacity-100' : 'pointer-events-none translate-y-2 scale-90 opacity-0',
              )
            }
          >
            <span className="flex size-[26px] items-center justify-center rounded-full bg-turf-light text-[13px]" aria-hidden="true">
              {item.icono}
            </span>
            {item.etiqueta}
          </EnlaceMenu>
        ))}
        <button
          type="button"
          onClick={() => setFabAbierto((v) => !v)}
          aria-expanded={fabAbierto}
          aria-label={fabAbierto ? 'Cerrar menú' : 'Abrir menú'}
          className={cn(
            'flex size-[54px] items-center justify-center rounded-full bg-orange text-[22px] text-ink shadow-[0_8px_20px_rgba(242,98,46,0.4)] transition-transform duration-200',
            fabAbierto && 'rotate-45',
          )}
        >
          ☰
        </button>
      </div>
    </>
  );
}

function EnlaceMenu({
  item,
  className,
  oculto = false,
  children,
  ...resto
}: {
  item: Item;
  className: (estado: { activo: boolean }) => string;
  oculto?: boolean;
  children: React.ReactNode;
  title?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  const accesibilidad = oculto ? { 'aria-hidden': true, tabIndex: -1 } : {};

  if (item.href) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={className({ activo: false })} {...accesibilidad} {...resto}>
        {children}
      </a>
    );
  }
  return (
    <NavLink to={item.to!} end className={({ isActive }) => className({ activo: isActive })} {...accesibilidad} {...resto}>
      {children}
    </NavLink>
  );
}
