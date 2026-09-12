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
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-cream/8 bg-linear-to-b from-pitch-2 to-pitch px-[18px] pt-[22px] pb-3.5 md:static md:px-8 md:py-[18px]">
      <Link to="/" className="block">
        <div className="font-display text-[26px] leading-none font-bold tracking-[0.3px]">
          MEGA <span className="text-orange">FÚTBOL</span>
        </div>
        <div className="mt-[3px] text-xs text-cream-dim">
          {sede.data ? `Sede ${sede.data.nombre}` : ' '}
        </div>
      </Link>

      {abierto !== null && (
        <div
          className={cn(
            'flex items-center gap-1.5 rounded-full border py-[5px] pr-2.5 pl-2 text-[11px] md:py-1.5 md:pr-3 md:text-xs',
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
