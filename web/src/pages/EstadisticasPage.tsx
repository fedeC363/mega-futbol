import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../auth/AuthProvider';
import { Pagina } from '../components/Pagina';
import { Aviso, Cargando } from '../components/ui';
import { useCargado } from '../hooks/useCargado';
import { modalidad, tipoDeCancha } from '../lib/canchas';
import { cargarSede } from '../lib/datos';
import { supabase } from '../lib/supabase';

/**
 * Paleta categorica para los dos graficos de torta. No esta elegida a
 * ojo: son los cuatro primeros tonos de la paleta de referencia para
 * fondo oscuro, validados contra nuestro panel (#16281D) en los seis
 * chequeos (banda de luminosidad, croma, separacion para daltonismo,
 * separacion a vista normal y contraste).
 */
const CATEGORICOS = ['#3987e5', '#d95926', '#199e70', '#c98500'];

/** Una sola serie: un solo color. */
const SERIE_UNICA = '#d95926';

const TEXTO = '#f3ede1';
const TEXTO_TENUE = '#9fb3a6';

const ESTILO_TOOLTIP = {
  contentStyle: {
    background: '#16281d',
    border: '1px solid rgba(243,237,225,0.15)',
    borderRadius: 10,
    fontSize: 12,
    color: TEXTO,
  },
  labelStyle: { color: TEXTO },
  itemStyle: { color: TEXTO_TENUE },
} as const;

interface Estadisticas {
  total: number;
  por_cancha: { numero: number; capacidad: number; cantidad: number }[];
  por_tipo: { capacidad: number; cantidad: number }[];
  por_franja: { franja: string; desde: number; cantidad: number }[];
}

const RANGOS: Record<number, string> = {
  8: '08 a 12',
  12: '12 a 16',
  16: '16 a 19',
  19: '19 a 23',
};

/**
 * Estadisticas del predio, solo para admin. Los numeros los calcula la
 * base (estadisticas_del_predio); aca solo se dibujan.
 */
