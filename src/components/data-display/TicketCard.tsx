import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const stubVariants = cva("flex w-20 shrink-0 flex-col items-center justify-center gap-0.5 border-r-2 border-dashed py-4", {
  variants: {
    tone: {
      brand: "border-primary-foreground/40 bg-primary text-primary-foreground",
      neutral: "border-border bg-surface-subtle text-text-primary",
    },
  },
  defaultVariants: { tone: "brand" },
});

/** La muesca lleva el mismo filo que el cuerpo: el borde la rodea y la forma del talón se conserva (en oscuro no hay filo). */
const NOTCH = "absolute left-[4.5rem] size-4 rounded-full border border-border bg-background dark:border-transparent";

export interface TicketCardProps extends Omit<React.ComponentProps<"section">, "children"> {
  /** Lo que va en el talón: un número grande, «Parte 2 de 3». Es decorativo para el lector de pantalla si lo repites en el cuerpo. */
  stub: React.ReactNode;
  /** `brand`: el talón relleno en el color de la marca. `neutral`: gris suave. */
  tone?: "brand" | "neutral";
  /** El cuerpo: el título, lo que sigue y las acciones. */
  children: React.ReactNode;
}

/**
 * Una entrada: a la izquierda el talón —un número, una etiqueta— y, tras una línea de puntos con sus
 * dos muescas, el cuerpo con lo que importa. Sirve para decir «en qué parte vas» sin parecer otra
 * tarjeta más: es la que marca cada parte de una visita en la reserva. En oscuro el cuerpo es grafito;
 * en claro, una superficie blanca con filo (el gris suave se confundía con el fondo).
 */
export function TicketCard({ stub, tone = "brand", className, children, ...props }: TicketCardProps) {
  return (
    <section data-slot="ticket-card" className={cn("relative isolate flex overflow-hidden rounded-2xl border border-border bg-surface shadow-sm dark:border-transparent dark:bg-surface-muted", className)} {...props}>
      <div data-slot="ticket-stub" className={stubVariants({ tone })} aria-hidden>
        {stub}
      </div>
      <span aria-hidden className={cn(NOTCH, "-top-2")} />
      <span aria-hidden className={cn(NOTCH, "-bottom-2")} />
      <div data-slot="ticket-body" className="flex min-w-0 flex-1 flex-col gap-2.5 p-3.5">
        {children}
      </div>
    </section>
  );
}
