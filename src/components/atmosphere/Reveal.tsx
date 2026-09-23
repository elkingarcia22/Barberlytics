import * as React from "react";

import { useReveal } from "@/hooks/useReveal";
import { cn } from "@/lib/utils";

type RevealTag = "div" | "li" | "article" | "section";

export interface RevealProps extends React.HTMLAttributes<HTMLElement> {
  /** Retardo escalonado en milisegundos para listas y rejillas. */
  delay?: number;
  /** Etiqueta a renderizar; `li` dentro de una lista para no romper el marcado. */
  as?: RevealTag;
}

/**
 * Envoltorio que aparece al entrar en pantalla: 14px de ascenso y opacidad,
 * una sola vez. Para lo que está bajo el pliegue; lo que está sobre él usa
 * `Enter`, que no espera a ningún observador.
 */
export function Reveal({ delay = 0, as = "div", className, style, children, ...props }: RevealProps) {
  const ref = useReveal<HTMLElement>();
  const Comp = as as React.ElementType;

  return (
    <Comp
      ref={ref}
      data-slot="reveal"
      className={cn("reveal", className)}
      style={delay ? { ...style, transitionDelay: `${delay}ms` } : style}
      {...props}
    >
      {children}
    </Comp>
  );
}
