import * as React from "react";

import { cn } from "@/lib/utils";

export interface MarqueeProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** Las palabras del ticker. Se duplican para que el bucle no tenga costura. */
  items: readonly string[];
  /** Segundos que tarda una vuelta completa. */
  duration?: number;
}

/**
 * Ticker de vocabulario en bucle: los extremos se funden con el fondo y se
 * pausa al pasar el puntero. Es decorativo (`aria-hidden`): lo que diga tiene
 * que estar también en el contenido. Con `prefers-reduced-motion` se vuelve
 * una lista fija que envuelve.
 */
export function Marquee({ items, duration = 48, className, style, ...props }: MarqueeProps) {
  const track = [...items, ...items];

  return (
    <div
      aria-hidden
      data-slot="marquee"
      className={cn("marquee border-y border-border/50 py-4", className)}
      style={{ ...style, "--marquee-duration": `${duration}s` } as React.CSSProperties}
      {...props}
    >
      <div className="marquee-track gap-8 pr-8">
        {track.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="flex items-center gap-8 font-heading text-lg font-medium tracking-tight text-text-secondary"
          >
            {item}
            <span className="size-1.5 rotate-45 bg-primary" />
          </span>
        ))}
      </div>
    </div>
  );
}
