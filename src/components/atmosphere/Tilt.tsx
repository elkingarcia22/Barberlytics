import * as React from "react";

import { useTilt } from "@/hooks/useTilt";
import { cn } from "@/lib/utils";

export interface TiltProps extends React.ComponentProps<"div"> {
  /** Grados máximos de inclinación en cada eje. 2–3 para un panel grande, 6–7 para una card. */
  maxDegrees?: number;
}

/**
 * Perspectiva hacia el puntero: el panel se inclina siguiendo al ratón y
 * vuelve a su sitio al salir. Solo con puntero fino y sin
 * `prefers-reduced-motion`; en táctil es un `div` normal. Envuelve la card o
 * el panel; no lo pongas en algo con su propio `transform`.
 */
export function Tilt({ maxDegrees = 6, className, ...props }: TiltProps) {
  const ref = useTilt<HTMLDivElement>(maxDegrees);
  return <div ref={ref} data-slot="tilt" className={cn("tilt", className)} {...props} />;
}
