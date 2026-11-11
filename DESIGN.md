---
name: Mega Fútbol
description: Reservas de canchas sobre el mapa del predio, de noche y con un solo acento naranja.
colors:
  night: "#08110c"
  pitch: "#0e1b14"
  pitch-2: "#142a1e"
  panel: "#16281d"
  predio: "#122219"
  turf: "#1f6e43"
  turf-light: "#2c8a56"
  turf-text: "#52b07c"
  occupied: "#3a473f"
  mostaza: "#9c7a1f"
  ladrillo: "#7a2a20"
  orange: "#f2622e"
  ink: "#1a0c05"
  cream: "#f3ede1"
  cream-dim: "#9fb3a6"
typography:
  display:
    fontFamily: "Barlow Condensed, ui-sans-serif, system-ui, sans-serif"
    fontSize: "52px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "1px"
  headline:
    fontFamily: "Barlow Condensed, ui-sans-serif, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1
  title:
    fontFamily: "Work Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
  body:
    fontFamily: "Work Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Work Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    letterSpacing: "1.2px"
rounded:
  badge: "8px"
  field: "10px"
  card: "12px"
  sheet: "16px"
  pill: "9999px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "14px"
  lg: "16px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "12px 16px"
    typography: "{typography.title}"
  button-secondary:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.cream}"
    rounded: "{rounded.card}"
    padding: "12px 16px"
  button-fantasma:
    textColor: "{colors.cream-dim}"
    rounded: "{rounded.card}"
    padding: "12px 16px"
  button-burbuja:
    textColor: "{colors.cream-dim}"
    rounded: "{rounded.pill}"
    padding: "12px 16px"
  campo:
    backgroundColor: "{colors.pitch}"
    textColor: "{colors.cream}"
    rounded: "{rounded.field}"
    padding: "12px 14px"
  tarjeta:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.cream}"
    rounded: "{rounded.card}"
    padding: "14px 16px"
  dia-activo:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "6px 12px"
  dia:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.cream-dim}"
    rounded: "{rounded.field}"
    padding: "6px 12px"
  cancha-badge:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.ink}"
    rounded: "{rounded.badge}"
    padding: "7px 10px 6px"
---

# Design System: Mega Fútbol

## Overview

**Creative North Star: "Cancha de noche"**

El predio con las luces prendidas. Toda la interfaz vive sobre verdes casi negros (`pitch`, `night`) que funcionan como la oscuridad alrededor de las canchas. Lo que importa se ilumina: las canchas libres en verde césped, y el naranja aparece solo donde hay que actuar, como un reflector. La página principal es el mapa del predio visto desde arriba; cada cancha se dibuja con sus líneas reales (perímetro, mitad, áreas, círculo central) y su color dice cuánto está ocupada ese día.

Los componentes son táctiles y deportivos: responden al tocarlos. La cancha se hunde y vuelve al pasar el mouse, los botones se achican apenas al presionarlos y el menú en celular se abre en abanico desde un botón naranja. La densidad es media: el panel de staff y admin usa el mismo lenguaje que la parte del jugador, con tarjetas oscuras y tipografía chica, para que se lea rápido en el día a día.

Es un tema oscuro único; no hay modo claro. La interfaz está en castellano rioplatense.

**Key Characteristics:**
- Fondo verde noche en capas tonales, sin blancos de fondo.
- Un solo acento de acción: `orange`. Nada de rojo.
- Titulares condensados en mayúsculas (Barlow Condensed) sobre cuerpo Work Sans chico.
- El mapa del predio es la pieza central y la que define el carácter.
- Respuesta física al toque: press, pulso y despliegue, siempre respetando `prefers-reduced-motion`.

## Colors

Una noche verde con un único reflector naranja y una escala de ocupación tomada del propio césped.

### Primary
- **orange**: el acento único de acción. Botón primario, día elegido, foco de campos, badge de las canchas libres, botón flotante del menú y texto de error. Sobre él siempre va `ink`, nunca blanco.
- **ink**: el texto oscuro y cálido que va sobre naranja (y sobre `cream` en los badges de las canchas con ocupación media y alta).

