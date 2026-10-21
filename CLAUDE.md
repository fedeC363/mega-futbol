# Mega Futbol

Sistema de reservas de canchas de fútbol para Mega Futbol (sede San Justo).
Objetivo: que un usuario reserve y pague la seña con la mínima
interacción posible con un empleado.

## Antes de tocar código

Leé, en este orden, los specs de la carpeta `/specs`:

1. `specs/00-vision-y-reglas-de-negocio.txt`
2. `specs/01-modelo-de-datos.txt`
3. `specs/02-supabase-backend.txt`
4. `specs/03-flujo-reserva-y-pagos.txt`
5. `specs/04-panel-staff-y-permisos.txt`
6. `specs/05-dependencias-y-setup.txt`

Esos archivos son la fuente de verdad de las reglas de negocio y de la
arquitectura. Si algo en una tarea puntual contradice a los specs,
avisá antes de seguir en vez de asumir.

## Stack

- Backend: **Supabase** (Postgres administrado + Auth + Row Level
  Security + funciones de Postgres + Edge Functions). No hay servidor
  Node/Express propio: el frontend habla directo con Supabase vía
  `@supabase/supabase-js`. El detalle completo está en
  `specs/02-supabase-backend.txt`.
- Frontend: React, en `/web`.
- Configuración y migraciones de Supabase: en `/supabase`
  (`supabase/migrations`, `supabase/functions`).

## Sobre el frontend / UI

Federico define el diseño visual (colores, layout, mockups de pantallas)
y te los va a ir pasando a medida que estén listos. Vos codeás los
componentes de React siguiendo esos diseños. No inventes layout,
paleta de colores ni estructura de pantallas por tu cuenta: si falta
un mockup para una pantalla, pedilo antes de construirla en vez de
improvisar el diseño.

La identidad de marca ya definida: colores naranja, verde y negro. La
página principal es un mapa minimalista del predio con las canchas.

**Menús chicos de selección** (fecha, hora, filtros de estado, solapas):
el contenedor va **naranja** y las opciones adentro **verdes**. Las
clases están en `web/src/index.css` (`.menu-chico` y `.opcion-menu`):
usalas en cualquier selector nuevo de ese estilo en vez de inventar
colores. Como el naranja pasó a ser el fondo, la opción elegida se
marca con verde más claro, un aro crema y negrita — no alcanza con el
color para distinguirla.

## Reglas de negocio clave (resumen — el detalle está en los specs)

- Seña fija: $15.000 ARS. El usuario la transfiere por fuera del
  sistema y un empleado confirma la reserva a mano desde el panel de
  staff. El pago con Mercado Pago está **en pausa, sin fecha**: es un
  proyecto de portfolio y se decidió no mover dinero real (ver
  `specs/00` y `specs/03`).
- El resto se cobra en efectivo/transferencia en persona — el sistema NO lo gestiona.
- Recargo del 10% en turnos que arrancan a las 19:00 o más tarde.
- Turnos de 1 hora, sin superposición por cancha (constraint a nivel de base de datos).
- Un empleado valida manualmente la llegada/inicio de cada turno.
- Cancelación siempre manual: el usuario contacta al staff, el staff
  devuelve la seña por fuera del sistema y libera la cancha a mano.
- Todos los empleados tienen los mismos permisos (sin jerarquía) por ahora.
- Zona horaria: America/Argentina/Buenos_Aires.
- Beelup (cámaras en vivo) es solo un botón externo a https://beelup.com/ar.

## Sobre la seguridad y la lógica de negocio

No repitas validaciones de negocio en el frontend como si fueran la
fuente de verdad: el precio, el chequeo de turno superpuesto y los
permisos de staff viven en Postgres (RLS + funciones), como está
descripto en `specs/02-supabase-backend.txt`. El frontend solo llama a
esas funciones (`supabase.rpc(...)`) y muestra el resultado.

## Cómo avanzar

Se trabaja fase por fase (el detalle completo de cada fase está en el
roadmap que maneja Federico aparte). No arranques una fase nueva sin
que se haya confirmado que la anterior está lista:

- **Fase 0** — Fundación: repo, `supabase init`, migraciones iniciales (tablas, RLS, funciones básicas).
- **Fase 1** — MVP: login (Supabase Auth), mapa de canchas, disponibilidad, crear reserva, panel de staff básico.
- **Fase 2** — Pagos con Mercado Pago: **en pausa, sin fecha.** No implementar (decisión de alcance, ver `specs/00`).
- **Fase 3** — Reglas de precio y contenido: recargo horario, botones de contacto (WhatsApp/Instagram) y Beelup, identidad visual final.
- **Fase 4** — Escalar: multi-sede real, notificaciones, reportes.

## Comandos

Se trabaja directo contra el proyecto de Supabase en la nube
(`btnfakfcyqccgshpmzrp`), sin Docker. El CLI se usa con `npx`, no se
instala global (Supabase dejó de soportar `npm install -g supabase`).
Detalle completo en `specs/02-supabase-backend.txt`.

```
npx supabase login                                   # una vez por máquina
npx supabase link --project-ref btnfakfcyqccgshpmzrp # una vez; pide la password de la DB
npx supabase migration new <nombre>
npx supabase db push --dry-run                       # ver qué se aplicaría
npx supabase db push                                 # aplicar migraciones a la nube
npx supabase migration list                          # repo vs. nube
```

Una migración ya aplicada con `db push` no se edita: se corrige con una
migración nueva. No usar `db reset` (en la nube borraría datos reales).

Desde la raíz del proyecto, con los atajos del `package.json` de la raíz
(delegan a `/web`; no hace falta `cd`, que en PowerShell además no se
puede encadenar con `&&`):

```
npm run setup                 # una vez: instala las dependencias de /web
npm run dev                   # frontend en http://localhost:5173
npm run typecheck
npm run build
npm run db:push               # aplica migraciones a Supabase
npm run db:list               # compara migraciones del repo con la nube
```

El frontend necesita `web/.env` con `VITE_SUPABASE_URL` y
`VITE_SUPABASE_ANON_KEY` (ver `.env.example`).
