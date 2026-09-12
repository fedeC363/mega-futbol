export const BEELUP_URL = 'https://beelup.com/ar';

// PENDIENTE: Federico todavia no paso los datos reales del predio.
// Mientras sean null, la UI los muestra como "a definir" en vez de
// linkear a un numero o cuenta inventada.
/** Numero en formato internacional sin '+', ej. '5491112345678'. */
export const WHATSAPP_NUMERO: string | null = null;
/** Usuario de Instagram sin '@'. */
export const INSTAGRAM_USUARIO: string | null = null;

export const whatsappUrl = (numero: string) => `https://wa.me/${numero}`;
export const instagramUrl = (usuario: string) => `https://instagram.com/${usuario}`;
