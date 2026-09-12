import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { Pagina } from '../components/Pagina';
import { Aviso, Boton, Cargando, Insignia } from '../components/ui';
import { useCargado } from '../hooks/useCargado';
import { modalidad, tipoDeCancha } from '../lib/canchas';
import { estadoDe } from '../lib/estados';
import { fechaLegible, hoyBA, horaActualBA, rangoTurno } from '../lib/fechas';
import { pesos } from '../lib/formato';
import { supabase } from '../lib/supabase';

/** Sin boceto todavia: datos del usuario + historial de reservas. */
export function PerfilPage() {
  const { session, perfil, cargando, salir } = useAuth();
  const userId = session?.user.id;

  const reservas = useCargado(async () => {
    if (!userId) return [];
    // La RLS de reserva ya limita a las propias; el filtro es explicito igual
    // por si el usuario ademas es staff (en ese caso veria las de su sede).
    const { data, error } = await supabase
      .from('reserva')
      .select('id, fecha, hora_inicio, estado, precio_total, monto_sena, llegada_validada_at, cancha:cancha_id(numero, capacidad)')
      .eq('usuario_id', userId)
      .order('fecha', { ascending: false })
      .order('hora_inicio', { ascending: false });
    if (error) throw error;
    return data;
  }, [userId]);

  if (cargando) {
    return (
      <Pagina titulo="Perfil">
        <Cargando />
      </Pagina>
    );
  }

  if (!session) {
    return (
      <Pagina titulo="Perfil" ancho="max-w-md">
        <p className="text-[14px] text-cream-dim">Ingresá para ver tus datos y tus reservas.</p>
        <Link
          to="/ingresar"
          state={{ volverA: '/perfil' }}
          className="mt-4 block rounded-xl bg-orange px-4 py-3.5 text-center text-[15px] font-semibold text-ink"
        >
          Ingresar o crear cuenta
        </Link>
      </Pagina>
    );
  }

  // Solo para agrupar en pantalla; no decide nada de negocio.
  const hoy = hoyBA();
  const horaAhora = horaActualBA();
  const esProxima = (r: { fecha: string; hora_inicio: string }) =>
    r.fecha > hoy || (r.fecha === hoy && Number(r.hora_inicio.slice(0, 2)) >= horaAhora);
  const lista = reservas.data ?? [];
  const proximas = lista.filter(esProxima).reverse();
  const anteriores = lista.filter((r) => !esProxima(r));

  return (
    <Pagina
      titulo={perfil?.nombre ?? 'Perfil'}
      subtitulo={
        <>
          {session.user.email}
          {perfil?.telefono && <> · {perfil.telefono}</>}
        </>
      }
      acciones={
        <Boton variante="secundaria" className="px-3.5 py-2 text-[13px]" onClick={salir}>
          Cerrar sesión
        </Boton>
      }
    >
      {reservas.error && <Aviso>{reservas.error}</Aviso>}
      {reservas.cargando && !reservas.data && <Cargando texto="Cargando tus reservas…" />}

      {reservas.data && lista.length === 0 && (
        <div className="rounded-xl border border-cream/10 bg-panel px-5 py-8 text-center">
          <p className="text-[14px] text-cream-dim">Todavía no tenés reservas.</p>
          <Link to="/" className="mt-3 inline-block text-[14px] font-semibold text-orange">
            Reservar una cancha →
          </Link>
        </div>
      )}

      {proximas.length > 0 && <Seccion titulo="Próximas" reservas={proximas} />}
      {anteriores.length > 0 && <Seccion titulo="Anteriores" reservas={anteriores} />}

      {lista.length > 0 && (
        <p className="mt-6 text-[12px] leading-relaxed text-cream-dim">
          ¿Necesitás cancelar? Las cancelaciones se coordinan con el predio.{' '}
          <Link to="/contacto" className="text-orange">
            Ver contacto
          </Link>
        </p>
      )}
    </Pagina>
  );
}

type FilaReserva = {
  id: string;
  fecha: string;
  hora_inicio: string;
  estado: string;
  precio_total: number;
  monto_sena: number;
  cancha: { numero: number; capacidad: number } | null;
};

function Seccion({ titulo, reservas }: { titulo: string; reservas: FilaReserva[] }) {
  return (
    <section className="mb-7">
      <h2 className="mb-2.5 text-[11px] tracking-[1.2px] text-cream-dim uppercase">{titulo}</h2>
      <ul className="grid gap-2.5">
        {reservas.map((r) => {
          const estado = estadoDe(r.estado);
          return (
            <li key={r.id} className="rounded-xl border border-cream/10 bg-panel px-4 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-xl leading-tight font-bold">
                    {r.cancha ? `Cancha ${r.cancha.numero} · ${modalidad(tipoDeCancha(r.cancha.capacidad))}` : 'Cancha'}
                  </p>
                  <p className="mt-0.5 text-[13px] text-cream-dim first-letter:uppercase">
                    {fechaLegible(r.fecha)} · {rangoTurno(r.hora_inicio)}
                  </p>
                </div>
                <Insignia clases={estado.clases}>{estado.etiqueta}</Insignia>
              </div>
              <p className="mt-2.5 text-[12px] text-cream-dim">
                Turno {pesos(r.precio_total)} · seña {pesos(r.monto_sena)} · resto en el predio{' '}
                {pesos(r.precio_total - r.monto_sena)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