### Secondary
- **turf**: la cancha disponible con poca ocupación (hasta 30%).
- **turf-light**: el verde "positivo" como relleno: fondos tenues de lo confirmado, el punto de "Abierto ahora", avisos informativos y el círculo de los íconos del menú en celular y de contacto.
- **turf-text**: el mismo verde aclarado para usarlo como texto (pasa 4.5:1 sobre `panel` y `pitch-2`). Estado confirmado, "Abierto ahora", "Reserva creada" y mensajes de guardado.

### Tertiary
Escala de ocupación del mapa, de menos a más pedida:
- **mostaza**: cancha con ocupación media (30 a 70%).
- **ladrillo**: cancha casi llena (más del 70%).
- **occupied**: cancha completa, sin turnos libres; se muestra apagada y no se puede tocar.

### Neutral
- **night**: lo más oscuro, detrás de la app en escritorio.
- **pitch**: fondo principal y fondo de los campos de texto.
- **pitch-2**: header y menú lateral, apenas más claros que el fondo.
- **panel**: tarjetas, paneles, chips y días sin elegir.
- **predio**: el terreno detrás de las canchas en el mapa.
- **cream**: texto principal. Con opacidad baja (5–15%) arma bordes y fondos sutiles.
- **cream-dim**: texto secundario, etiquetas y estados neutros.

### Named Rules
**The One Reflector Rule.** `orange` es el único color de acción. Si algo naranja no se puede tocar ni indica error o pendiente, sobra.

**The No-Red Rule.** No existe un rojo de error. Los errores y lo pendiente usan `orange`; `ladrillo` solo significa "cancha casi llena" en el mapa.

**The Contrast-Swap Rule.** El badge de la cancha es naranja sobre `turf`, pero `cream` sobre `mostaza` y `ladrillo`, porque el naranja se pierde contra fondos cálidos.

## Typography

**Display Font:** Barlow Condensed (con ui-sans-serif, system-ui)
**Body Font:** Work Sans (con ui-sans-serif, system-ui)

**Character:** Una condensada de camiseta y tablero de resultados para los números y titulares, junto a una sans de lectura tranquila para todo lo demás. Se cargan desde Google Fonts con los pesos 500/600/700 (Barlow) y 400/500/600 (Work Sans).

### Hierarchy
- **Display**: el logo "MEGA FÚTBOL" del header, en mayúsculas (40px en celular).
- **Headline**: el título de cada pantalla.
- **Title**: botones y texto destacado dentro de tarjetas.
- **Body**: el texto corriente, mensajes y descripciones (se usa entre 13 y 15px).
- **Label**: las etiquetas de filtros y secciones, en mayúsculas con tracking; con tracking de 3px, para "SEDE SAN JUSTO" bajo el logo.
- **Números**: los números de cancha (17px) y de día (18px) van en Barlow Condensed bold, como dorsales.

### Named Rules
**The Dorsal Rule.** Todo número que identifica algo (cancha, día) va en Barlow Condensed bold; los precios y textos corridos van en Work Sans.

## Layout

- **Celular (menos de 768px):** una sola columna que scrollea, con header fijo arriba y un botón flotante naranja abajo a la izquierda que despliega el menú hacia arriba. Las páginas dejan 112px de aire abajo para no quedar tapadas por ese botón.
- **Escritorio (768px o más):** menú lateral fijo de 220px, siempre visible con etiquetas, y columna principal a pantalla completa con su propio scroll. El header pasa a tres columnas para que el logo quede centrado exacto.
- **Contenedores:** el mapa usa un ancho máximo de 896px; las demás pantallas, 672px por defecto.
- **Mapa:** las canchas se ubican de forma absoluta según `src/config/layoutSanJusto.ts`; en pantallas chicas el mapa se desplaza de costado.
- **Ritmo:** espaciados chicos (6–16px) dentro de componentes, 24–32px entre bloques. Verificado en 375, 820, 1024 y 1440px.
- **Filtros del mapa:** etiqueta en una columna fija de 150px y chips a la derecha, así todas las filas arrancan en la misma línea vertical.

## Elevation & Depth

La profundidad viene sobre todo de capas tonales: `night`, luego `pitch`, luego `pitch-2` y `panel`, separadas por bordes de `cream` al 8–15%. Las sombras se reservan para lo que flota o se toca: las canchas del mapa, sus badges y el menú flotante en celular.

