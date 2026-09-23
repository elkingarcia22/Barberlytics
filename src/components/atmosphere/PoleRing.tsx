import * as React from "react";

import { cn } from "@/lib/utils";

export interface PoleRingProps {
  /** Diámetro del anillo; número en px o cualquier longitud CSS. */
  size?: number | string;
  /** Opacidad del conjunto; el anillo ya es tenue de por sí. */
  opacity?: number;
  /** Clases del contenedor (posición dentro del padre `relative`). */
  className?: string;
}

/**
 * La rueda: el poste visto desde arriba, ticks radiales del primario girando
 * muy despacio (una vuelta cada 80 s) detrás de un panel o un titular. Va
 * centrado en su padre `relative`; el giro pisa cualquier otro transform, así
 * que el centrado vive en este contenedor y el anillo gira dentro.
 */
export function PoleRing({ size = "56rem", opacity = 0.6, className }: PoleRingProps) {
  const side = typeof size === "number" ? `${size}px` : size;
  return (
    <div
      aria-hidden
      data-slot="pole-ring"
      className={cn("pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2", className)}
      style={{ width: side, height: side, opacity } as React.CSSProperties}
    >
      <div className="pole-ring size-full" />
    </div>
  );
}