export function EstadisticasPage() {
  const { session, esAdmin, cargando } = useAuth();
  const sede = useCargado(cargarSede, []);
  const sedeId = sede.data?.id;

  const datos = useCargado(async () => {
    if (!sedeId) return null;
    const { data, error } = await supabase.rpc('estadisticas_del_predio', { p_sede_id: sedeId });
    if (error) throw error;
    return data as unknown as Estadisticas;
  }, [sedeId]);

  if (cargando) {
    return (
      <Pagina titulo="Estadísticas">
        <Cargando />
      </Pagina>
    );
  }

  if (!session || !esAdmin) {
    return (
      <Pagina titulo="Estadísticas" ancho="max-w-md">
        <p className="text-[14px] text-cream-dim">
          {session ? 'Tu cuenta no tiene permisos de administrador.' : 'Ingresá con tu cuenta de administrador.'}
        </p>
        {!session && (
          <Link
            to="/ingresar"
            state={{ volverA: '/estadisticas' }}
            className="mt-4 block rounded-xl bg-orange px-4 py-3.5 text-center text-[15px] font-semibold text-ink"
          >
            Ingresar
          </Link>
        )}
      </Pagina>
    );
  }

  const e = datos.data;

  // Ranking: de la que más se alquiló a la que menos.
  const ranking = [...(e?.por_cancha ?? [])]
    .sort((a, b) => b.cantidad - a.cantidad || a.numero - b.numero)
    .map((c) => ({
      etiqueta: `${c.numero} · ${tipoDeCancha(c.capacidad)}`,
      cantidad: c.cantidad,
    }));

  const porTipo = (e?.por_tipo ?? [])
    .filter((t) => t.cantidad > 0)
    .map((t) => ({ nombre: modalidad(tipoDeCancha(t.capacidad)), cantidad: t.cantidad }));

  const porFranja = (e?.por_franja ?? []).map((f) => ({
    nombre: `${f.franja} (${RANGOS[f.desde] ?? ''})`,
    cantidad: f.cantidad,
  }));

  return (
    <Pagina
      titulo="Estadísticas"
      subtitulo="Reservas confirmadas y jugadas. Las canceladas no cuentan."
      ancho="max-w-3xl"
    >
      {datos.error && <Aviso>{datos.error}</Aviso>}
      {datos.cargando && !e && <Cargando texto="Calculando…" />}

      {e && e.total === 0 && (
        <p className="rounded-xl border border-cream/10 bg-panel px-5 py-10 text-center text-[14px] text-cream-dim">
          Todavía no hay reservas confirmadas para mostrar.
        </p>
      )}

      {e && e.total > 0 && (
        <>
          <p className="mb-6 text-[13px] text-cream-dim">
            <b className="font-display text-2xl text-cream">{e.total}</b> reservas confirmadas en total.
          </p>

          <Seccion
            titulo="Canchas más alquiladas"
            detalle="Cada cancha con su cantidad de reservas, de la más pedida a la que menos."
          >
            <ResponsiveContainer width="100%" height={ranking.length * 26 + 30}>
              <BarChart data={ranking} layout="vertical" margin={{ top: 4, right: 40, bottom: 4, left: 4 }}>
                <CartesianGrid horizontal={false} stroke="rgba(243,237,225,0.08)" />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: TEXTO_TENUE, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="etiqueta"
                  width={74}
                  tick={{ fill: TEXTO_TENUE, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip {...ESTILO_TOOLTIP} cursor={{ fill: 'rgba(243,237,225,0.06)' }} />
                <Bar dataKey="cantidad" name="Reservas" fill={SERIE_UNICA} radius={[0, 4, 4, 0]} barSize={13}>
                  <LabelList dataKey="cantidad" position="right" fill={TEXTO} fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Seccion>

          <Seccion titulo="Tipo de cancha más alquilado" detalle="Agrupado por cantidad de jugadores.">
            <Torta datos={porTipo} />
          </Seccion>

          <Seccion titulo="Horarios más frecuentes" detalle="En qué momento del día se juega.">
            <Torta datos={porFranja} />
          </Seccion>

          <p className="mt-2 text-[11px] leading-relaxed text-cream-dim">
            Las reservas se borran 15 días después del turno, así que esto refleja las últimas semanas y no todo el
            historial.
          </p>
        </>
      )}
    </Pagina>
  );
}

function Seccion({
  titulo,
  detalle,
  children,
}: {
  titulo: string;
  detalle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8 rounded-xl border border-cream/10 bg-panel px-4 py-4">
      <h2 className="font-display text-xl leading-none font-bold">{titulo}</h2>
      <p className="mt-1.5 mb-4 text-[12px] text-cream-dim">{detalle}</p>
      {children}
    </section>
  );
}

/** Torta de pocas porciones, con la cantidad y el porcentaje en la leyenda. */
function Torta({ datos }: { datos: { nombre: string; cantidad: number }[] }) {
  const total = datos.reduce((suma, d) => suma + d.cantidad, 0);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={datos}
          dataKey="cantidad"
          nameKey="nombre"
          innerRadius={48}
          outerRadius={88}
          // 2px de aire entre porciones: se leen separadas aunque dos
          // colores queden cerca.
          paddingAngle={2}
          stroke="#16281d"
          strokeWidth={2}
        >
          {datos.map((d, i) => (
            <Cell key={d.nombre} fill={CATEGORICOS[i % CATEGORICOS.length]} />
          ))}
        </Pie>
        <Tooltip {...ESTILO_TOOLTIP} />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          formatter={(valor: string) => {
            const dato = datos.find((d) => d.nombre === valor);
            const porcentaje = dato && total > 0 ? Math.round((dato.cantidad / total) * 100) : 0;
            return (
              <span style={{ color: TEXTO_TENUE, fontSize: 12 }}>
                {valor} · <b style={{ color: TEXTO }}>{dato?.cantidad ?? 0}</b> ({porcentaje}%)
              </span>
            );
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
