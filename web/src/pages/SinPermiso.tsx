import { Link } from 'react-router-dom';
import { Pagina } from '../components/Pagina';

/**
 * Pantalla de "esto no es para vos", igual en todas las secciones de
 * admin. La base vuelve a verificar los permisos en cada funcion: esto
 * solo evita mostrar algo que no se va a poder usar.
 */
export function SinPermiso({
  titulo,
  volverA,
  hayDesesion,
}: {
  titulo: string;
  /** A donde volver despues de ingresar. */
  volverA: string;
  /** true = no hay nadie con sesion iniciada. */
  hayDesesion: boolean;
}) {
  return (
    <Pagina titulo={titulo} ancho="max-w-md">
      <p className="text-[14px] text-cream-dim">
        {hayDesesion ? 'Ingresá con tu cuenta de administrador.' : 'Tu cuenta no tiene permisos de administrador.'}
      </p>
      {hayDesesion && (
        <Link
          to="/ingresar"
          state={{ volverA }}
          className="mt-4 block rounded-xl bg-orange px-4 py-3.5 text-center text-[15px] font-semibold text-ink"
        >
          Ingresar
        </Link>
      )}
    </Pagina>
  );
}
