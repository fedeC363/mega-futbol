import { Link } from 'react-router-dom';
import { useCargado } from '../hooks/useCargado';
import { cn } from '../lib/cn';
import { cargarParametros, cargarSede, horaEntera, type Parametros } from '../lib/datos';
import { horaActualBA } from '../lib/fechas';

/** Abierto entre el inicio del primer turno y el fin del ultimo. */
function estaAbierto(p: Parametros): boolean {
  const hora = horaActualBA();
  return hora >= horaEntera(p.primerTurno) && hora < horaEntera(p.ultimoTurno) + 1;
}

export function Header() {
  const sede = useCargado(cargarSede, []);
  const parametros = useCargado(cargarParametros, []);
  const abierto = parametros.data ? estaAbierto(parametros.data) : null;

  return (
    // Tres columnas (vacia | logo | estado): con la primera vacia, el
    // logo cae en el centro exacto aunque el cartel de la derecha
    // cambie de ancho. En pantallas angostas, una sola columna.
    <header className="sticky top-0 z-20 grid grid-cols-1 items-center gap-3.5 border-b border-cream/8 bg-linear-to-b from-pitch-2 to-pitch px-4 py-5 sm:grid-cols-[1fr_auto_1fr] sm:gap-0 sm:px-8 sm:pt-[26px] sm:pb-6 md:static">
      <Link to="/" className="justify-self-center text-center leading-none sm:col-start-2">
        <span className="block font-display text-[40px] font-bold tracking-[1px] uppercase sm:text-[52px]">
          Mega <span className="text-orange">Fútbol</span>
        </span>

        {/* Las dos rayitas al costado se dibujan con before/after. Hasta
            que carga el nombre de la sede queda invisible pero ocupando
            su lugar, para que el logo no salte. */}
        <span
          className={cn(
            "mt-2 flex items-center justify-center gap-2.5 text-xs font-semibold tracking-[3px] text-cream-dim uppercase before:h-px before:w-7 before:bg-cream/25 before:content-[''] after:h-px after:w-7 after:bg-cream/25 after:content-['']",
            !sede.data && 'invisible',
          )}
        >
          Sede {sede.data?.nombre ?? 'San Justo'}
        </span>
      </Link>

      {abierto !== null && (
        <div
          className={cn(
            'flex items-center gap-1.5 justify-self-center rounded-full border py-1.5 pr-3 pl-2.5 text-xs sm:col-start-3 sm:justify-self-end',
            abierto
              ? 'border-turf-light/35 bg-turf-light/12 text-turf-light'
              : 'border-cream/15 bg-cream/5 text-cream-dim',
          )}
        >
          <i className={cn('inline-block size-1.5 rounded-full', abierto ? 'bg-turf-light' : 'bg-cream-dim')} />
          {abierto ? 'Abierto ahora' : 'Cerrado ahora'}
        </div>
      )}
    </header>
  );
}
