import type { ReactNode } from 'react';
import { Pagina } from '../components/Pagina';
import { BEELUP_URL, INSTAGRAM_USUARIO, WHATSAPP_NUMERO, instagramUrl, whatsappUrl } from '../lib/contacto';

/** Contacto y redes + Beelup (spec 00, reglas 13 y 14). Sin backend propio. */
export function ContactoPage() {
  return (
    <Pagina titulo="Contacto y redes" subtitulo="Para cancelar o coordinar la seña, escribinos." ancho="max-w-md">
      <div className="grid gap-2.5">
        <Tarjeta
          icono="💬"
          titulo="WhatsApp"
          detalle={WHATSAPP_NUMERO ? `+${WHATSAPP_NUMERO}` : 'Número a definir'}
          href={WHATSAPP_NUMERO ? whatsappUrl(WHATSAPP_NUMERO) : null}
        />
        <Tarjeta
          icono="📷"
          titulo="Instagram"
          detalle={INSTAGRAM_USUARIO ? `@${INSTAGRAM_USUARIO}` : 'Cuenta a definir'}
          href={INSTAGRAM_USUARIO ? instagramUrl(INSTAGRAM_USUARIO) : null}
        />
        <Tarjeta icono="📹" titulo="Beelup" detalle="Cámaras en vivo del predio" href={BEELUP_URL} />
      </div>
    </Pagina>
  );
}

function Tarjeta({ icono, titulo, detalle, href }: { icono: string; titulo: string; detalle: string; href: string | null }) {
  const contenido: ReactNode = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-turf-light text-lg" aria-hidden="true">
        {icono}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{titulo}</span>
        <span className="block text-[13px] text-cream-dim">{detalle}</span>
      </span>
      {href && <span className="text-orange" aria-hidden="true">↗</span>}
    </>
  );
  const clases = 'flex items-center gap-3.5 rounded-xl border border-cream/10 bg-panel px-4 py-3.5';

  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${clases} hover:border-cream/25`}>
      {contenido}
    </a>
  ) : (
    <div className={`${clases} opacity-60`}>{contenido}</div>
  );
}
