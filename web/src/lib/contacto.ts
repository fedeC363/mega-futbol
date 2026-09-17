export const BEELUP_URL = 'https://beelup.com/ar';

/** Numero en formato internacional sin '+' (54 9 = Argentina, movil). */
export const WHATSAPP_NUMERO: string | null = '5491139379019';
/** Usuario de Instagram sin '@'. */
export const INSTAGRAM_USUARIO: string | null = 'megafutbol_sanjusto';

/**
 * Alias donde el usuario transfiere la seña mientras no haya Mercado
 * Pago (Fase 2). Se muestra al crear la reserva. Para cambiarlo alcanza
 * con editar esta linea; si mas adelante tiene que poder cambiarse sin
 * tocar codigo, el lugar natural es una columna en la tabla sede.
 */
export const ALIAS_TRANSFERENCIA = 'fedecuda';

export const whatsappUrl = (numero: string) => `https://wa.me/${numero}`;
export const instagramUrl = (usuario: string) => `https://instagram.com/${usuario}`;
