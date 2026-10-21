import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { Pagina } from '../components/Pagina';
import { Aviso, Boton, Cargando, Insignia } from '../components/ui';
import { useCargado } from '../hooks/useCargado';
import { modalidad, tipoDeCancha } from '../lib/canchas';
import { cargarParametros } from '../lib/datos';
import { mensajeDeError } from '../lib/errores';
import { estadoDe } from '../lib/estados';
import { conMayuscula, fechaDeTimestamp, fechaLegible, horaActualBA, hoyBA, rangoTurno } from '../lib/fechas';
import { pesos } from '../lib/formato';
import { CLASES_SANCION, sancionDe } from '../lib/sanciones';
import { supabase } from '../lib/supabase';
import { SinPermiso } from './SinPermiso';

interface ReservaDelUsuario {
  id: string;
  fecha: string;
  hora_inicio: string;
  estado: string;
  precio_total: number;
  monto_sena: number;
  sena_devuelta: boolean;
  llegada_validada_at: string | null;
  cancha_numero: number;
  cancha_capacidad: number;
}

interface PerfilCompleto {
  usuario: {
    id: string;
    nombre: string;
    telefono: string | null;
    email: string;
    created_at: string;
    inasistencias: number;
    suspensiones: number;
    suspendido_hasta: string | null;
    vetado: boolean;
  };
  reservas: ReservaDelUsuario[];
}

/** Ficha de un cliente: sus datos, su estado de sanciones y sus turnos. */
export function UsuarioPage() {
  const { usuarioId = '' } = useParams();
  const { session, esAdmin, cargando } = useAuth();
  const parametros = useCargado(cargarParametros, []);
  const [levantando, setLevantando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const perfil = useCargado(async () => {
    if (!esAdmin) return null;
    const { data, error } = await supabase.rpc('perfil_de_usuario', { p_usuario_id: usuarioId });
    if (error) throw error;
    return data as unknown as PerfilCompleto;
  }, [esAdmin, usuarioId]);

  async function levantarSancion() {
    setLevantando(true);
    setError(null);
    const { error } = await supabase.rpc('levantar_sancion', { p_usuario_id: usuarioId });
    setLevantando(false);
    if (error) return setError(mensajeDeError(error));
    perfil.recargar();
  }

  if (cargando) {
    return (
      <Pagina titulo="Usuario">
        <Cargando />
      </Pagina>
    );
  }
  if (!session || !esAdmin) {
    return <SinPermiso titulo="Usuario" volverA={`/admin/usuarios/${usuarioId}`} hayDesesion={!session} />;
  }

  const u = perfil.data?.usuario;
  const sancion = u ? sancionDe(u, parametros.data) : null;

  // "Próximas" = el turno todavía no empezó y la reserva sigue en pie.
  // El resto es historial, canceladas incluidas.
  const hoy = hoyBA();
  const hora = horaActualBA();
  const esProxima = (r: ReservaDelUsuario) =>
    r.estado !== 'cancelada' &&
    (r.fecha > hoy || (r.fecha === hoy && Number(r.hora_inicio.slice(0, 2)) >= hora));

  const reservas = perfil.data?.reservas ?? [];
  const proximas = [...reservas].filter(esProxima).reverse();
  const pasadas = reservas.filter((r) => !esProxima(r));

  return (
    <Pagina
      titulo={u?.nombre ?? 'Usuario'}
      subtitulo={u ? <>{u.email}{u.telefono && <> · {u.telefono}</>}</> : undefined}
      ancho="max-w-3xl"
      acciones={
        <Link to="/admin/usuarios" className="text-[13px] text-cream-dim hover:text-cream">
          ← Usuarios
        </Link>
      }
    >
      {perfil.error && <Aviso>{perfil.error}</Aviso>}
      {perfil.cargando && !perfil.data && <Cargando />}

      {u && (
        <>
          <section className="rounded-xl border border-cream/10 bg-panel px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl leading-none font-bold">Estado de la cuenta</h2>
                <p className="mt-1.5 text-[13px] text-cream-dim">
                  {sancion ? sancion.mensaje : 'Sin amonestaciones. Puede reservar con normalidad.'}
                </p>
              </div>
              {sancion && <Insignia clases={CLASES_SANCION[sancion.tipo]}>⚠ {sancion.etiqueta}</Insignia>}
            </div>

            <dl className="mt-4 grid gap-2 text-[13px] sm:grid-cols-3">
              <Dato termino="Inasistencias del ciclo">{u.inasistencias}</Dato>
              <Dato termino="Suspensiones cumplidas">{u.suspensiones}</Dato>
              <Dato termino="Cliente desde">{fechaDeTimestamp(u.created_at)}</Dato>
            </dl>

            {error && (
              <div className="mt-3">
                <Aviso>{error}</Aviso>
              </div>
            )}

            {(u.vetado || u.suspendido_hasta) && (
              <div className="mt-4">
                <Boton disabled={levantando} onClick={levantarSancion}>
                  {levantando ? 'Levantando…' : u.vetado ? 'Levantar el veto' : 'Levantar la suspensión'}
                </Boton>
                <p className="mt-2 text-[11px] text-cream-dim">
                  Deja la cuenta como nueva: sin suspensión, sin veto y con el contador de inasistencias en cero.
                </p>
              </div>
            )}
          </section>

          <Seccion titulo="Reservas próximas" vacio="No tiene turnos a futuro." reservas={proximas} />
          <Seccion titulo="Historial" vacio="Todavía no tiene reservas pasadas." reservas={pasadas} />

          <p className="mt-6 text-[11px] leading-relaxed text-cream-dim">
            Las reservas se borran 15 días después del turno, así que el historial muestra las últimas semanas.
          </p>
        </>
      )}
    </Pagina>
  );
}

function Dato({ termino, children }: { termino: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[10px] border border-cream/10 bg-pitch/60 px-3 py-2">
      <dt className="text-[11px] text-cream-dim">{termino}</dt>
      <dd className="mt-0.5 font-display text-lg leading-none font-bold">{children}</dd>
    </div>
  );
}

function Seccion({
  titulo,
  vacio,
  reservas,
}: {
  titulo: string;
  vacio: string;
  reservas: ReservaDelUsuario[];
}) {
  return (
    <section className="mt-7">
      <h2 className="mb-2.5 font-display text-xl leading-none font-bold">{titulo}</h2>
      {reservas.length === 0 ? (
        <p className="rounded-xl border border-cream/10 bg-panel px-4 py-5 text-[13px] text-cream-dim">{vacio}</p>
      ) : (
        <ul className="grid gap-2">
          {reservas.map((r) => {
            const estado = estadoDe(r.estado);
            return (
              <li key={r.id} className="rounded-xl border border-cream/10 bg-panel px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                  <div>
                    <p className="font-semibold">
                      Cancha {r.cancha_numero} · {modalidad(tipoDeCancha(r.cancha_capacidad))}
                    </p>
                    <p className="mt-0.5 text-[13px] text-cream-dim">
                      {conMayuscula(fechaLegible(r.fecha))} · {rangoTurno(r.hora_inicio)}
                    </p>
                  </div>
                  <Insignia clases={estado.clases}>{estado.etiqueta}</Insignia>
                </div>
                <p className="mt-2 text-[12px] text-cream-dim">
                  Turno {pesos(r.precio_total)} · seña {pesos(r.monto_sena)}
                  {r.llegada_validada_at && <> · llegó</>}
                  {r.estado === 'cancelada' && <> · seña {r.sena_devuelta ? 'devuelta' : 'no devuelta'}</>}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
