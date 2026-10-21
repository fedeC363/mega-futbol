import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { SideMenu } from './SideMenu';
import { Terminos } from './Terminos';

/**
 * Estructura comun (spec de frontend, seccion 2):
 *  - mobile (< 768px): columna unica que scrollea + FAB flotante.
 *  - desktop: rail fijo a la izquierda + columna principal a pantalla
 *    completa; cada pagina maneja su propio scroll.
 */
export function AppShell() {
  return (
    <div className="min-h-dvh bg-pitch md:flex md:h-dvh md:overflow-hidden">
      <SideMenu />
      <div className="flex min-h-dvh min-w-0 flex-1 flex-col md:min-h-0">
        <Header />
        <Outlet />
      </div>

      {/* Los términos: el modal cuando hay que aceptarlos y el botón
          flotante para consultarlos, en todas las pantallas. */}
      <Terminos />
    </div>
  );
}
