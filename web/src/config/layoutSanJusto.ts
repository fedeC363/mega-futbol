/**
 * Distribucion de las canchas en el predio de San Justo.
 *
 * Las coordenadas van en un lienzo fijo de 1000 x 700 unidades, que el
 * mapa escala al ancho disponible. Mover una cancha es cambiar un
 * numero acá: el componente no sabe nada de posiciones.
 *
 * `w` y `h` definen ademas la orientacion del dibujo: si la cancha es
 * mas ancha que alta, los arcos van a los costados; si no, arriba y
 * abajo.
 *
 * `numero` es el numero real de la cancha, el mismo que tiene en la
 * base. El tipo (F5 a F8) NO sale de acá sino de la capacidad cargada
 * en la base: se repite al lado de cada linea solo para que se entienda
 * que es cada cosa al editar las coordenadas.
 *
 * Cuando haya una segunda sede, va a tener su propio archivo igual a
 * este.
 */

export interface PosicionCancha {
  numero: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ZonaPredio {
  etiqueta: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const LIENZO = { ancho: 1000, alto: 700 } as const;

export const CANCHAS_SAN_JUSTO: PosicionCancha[] = [
  // Fila 1 — futbol 8, apaisadas
  { numero: 19, x: 20, y: 20, w: 200, h: 130 },
  { numero: 18, x: 265, y: 20, w: 200, h: 130 },
  { numero: 17, x: 510, y: 20, w: 200, h: 130 },
  { numero: 16, x: 755, y: 20, w: 200, h: 130 },

  // Fila 2 — futbol 7, verticales
  { numero: 6, x: 20, y: 200, w: 95, h: 170 },
  { numero: 5, x: 150, y: 200, w: 95, h: 170 },
  { numero: 4, x: 280, y: 200, w: 95, h: 170 },
  { numero: 3, x: 410, y: 200, w: 95, h: 170 },
  { numero: 2, x: 540, y: 200, w: 95, h: 170 },
  { numero: 1, x: 670, y: 200, w: 95, h: 170 },

  // Fila 3 — futbol 6 verticales, y futbol 5 verticales mas chicas
  { numero: 15, x: 20, y: 410, w: 95, h: 140 },
  { numero: 14, x: 150, y: 410, w: 95, h: 140 },
  { numero: 13, x: 280, y: 410, w: 95, h: 140 },
  { numero: 12, x: 410, y: 410, w: 95, h: 140 },
  { numero: 9, x: 545, y: 420, w: 75, h: 120 },
  { numero: 8, x: 650, y: 420, w: 75, h: 120 },
  { numero: 7, x: 755, y: 420, w: 75, h: 120 },

  // Fila 4 — futbol 5, apaisadas
  { numero: 20, x: 20, y: 590, w: 130, h: 85 },
  { numero: 11, x: 180, y: 590, w: 130, h: 85 },
  { numero: 10, x: 340, y: 590, w: 130, h: 85 },
];

export const ZONAS_SAN_JUSTO: ZonaPredio[] = [
  { etiqueta: 'Predio · vestuarios & buffet', x: 810, y: 190, w: 170, h: 210 },
  { etiqueta: 'Estacionamiento', x: 510, y: 580, w: 340, h: 100 },
];
