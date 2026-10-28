# Mega Futbol ⚽

Plataforma web de reservas de canchas de fútbol para un predio ubicado en San Justo, Buenos Aires. Proyecto de portfolio personal, desarrollado para practicar el diseño y desarrollo de una aplicación full-stack real usando Supabase como backend completo.

**Sitio en vivo:** [https://mega-futbol.vercel.app](https://mega-futbol.vercel.app)

> Nota: este proyecto se construyó con fines de portfolio/aprendizaje. No procesa pagos reales en línea; el cobro de la seña se realiza por transferencia bancaria con confirmación manual del staff.

---

## Stack tecnológico

**Frontend**
- React + TypeScript
- Vite
- Tailwind CSS
- Recharts (gráficos del panel de estadísticas)

**Backend — Supabase (sin servidor propio)**
- PostgreSQL (base de datos gestionada)
- Supabase Auth (registro e inicio de sesión con email y contraseña)
- Row Level Security (RLS) en todas las tablas sensibles
- Funciones de Postgres (RPC, `SECURITY DEFINER`) para la lógica de negocio: disponibilidad de canchas, creación/confirmación/cancelación de reservas, validación de llegada, marcado de inasistencias, suspensión/veto y su levantamiento

**Despliegue**
- Frontend: Vercel
- Backend: proyecto de Supabase en la nube

---

## Funcionalidades principales

### Para usuarios
- Registro e inicio de sesión.
- Mapa de las 20 canchas del predio, con color según nivel de ocupación del día (verde ≤30%, amarillo >30%, rojo >70%, gris = ocupada al 100%).
- 4 tipos de cancha disponibles: fútbol 5, fútbol 6, fútbol 7 y fútbol 8, cada una con su capacidad y precio.
- Reserva de turnos con seña por transferencia bancaria; el turno queda "pendiente de pago" hasta que el staff confirma la recepción del pago.
- Liberación automática del turno si, pasadas 24 horas, ningún miembro del staff confirmó el pago.
- Modal de Términos y Condiciones: se muestra una sola vez a usuarios registrados (la primera vez que ingresan tras su publicación) y en cada visita a quienes no tienen cuenta; disponible en cualquier momento desde un botón flotante con el ícono "i".

### Para staff / administradores
- Panel de administración con control de parámetros del negocio (horario de apertura/cierre, recargo, monto de seña, tope de reservas), con campos de ingreso por teclado en vez de steppers nativos.
- Activación/desactivación de canchas, tanto de forma permanente como por rango de fechas específico (sin afectar al resto de las canchas), incluyendo un botón de activación/desactivación masiva.
- Confirmación manual de pagos recibidos por transferencia.
- Cancelación de reservas (función del staff: la puede hacer cualquier empleado activo de la sede; los usuarios no pueden cancelar sus propios turnos).
- Sistema de amonestaciones por inasistencia (no-show): el staff marca manualmente la inasistencia; al llegar a la 2ª amonestación se avisa al usuario y al staff; al llegar a la 5ª, la cuenta queda suspendida automáticamente por 2 meses; si se acumulan 5 amonestaciones más después de cumplida una suspensión, la cuenta queda vetada de forma permanente. Las cancelaciones no cuentan como inasistencia.
- Sección de perfiles de usuario: listado (con buscador) de todos los usuarios no-admin, con su información de contacto, reservas pendientes y pasadas, estado de amonestaciones, y botón para levantar una suspensión o veto.
- Designación de administradores mediante migración versionada de base de datos (no hay una función para auto-designarse ni un flujo de alta desde la interfaz).
- Pestaña de Estadísticas: ranking de canchas más alquiladas (gráfico de barras horizontales) — muestra solo las canchas que tuvieron al menos una reserva y avisa cuántas quedaron afuera del ranking por no tener reservas —, distribución por tipo de cancha y por horario más frecuente (gráficos de torta).

### Diseño
- Interfaz responsive: menú lateral fijo en escritorio y botón flotante en celular, mapa de canchas con desplazamiento lateral en pantallas chicas, verificado en 375/820/1024/1440px.
- Estados de carga y error consistentes en toda la app, con mensajes en castellano.

---

## Estructura del repositorio

```
mega-futbol/
├── specs/          # Documentos de especificación del proyecto, numerados (00 a 05)
├── web/            # Frontend (React + TypeScript + Vite + Tailwind)
├── supabase/       # Migraciones de base de datos y funciones (RPC / Edge Functions)
├── CLAUDE.md       # Guía de contexto del proyecto para Claude Code
├── .env.example    # Variables de entorno necesarias (sin valores reales)
└── .gitignore
```

---

## Cómo correrlo localmente

1. Cloná el repositorio:
   ```bash
   git clone https://github.com/fedeC363/mega-futbol.git
   cd mega-futbol/web
   ```

2. Instalá las dependencias:
   ```bash
   npm install
   ```

3. Creá un archivo `.env` en `web/` a partir de `.env.example`, con las credenciales de un proyecto de Supabase (propio o el de desarrollo):
   ```
   VITE_SUPABASE_URL=tu_url_de_supabase
   VITE_SUPABASE_ANON_KEY=tu_anon_key
   ```

4. Corré el servidor de desarrollo:
   ```bash
   npm run dev
   ```

---

## Probar las funcionalidades de administrador

Para evaluar el panel de administración sin usar la cuenta personal del autor, hay una cuenta de demostración habilitada con rol admin:

- **Email:** `demo.admin@megafutbol-test.com`
- **Contraseña:** `Demo2026Futbol!`

Como la designación de administradores se hace mediante una migración versionada de la base de datos (no hay una función ni un botón para auto-designarse), esta cuenta demo se dio de alta de la misma forma: primero se registró como usuario normal, y después se agregó una migración que le asigna el rol admin a ese email puntual.

Esta cuenta tiene acceso al panel de administración completo (parámetros del negocio, gestión de canchas, confirmación de pagos, cancelación de reservas, amonestaciones, perfiles de usuario y estadísticas).

---

## Decisiones de arquitectura destacadas

- **Supabase puro, sin servidor propio:** toda la lógica de negocio vive en funciones de Postgres (RPC) y políticas de RLS, en vez de un backend Node/Express intermedio. Esto simplificó el despliegue y el mantenimiento del proyecto.
- **Prevención de doble reserva a nivel de base de datos:** un índice único parcial sobre `(cancha_id, fecha, hora_inicio)` que excluye las reservas canceladas, evita condiciones de carrera aunque dos personas reserven al mismo tiempo.
- **Contador de amonestaciones persistente:** dado que las reservas se eliminan de la base 15 días después del turno, el conteo de inasistencias se guarda en un campo propio del usuario en vez de derivarse contando reservas históricas.
- **Pagos:** se evaluó integrar Mercado Pago (Checkout Pro) para cobros automáticos, pero se decidió mantener el flujo de seña por transferencia con confirmación manual del staff como flujo definitivo de este proyecto, evitando el manejo directo de transacciones de dinero real en un proyecto de portfolio.

---

## Autor

Federico Cuda — [fjcuda@gmail.com](mailto:fjcuda@gmail.com)