### Shadow Vocabulary
- **Cancha en reposo** (`box-shadow: 0 6px 14px rgba(0,0,0,0.35)`): la cancha que se puede tocar, levantada del terreno. Durante el pulso baja a `0 2px 4px rgba(0,0,0,0.3)`.
- **Badge** (`box-shadow: 0 4px 10px rgba(0,0,0,0.25)`): el número de cancha, apoyado sobre el césped.
- **Reflector** (`box-shadow: 0 8px 20px rgba(242,98,46,0.4)`): el botón flotante naranja del menú en celular.
- **Píldora flotante** (sombra grande en negro al 30%): los ítems del menú desplegado en celular.
- **Modal** (sombra extra grande): el modal de términos, sobre la página.

### Named Rules
**The Lift-Means-Touch Rule.** Si algo tiene sombra, se puede tocar o flota sobre la página. Las tarjetas y paneles son planos.

## Shapes

Esquinas suaves y consistentes. Hay cinco niveles de redondeo: `badge` para el número de cancha, `field` para campos, canchas, ítems del menú y días, `card` para botones y tarjetas, `sheet` para el terreno del mapa y el modal de términos, y `pill` para insignias de estado, chips y el botón flotante. Los bordes son de 1px en `cream` con opacidad baja; el campo con error o foco cambia el borde a `orange`. Las canchas dibujan sus líneas con SVG de trazo uniforme; el círculo central es un elemento cuadrado aparte para que nunca se deforme en elipse. Las zonas del predio que no se tocan llevan un rayado diagonal tenue.

## Components

### Buttons
Táctiles: se achican al 98% al presionarlos.
- **Shape:** esquinas `card`, 15px semibold.
- **Primario:** `orange` con texto `ink`; al pasar el mouse brilla un 10% más.
- **Secundario:** borde y fondo `cream` muy tenues, texto `cream`.
- **Fantasma:** solo texto `cream-dim`, que pasa a `cream` al pasar el mouse.
- **Burbuja:** píldora con borde tenue para acciones que acompañan a un control; al pasar el mouse toma un tinte naranja.
- **Deshabilitado:** opacidad 40% y sin el efecto de presión.

### Chips (insignias de estado)
- **Style:** píldora con borde, fondo al 10–15% y texto del color del estado, 11px.
- **Estados:** pendiente de seña en `orange`; confirmada en `turf-text` sobre fondo `turf-light` tenue; cancelada, jugada y no se presentó en `cream-dim` neutro.

### Cards / Containers
- **Corner Style:** `card`.
- **Background:** `panel`, con borde `cream` al 10% (al 25% al pasar el mouse cuando es clickeable).
- **Shadow Strategy:** planas (ver Elevation & Depth).
- **Internal Padding:** 14–16px; los estados vacíos usan 40px vertical y texto centrado.

### Inputs / Fields
- **Style:** fondo `pitch`, borde `cream` al 12%, esquinas `field`, 15px. La etiqueta va arriba en 12px `cream-dim`.
- **Focus:** el borde pasa a `orange`.
- **Error:** borde `orange` y mensaje de 11px en `orange` debajo, con `role="alert"`. La validación es propia, en castellano; nada de mensajes nativos del navegador.

### Navigation
- **Escritorio:** menú lateral de 220px sobre `pitch-2`; ítems de 13.5px con ícono SVG de 20px, en `cream-dim`; el activo y el hover toman fondo `cream` al 6% y texto `cream`.
- **Celular:** botón flotante naranja de 54px con ícono de menú que gira 90° y pasa a "cerrar" al abrir; Escape lo cierra; los ítems salen hacia arriba como píldoras `panel` escalonadas cada 30ms, con el ícono en `ink` dentro de un círculo `turf-light`.
- **Header:** logo centrado en Barlow Condensed ("Fútbol" en naranja) y el indicador de "Abierto ahora" o "Cerrado ahora" como píldora con punto.

- **Botón de términos:** círculo `panel` de 44px abajo a la derecha, en todas las pantallas, con una "i" en Barlow Condensed bold `cream-dim` y sombra de píldora flotante. Del lado opuesto al menú flotante, para no chocar en celular.

### Foco de teclado
Todo control enfocable con teclado muestra un contorno `orange` de 2px separado 2px del borde (regla global en `web/src/index.css`). Los campos de texto mantienen además su borde naranja al enfocarse. La selección de texto usa `orange` al 35% con texto `cream`.

