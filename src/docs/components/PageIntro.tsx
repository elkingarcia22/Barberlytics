import type * as React from "react";

/**
 * Cabecera y secciones de una página de la doc. Son tipografía y ritmo
 * vertical, no superficies: aquí no hay `div` que repinte un componente del
 * sistema, solo la escala de espaciado semántica (`space-y-stack`).
 */
export function PageIntro({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="space-y-stack">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
      <h1 className="text-3xl font-bold tracking-tight text-text-primary">{title}</h1>
      <p className="max-w-2xl text-[15px] leading-relaxed text-text-secondary">{description}</p>
      {children}
    </header>
  );
}

export function DocSection({ id, title, description, children }: { id: string; title: string; description?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 id={id} className="scroll-mt-24 text-lg font-semibold tracking-tight text-text-primary">
          {title}
        </h2>
        {description && <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-text-secondary">{description}</p>}
      </div>
      {children}
    </section>
  );
}
