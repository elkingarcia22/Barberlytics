import * as React from "react";

import { cn } from "@/lib/utils";

export interface EnterProps extends React.ComponentProps<"div"> {
  /** Retardo del escalonado, en milisegundos. */
  delay?: number;
}

/**
 * Entrada de los bloques de portada. A diferencia de `Reveal`, no espera a
 * un IntersectionObserver: la animación es de CSS y su estado final es
 * visible, así que el contenido sobre el pliegue se pinta siempre, llegue o
 * no el JavaScript.
 */
export function Enter({ delay = 0, className, style, children, ...props }: EnterProps) {
  return (
    <div
      data-slot="enter"
      className={cn("enter", className)}
      style={delay ? { ...style, animationDelay: `${delay}ms` } : style}
      {...props}
    >
      {children}
    </div>
  );
}
