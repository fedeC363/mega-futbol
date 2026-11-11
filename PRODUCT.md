# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Jugador (primario):** alguien que quiere alquilar una cancha en el predio de San Justo para un partido. Entra, mira qué canchas están libres, elige fecha y hora, reserva y transfiere la seña sin tener que hablar con un empleado. Puede mirar sin cuenta, pero necesita una para reservar.
- **Staff / admin (secundario, trabajo diario):** empleados del predio que usan el panel para confirmar señas recibidas, validar la llegada, marcar inasistencias, cancelar reservas y, si son admin, configurar canchas, parámetros y sanciones.
- **Evaluador del portfolio (contexto, no usuario):** reclutadores o quien revise el proyecto, usando la cuenta demo de admin. El diseño se piensa primero para el jugador y el staff como si fuera un producto real; el portfolio es el contexto, no el usuario objetivo.

## Product Purpose

Plataforma de reservas de canchas de fútbol para una sede (San Justo) que permite reservar y pagar la seña con la mínima interacción posible con un empleado. Es un proyecto de portfolio personal, full-stack, en vivo en https://mega-futbol.vercel.app. Que funcione bien es esto: un jugador reserva un turno sin ayuda y el staff lo gestiona desde el panel sin fricción.

## Positioning

Reserva directa sobre un mapa del predio: la página principal es un mapa minimalista de las 20 canchas, coloreadas según cuánto están ocupadas en el día. Todas las reglas de negocio (precio, superposición, permisos, sanciones) viven en Postgres, no en el frontend.

## Operating Context

- El jugador transfiere la seña ($15.000 ARS) por fuera del sistema al alias que se muestra; la reserva queda "pendiente de pago" hasta que un empleado la confirma a mano. Si nadie confirma en 24 h, el turno se libera solo.
- El resto del precio se paga en persona el día de juego; el sistema no lo gestiona (como mucho lo muestra como referencia).
- El día del turno, un empleado valida a mano que el equipo llegó y empezó a jugar.
- No hay autocancelación: el jugador contacta al staff (WhatsApp, Instagram, en persona) y el staff cancela y devuelve la seña por fuera.
- Uso en celular y escritorio; verificado en 375/820/1024/1440px.

## Capabilities and Constraints

- Detalle completo y fuente de verdad: `specs/00` a `specs/05` y `CLAUDE.md`.
- 20 canchas, 4 tipos (fútbol 5, 6, 7, 8), cada una con capacidad y precio propios. Turnos de 1 hora; recargo del 10% desde las 19:00. Zona horaria America/Argentina/Buenos_Aires.
- Estados de ocupación del mapa: verde ≤30%, amarillo >30%, rojo >70%, gris = 100% ocupada.
- Sanciones por inasistencia: aviso a las 2, suspensión de 2 meses a las 5, veto permanente si junta 5 más después de una suspensión. Un admin puede levantarlas.
- Términos y condiciones: hay que aceptarlos para usar la plataforma; con sesión se piden una sola vez, sin sesión en cada visita; se pueden releer siempre desde un botón flotante "i".
- Roles: `staff` (operación diaria, sin jerarquía entre ellos) y `admin` (precios, canchas, parámetros, sanciones).
- Pagos con Mercado Pago: **en pausa, sin fecha**. No diseñar flujos de pago en línea.
- Fuera de alcance por ahora: multi-sede real, notificaciones, reportes para el dueño, devoluciones automáticas.
- Beelup (cámaras en vivo) es solo un link externo a https://beelup.com/ar.
- Interfaz en castellano rioplatense, con estados de carga y error consistentes.

## Brand Commitments

- Nombre: Mega Futbol (sede San Justo). Colores de marca ya definidos: **naranja, verde y negro**. La página principal es un mapa minimalista del predio con las canchas.
- **Sin relación con el Mega Futbol real:** el nombre y los colores se usan como caso de estudio. No hay logo oficial ni permiso para usar su marca; no presentar el sitio como el oficial del predio.
- Proceso de diseño (de `CLAUDE.md`): Federico define el diseño visual (colores, layout, mockups). No inventar layout, paleta ni estructura de pantallas; si falta un mockup, pedirlo antes de construir.

## Evidence on Hand

- Sitio en vivo y cuenta demo admin (ver `README.md`).
- Specs: `specs/00`–`05`; spec original e ideas en `../spec.docx` y `../lista de ideas y tareas.docx`.
- Assets: solo `web/public/favicon.svg`. No hay logo, fotos del predio, testimonios, métricas de uso ni clientes reales: no inventarlos.
- Abierto: `web/src/lib/contacto.ts` tiene un WhatsApp y un Instagram (`megafutbol_sanjusto`) que podrían ser del predio real; falta decidir si se reemplazan por datos de ejemplo.

## Product Principles

1. Reservar sin hablar con nadie: cada paso que obliga a contactar al staff es una falla, salvo los que las reglas exigen (cancelación, confirmación de seña).
2. El estado de la reserva siempre es claro: el jugador sabe si su turno está pendiente, confirmado o liberado, y qué tiene que hacer después.
3. El panel de staff es una herramienta de trabajo: rápido de leer y operar en el día a día, sin adornos.
4. La base de datos manda: la interfaz muestra lo que devuelven las funciones de Postgres; no repite reglas de negocio como si fueran la fuente de verdad.
5. Honestidad de portfolio: nada en la interfaz finge pagos reales, afiliación con el predio ni datos que no existen.
