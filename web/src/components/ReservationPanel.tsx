import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { modalidad, type CanchaMapa } from '../lib/canchas';
import { cn } from '../lib/cn';
import { horaEntera, porcentajeRecargo, type Parametros } from '../lib/datos';
import { mensajeDeError } from '../lib/errores';
import { fechaLegible, horaCorta, rangoTurno } from '../lib/fechas';
import { pesos } from '../lib/formato';
import { supabase } from '../lib/supabase';
import type { Reserva, Turno } from '../lib/tipos';
import { Aviso, Boton, Cargando } from './ui';

/** Lo que se guarda para retomar la reserva despues de ingresar. */
export interface ReservaPendiente {
  canchaId: string;
  fecha: string;
  hora: string;
}

/**
 * Panel de reserva (spec de frontend 2.4). Se monta con `key` por
 * cancha+fecha, asi que cambiar de cancha o de dia arranca de cero.
 *
 * Todo lo que es regla de negocio lo decide la base: que turnos estan
 * libres y cuanto cuestan (disponibilidad) y si la reserva procede
 * (crear_reserva). Aca solo se muestra y se llama.
 */
export function ReservationPanel({
  cancha,
  fecha,
  parametros,
  horaInicial,
  onCerrar,
  onReservada,
}: {
  cancha: CanchaMapa;
  fecha: string;
  parametros?: Parametros;
  horaInicial: string | null;
  onCerrar: () => void;
  onReservada: () => void;
}) {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [turnos, setTurnos] = useState<Turno[] | null>(null);
  const [errorTurnos, setErrorTurnos] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [hora, setHora] = useState<string | null>(horaInicial);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creada, setCreada] = useState<Reserva | null>(null);

  useEffect(() => {
    let vigente = true;
    supabase.rpc('disponibilidad', { p_cancha_id: cancha.id, p_fecha: fecha }).then(({ data, error }) => {
      if (!vigente) return;
      if (error) {
        setErrorTurnos(mensajeDeError(error));
        return;
      }
      setErrorTurnos(null);
      setTurnos(data);
      // Si el turno elegido se ocupo mientras tanto, se deselecciona.
      setHora((h) => (h && data.some((t) => t.hora_inicio === h && !t.ocupado) ? h : null));
    });
    return () => {
      vigente = false;
    };
  }, [cancha.id, fecha, version]);

  const turno = turnos?.find((t) => t.hora_inicio === hora) ?? null;
  const libres = turnos?.filter((t) => !t.ocupado).length ?? 0;

  async function reservar() {
    if (!hora) return;
    if (!session) {
      // Navegacion libre, login solo para reservar (spec 00, regla 1).
      const reserva: ReservaPendiente = { canchaId: cancha.id, fecha, hora };
      navigate('/ingresar', { state: { volverA: '/', reserva } });
      return;
    }
    setEnviando(true);
    setError(null);
    const { data, error } = await supabase.rpc('crear_reserva', {
      p_cancha_id: cancha.id,
      p_fecha: fecha,
      p_hora_inicio: hora,
    });
    setEnviando(false);
    if (error) {
      setError(mensajeDeError(error));
      setVersion((v) => v + 1); // el turno pudo haberse ocupado
      return;
    }
    setCreada(data);
    onReservada();
  }

  return (
    <div>
      <div className="mx-auto mb-3.5 h-1 w-9 rounded bg-cream/25 md:hidden" aria-hidden="true" />

      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl leading-tight font-bold md:text-[30px]">Cancha {cancha.numero}</h2>
          <p className="mt-0.5 text-xs text-cream-dim md:text-[13px]">
            {modalidad(cancha.tipo)} · {fechaLegible(fecha)}, San Justo
          </p>
        </div>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-cream/8 text-cream-dim hover:text-cream"
        >
          ✕
        </button>
      </div>

      {creada ? (
        <ReservaCreada reserva={creada} cancha={cancha} onOtra={onCerrar} />
      ) : (
        <>
          <p className="mt-2.5 text-lg font-semibold text-orange md:mt-3.5 md:text-[19px]">
            {turno ? pesos(turno.precio) : `desde ${pesos(cancha.precio_base)}`}
            <span className="text-sm font-medium text-orange/80"> / turno</span>
          </p>
          {turno && turno.precio > cancha.precio_base && parametros && (
            <p className="mt-0.5 text-[11px] text-cream-dim">
              Incluye recargo del {porcentajeRecargo(parametros)}% desde las {horaCorta(parametros.recargoDesde)}
            </p>
          )}

          <div className="my-4 md:my-5">
            {errorTurnos && <Aviso>{errorTurnos}</Aviso>}
            {!turnos && !errorTurnos && <Cargando texto="Buscando turnos…" />}
            {turnos && (
              <div role="radiogroup" aria-label="Horarios" className="grid grid-cols-4 gap-2 md:grid-cols-3 md:gap-[9px]">
                {turnos.map((t) => {
                  const elegido = t.hora_inicio === hora;
                  return (
                    <button
                      key={t.hora_inicio}
                      type="button"
                      role="radio"
                      aria-checked={elegido}
                      disabled={t.ocupado}
                      onClick={() => setHora(t.hora_inicio)}
                      className={cn(
                        'rounded-lg border py-[9px] text-center text-[12.5px] md:py-[11px] md:text-[13px]',
                        elegido
                          ? 'border-orange bg-orange font-semibold text-ink'
                          : 'border-cream/12 bg-cream/5',
                        t.ocupado ? 'cursor-not-allowed line-through opacity-30' : !elegido && 'hover:border-cream/30',
                      )}
                    >
                      {horaCorta(t.hora_inicio)}
                      {parametros && horaEntera(t.hora_inicio) === horaEntera(parametros.recargoDesde) && !elegido && (
                        <span className="sr-only"> (desde acá rige el recargo)</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {turnos && libres === 0 && (
              <p className="mt-3 text-[13px] text-cream-dim">No quedan turnos libres este día. Probá otra fecha.</p>
            )}
          </div>

          {error && (
            <div className="mb-3">
              <Aviso>{error}</Aviso>
            </div>
          )}

          <Boton className="w-full py-3.5" disabled={!hora || enviando} onClick={reservar}>
            {enviando
              ? 'Reservando…'
              : `Reservar — seña ${parametros ? pesos(parametros.sena) : ''}`}
          </Boton>

          <p className="mt-3 text-center text-[11px] leading-relaxed text-cream-dim">
            {turno && parametros
              ? `Seña ${pesos(parametros.sena)} · el resto (${pesos(turno.precio - parametros.sena)}) se abona en el predio`
              : 'Elegí un horario para reservar'}
            {!session && hora && (
              <>
                <br />
                Te vamos a pedir que ingreses o crees una cuenta.
              </>
            )}
          </p>
        </>
      )}
    </div>
  );
}

/**
 * Confirmacion de la reserva creada. En el MVP la reserva queda en
 * 'pendiente_pago': NO se le dice al usuario que esta confirmada, ni que
 * recibe comprobante por mail (eso es Fase 2, ver spec 03).
 */
function ReservaCreada({
  reserva,
  cancha,
  onOtra,
}: {
  reserva: Reserva;
  cancha: CanchaMapa;
  onOtra: () => void;
}) {
  const resto = reserva.precio_total - reserva.monto_sena;

  return (
    <div className="mt-5">
      <p className="inline-flex items-center gap-1.5 rounded-full border border-turf-light/40 bg-turf-light/12 px-2.5 py-1 text-xs text-turf-light">
        ✓ Reserva creada
      </p>
      <h3 className="mt-3 font-display text-[22px] leading-tight font-bold">Falta la seña para confirmarla</h3>

      <dl className="mt-4 divide-y divide-cream/8 rounded-xl border border-cream/10 bg-pitch/60 text-[13px]">
        <Fila termino="Cancha">
          {cancha.numero} · {modalidad(cancha.tipo)}
        </Fila>
        <Fila termino="Día">{fechaLegible(reserva.fecha)}</Fila>
        <Fila termino="Horario">{rangoTurno(reserva.hora_inicio)}</Fila>
        <Fila termino="Precio del turno">{pesos(reserva.precio_total)}</Fila>
        <Fila termino="Seña">{pesos(reserva.monto_sena)}</Fila>
        <Fila termino="Resto en el predio">{pesos(resto)}</Fila>
      </dl>

      <div className="mt-4">
        <Aviso tipo="info">
          Para confirmar el turno, transferí la seña de {pesos(reserva.monto_sena)} y avisale al predio. Cuando un
          empleado la verifica, la reserva pasa a <b>confirmada</b>.
          <span className="mt-2 block text-cream-dim italic">Datos para transferir: a definir.</span>
        </Aviso>
      </div>

      <div className="mt-5 grid gap-2">
        <Link
          to="/perfil"
          className="rounded-xl border border-cream/15 bg-cream/5 px-4 py-3 text-center text-[15px] font-semibold hover:bg-cream/10"
        >
          Ver mis reservas
        </Link>
        <Boton variante="fantasma" onClick={onOtra}>
          Reservar otro turno
        </Boton>
      </div>
    </div>
  );
}

function Fila({ termino, children }: { termino: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 px-3.5 py-2.5">
      <dt className="text-cream-dim">{termino}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}
