import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/cn';

type Variante = 'primaria' | 'secundaria' | 'fantasma';

const VARIANTES: Record<Variante, string> = {
  primaria: 'bg-orange text-ink hover:brightness-110',
  secundaria: 'border border-cream/15 bg-cream/5 text-cream hover:bg-cream/10',
  fantasma: 'text-cream-dim hover:text-cream',
};

export function Boton({
  variante = 'primaria',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        'rounded-xl px-4 py-3 font-sans text-[15px] font-semibold transition active:scale-[0.98]',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100',
        VARIANTES[variante],
        className,
      )}
    />
  );
}

export function Campo({
  etiqueta,
  id,
  ayuda,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { etiqueta: string; id: string; ayuda?: string }) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-xs font-medium text-cream-dim">{etiqueta}</span>
      <input
        id={id}
        {...props}
        className="w-full rounded-[10px] border border-cream/12 bg-pitch px-3.5 py-3 text-[15px] text-cream outline-none placeholder:text-cream-dim/50 focus:border-orange"
      />
      {ayuda && <span className="mt-1 block text-[11px] text-cream-dim">{ayuda}</span>}
    </label>
  );
}

export function Aviso({ tipo = 'error', children }: { tipo?: 'error' | 'info'; children: ReactNode }) {
  return (
    <div
      role={tipo === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-[10px] border px-3.5 py-3 text-[13px] leading-relaxed text-cream',
        tipo === 'error' ? 'border-orange/40 bg-orange/10' : 'border-turf-light/35 bg-turf-light/10',
      )}
    >
      {children}
    </div>
  );
}

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <p role="status" className="flex items-center gap-2 text-[13px] text-cream-dim">
      <span className="size-3.5 animate-spin rounded-full border-2 border-cream/20 border-t-orange" />
      {texto}
    </p>
  );
}

export function Insignia({ clases, children }: { clases: string; children: ReactNode }) {
  return (
    <span className={cn('inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap', clases)}>
      {children}
    </span>
  );
}
