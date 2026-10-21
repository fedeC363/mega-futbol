import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { BarraDePasos } from '../components/BarraDePasos';
import { DateStrip } from '../components/DateStrip';
import { Aviso, Boton, Cargando } from '../components/ui';
import { useCargado } from '../hooks/useCargado';
import { modalidad, tipoDeCancha } from '../lib/canchas';
import { ALIAS_TRANSFERENCIA, WHATSAPP_NUMERO, whatsappUrl } from '../lib/contacto';
import { cargarCancha, cargarDisponibilidad, cargarParametros, horaEntera, porcentajeRecargo } from '../lib/datos';
import { mensajeDeError } from '../lib/errores';
import { conMayuscula, fechaLegible, horaCorta, hoyBA, rangoTurno } from '../lib/fechas';
import { pesos } from '../lib/formato';
import { supabase } from '../lib/supabase';
import type { Reserva } from '../lib/tipos';

const PASOS = ['Horario', 'Confirmar', 'Listo'];

/**
 * Pagina propia de cada cancha: se entra tocandola en el mapa.
 * El horario y la fecha viven en la URL, asi que el ida y vuelta por el
 * ingreso no pierde lo elegido y el link se puede compartir.
 */
export function ReservaPage() {
  const { canchaId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();

  const fecha = params.get('fecha') ?? hoyBA();
  const hora = params.get('hora');

  const [creada, setCreada] = useState<Reserva | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const cancha = useCargado(() => cargarCancha(canchaId), [canchaId]);
  const parametros = useCargado(cargarParametros, []);
  const turnos = useCargado(() => cargarDisponibilidad(canchaId, fecha), [canchaId, fecha]);

  const turno = turnos.data?.find((t) => t.hora_inicio === hora) ?? null;
  const paso = creada ? 2 : turno && !turno.ocupado ? 1 : 0;

  // Si el turno elegido se ocupo mientras tanto, se vuelve al paso 1.
  useEffect(() => {
    if (!hora || !turnos.data || creada) return;
    if (!turnos.data.some((t) => t.hora_inicio === hora && !t.ocupado)) {
      setError('Ese turno ya no está disponible. Elegí otro horario.');
      cambiarParams({ hora: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnos.data, hora, creada]);

  function cambiarParams(cambios: { fecha?: string; hora?: string | null }) {
    const siguiente = new URLSearchParams(params);
    if (cambios.fecha) {
      siguiente.set('fecha', cambios.fecha);
      siguiente.delete('hora');
    }
    if (cambios.hora === null) siguiente.delete('hora');
    else if (cambios.hora) siguiente.set('hora', cambios.hora);
    setParams(siguiente, { replace: true });
  }

  async function confirmar() {
    if (!hora) return;
    if (!session) {
      // Navegacion libre, login solo para reservar (spec 00, regla 1).
      navigate('/ingresar', { state: { volverA: location.pathname + location.search } });
      return;
    }
    setEnviando(true);
    setError(null);
    const { data, error } = await supabase.rpc('crear_reserva', {
      p_cancha_id: canchaId,
      p_fecha: fecha,
      p_hora_inicio: hora,
    });
    setEnviando(false);
    if (error) {
      setError(mensajeDeError(error));
      turnos.recargar();
      return;
    }
    setCreada(data);
  }

  if (cancha.cargando && !cancha.data) {
    return (
      <Contenedor>
        <Cargando />
      </Contenedor>
    );
  }
  if (cancha.error || !cancha.data) {
    return (
      <Contenedor>
        <Aviso>{cancha.error ?? 'No se encontró la cancha.'}</Aviso>
        <Link to="/" className="mt-4 inline-block text-[14px] font-semibold text-orange">
          ← Volver al mapa
        </Link>
      </Contenedor>
    );
  }

  const tipo = tipoDeCancha(cancha.data.capacidad);
  const p = parametros.data;

  return (
    <Contenedor>
      <Link to="/" className="text-[13px] text-cream-dim hover:text-cream">
        ← Volver al mapa
      </Link>

      <div className="mt-5">
        <BarraDePasos pasos={PASOS} actual={paso} />
      </div>

      <header className="mt-7">
        <h1 className="font-display text-[30px] leading-none font-bold">Cancha {cancha.data.numero}</h1>
        <p className="mt-1.5 text-[13px] text-cream-dim">
          {modalidad(tipo)} · {cancha.data.capacidad} jugadores · San Justo
        </p>
      </header>

      {error && (
        <div className="mt-5">
          <Aviso>{error}</Aviso>
        </div>
      )}

      {paso === 0 && (
        <section className="mt-5">
          <h2 className="text-[11px] tracking-[1.2px] text-cream-dim uppercase">Elegí el día y el horario</h2>
          <div className="-mx-4 md:mx-0">
            <DateStrip fecha={fecha} onCambiar={(f) => cambiarParams({ fecha: f })} />
          </div>

          <p className="mt-5 text-lg font-semibold text-orange">
            desde {pesos(cancha.data.precio_base)}
            <span className="text-sm font-medium text-orange/80"> / turno</span>
          </p>

          {turnos.error && (
            <div className="mt-4">
              <Aviso>{turnos.error}</Aviso>
            </div>
          )}
          {!turnos.data && !turnos.error && (
            <div className="mt-4">
              <Cargando texto="Buscando turnos…" />
            </div>
          )}

          {turnos.data && (
            <div
              role="radiogroup"
              aria-label="Horarios"
              className="menu-chico mt-4 grid grid-cols-3 gap-1.5 sm:grid-cols-5"
            >
              {turnos.data.map((t) => (
                <button
                  key={t.hora_inicio}
                  type="button"
                  role="radio"
                  aria-checked={false}
                  aria-label={`${horaCorta(t.hora_inicio)}, ${t.ocupado ? 'no disponible' : pesos(t.precio)}`}
                  disabled={t.ocupado}
                  onClick={() => cambiarParams({ hora: t.hora_inicio })}
                  className="opcion-menu py-2.5 text-center"
                >
                  <span className="block text-[13px] font-medium">{horaCorta(t.hora_inicio)}</span>
                  <span className="mt-0.5 block text-[11px] text-cream/75">{pesos(t.precio)}</span>
                </button>
              ))}
            </div>
          )}

          {turnos.data?.every((t) => t.ocupado) && (
            <p className="mt-4 text-[13px] text-cream-dim">No quedan turnos libres este día. Probá otra fecha.</p>
          )}

          {p && (
            <p className="mt-5 text-[11px] text-cream-dim">
              Turnos de 1 hora · recargo {porcentajeRecargo(p)}% desde las {horaCorta(p.recargoDesde)} · seña{' '}
              {pesos(p.sena)}
            </p>
          )}
        </section>
      )}

      {paso === 1 && turno && p && (
        <section className="mt-5">
          <h2 className="text-[11px] tracking-[1.2px] text-cream-dim uppercase">Revisá y confirmá</h2>

          <dl className="mt-3 divide-y divide-cream/8 rounded-xl border border-cream/10 bg-panel text-[13px]">
            <Fila termino="Cancha">
              {cancha.data.numero} · {modalidad(tipo)}
            </Fila>
            <Fila termino="Día">{conMayuscula(fechaLegible(fecha))}</Fila>
            <Fila termino="Horario">{rangoTurno(turno.hora_inicio)}</Fila>
            <Fila termino="Precio del turno">
              {pesos(turno.precio)}
              {horaEntera(turno.hora_inicio) >= horaEntera(p.recargoDesde) && (
                <span className="block text-[11px] font-normal text-cream-dim">
                  incluye recargo del {porcentajeRecargo(p)}%
                </span>
              )}
            </Fila>
            <Fila termino="Seña a transferir">{pesos(p.sena)}</Fila>
            <Fila termino="Resto en el predio">{pesos(turno.precio - p.sena)}</Fila>
          </dl>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <Boton className="w-full py-3.5" disabled={enviando} onClick={confirmar}>
              {enviando ? 'Reservando…' : 'Confirmar reserva'}
            </Boton>
            <Boton variante="secundaria" className="w-full py-3.5" onClick={() => cambiarParams({ hora: null })}>
              Cambiar horario
            </Boton>
          </div>

          {!session && (
            <p className="mt-3 text-center text-[11px] text-cream-dim">
              Te vamos a pedir que ingreses o crees una cuenta. No perdés el turno elegido.
            </p>
          )}
        </section>
      )}

      {paso === 2 && creada && (
        <ReservaLista reserva={creada} numero={cancha.data.numero} modalidadTexto={modalidad(tipo)} />
      )}
    </Contenedor>
  );
}

function Contenedor({ children }: { children: ReactNode }) {
  return (
    <main className="flex-1 px-4 pt-5 pb-28 md:overflow-y-auto md:px-8 md:pt-7 md:pb-10">
      <div className="mx-auto max-w-xl">{children}</div>
    </main>
  );
}

function Fila({ termino, children }: { termino: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 px-3.5 py-2.5">
      <dt className="text-cream-dim">{termino}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

/**
 * Paso final. En el MVP la reserva queda 'pendiente_pago': no se dice
 * que esta confirmada ni que llega comprobante por mail (eso es Fase 2).
 */
function ReservaLista({
  reserva,
  numero,
  modalidadTexto,
}: {
  reserva: Reserva;
  numero: number;
  modalidadTexto: string;
}) {
  return (
    <section className="mt-6">
      <p className="inline-flex items-center gap-1.5 rounded-full border border-turf-light/40 bg-turf-light/12 px-2.5 py-1 text-xs text-turf-light">
        ✓ Reserva creada
      </p>
      <h2 className="mt-3 font-display text-[26px] leading-tight font-bold">Falta la seña para confirmarla</h2>

      <dl className="mt-4 divide-y divide-cream/8 rounded-xl border border-cream/10 bg-panel text-[13px]">
        <Fila termino="Cancha">
          {numero} · {modalidadTexto}
        </Fila>
        <Fila termino="Día">{conMayuscula(fechaLegible(reserva.fecha))}</Fila>
        <Fila termino="Horario">{rangoTurno(reserva.hora_inicio)}</Fila>
        <Fila termino="Precio del turno">{pesos(reserva.precio_total)}</Fila>
        <Fila termino="Seña">{pesos(reserva.monto_sena)}</Fila>
        <Fila termino="Resto en el predio">{pesos(reserva.precio_total - reserva.monto_sena)}</Fila>
      </dl>

      <div className="mt-4">
        <Aviso tipo="info">
          Transferí la seña de {pesos(reserva.monto_sena)} al alias <b className="font-semibold">{ALIAS_TRANSFERENCIA}</b> y
          avisale al predio. Cuando un empleado la verifica, la reserva pasa a <b>confirmada</b>.
          {WHATSAPP_NUMERO && (
            <a
              href={whatsappUrl(WHATSAPP_NUMERO)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 block font-semibold text-orange"
            >
              Avisar por WhatsApp →
            </a>
          )}
        </Aviso>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <Link
          to="/perfil"
          className="rounded-xl border border-cream/15 bg-cream/5 px-4 py-3 text-center text-[15px] font-semibold hover:bg-cream/10"
        >
          Ver mis reservas
        </Link>
        <Link to="/" className="rounded-xl px-4 py-3 text-center text-[15px] font-semibold text-cream-dim hover:text-cream">
          Volver al mapa
        </Link>
      </div>
    </section>
  );
}