### Íconos
Set propio en `web/src/components/Iconos.tsx`, con motivos de cancha: el calendario con la pelota, la camiseta con el 7 (perfil), la pizarra del DT (staff), el podio con estrella (estadísticas), la cámara con el punto "en vivo" (Beelup). SVG en caja de 24, trazo de 1.75 redondeado y dos tonos: un relleno de `currentColor` al 22% más los detalles llenos, sin sumar colores. Nada de emoji ni glifos como íconos; las flechas dentro de un texto (← Volver, Ver contacto →) son tipografía y quedan.

### Modal de términos
- Fondo de la página oscurecido (`rgb(4 8 6 / 0.78)`), hoja `panel` con esquinas `sheet`, borde `cream` al 12% y sombra de modal, de hasta 672px de ancho y 86% del alto.
- Header y footer separados del texto por bordes `cream` al 10%; título en Barlow Condensed 24px y texto de 13px en `cream` al 90%, que scrollea solo en el medio.
- **Foco:** el modal se monta fuera de `#root` y deja la app de atrás inerte; Tab y Shift+Tab ciclan entre sus botones sin irse a la barra del navegador, y al cerrar el foco vuelve a donde estaba.
- **Modo aceptar:** no se cierra tocando afuera ni hay botón de rechazar; un único botón primario de ancho completo.
- **Modo lectura:** botón de cerrar "✕" redondo en el header, cierra con Escape o tocando afuera, y el botón de abajo es secundario.

### Gráficos de estadísticas
- Fondo `panel` de tarjeta; grilla y cursor en `cream` al 6–8%; ejes en `cream-dim` de 11px; tooltip `panel` con esquinas `field`.
- **Una sola serie:** un único color (`#d95926`), barras horizontales de 13px con el extremo redondeado y el valor escrito a la derecha.
- **Categorías (tortas):** `#3987e5`, `#d95926`, `#199e70`, `#c98500`, separadas por un trazo `panel` de 2px. Es una paleta propia de los gráficos, validada contra `panel` para contraste y daltonismo; no se usa fuera de ellos.

### Selector de día
Una tira horizontal de 7 días que scrollea sin barra visible. Cada día es una caja `field` con el día de la semana en mayúsculas de 11px y el número en Barlow Condensed. El día elegido se llena de `orange`.

### Cancha del mapa (componente insignia)
- Rectángulo `field` con las líneas de la cancha dibujadas en el color del texto, coloreado según la ocupación (`turf`, `mostaza`, `ladrillo`, `occupied`).
- En el centro, el badge con el número de cancha y el tipo debajo (F5…F8) en 8.5px.
- Al pasar el mouse, un pulso único que la hunde al 94% y la devuelve en 260ms; también se hunde al 94% al presionarla. Sin animación con `prefers-reduced-motion`.
- Completa: opacidad 60%, sin sombra, sin animación y no se puede tocar.
- La etiqueta accesible dice número, modalidad y ocupación.

## Do's and Don'ts

### Do:
- **Do** usar `orange` con texto `ink` para la única acción principal de cada pantalla.
- **Do** separar superficies con capas tonales (`pitch`, luego `pitch-2` o `panel`) y bordes `cream` al 8–15%.
- **Do** escribir los números de cancha y de día en Barlow Condensed bold.
- **Do** cortar toda animación con `prefers-reduced-motion`, como hace el pulso de la cancha.
- **Do** mantener los tokens en `web/src/index.css` (`@theme`) y cambiar la paleta solo ahí.
- **Do** pedirle a Federico el boceto antes de construir una pantalla nueva; el diseño visual lo define él.

### Don't:
- **Don't** usar `turf-light` como color de texto; para texto va `turf-text`.
- **Don't** usar emoji como íconos; van los de `Iconos.tsx`.
- **Don't** usar rojo para errores; los errores van en `orange`.
- **Don't** poner `orange` sobre `mostaza` o `ladrillo`; ahí el badge va en `cream`.
- **Don't** usar texto blanco sobre `orange`; siempre `ink`.
- **Don't** agregar un modo claro ni fondos blancos.
- **Don't** usar mensajes de validación nativos del navegador ni steppers nativos en los campos numéricos.
- **Don't** dar sombra a tarjetas o paneles estáticos; la sombra significa que se puede tocar o que flota.
