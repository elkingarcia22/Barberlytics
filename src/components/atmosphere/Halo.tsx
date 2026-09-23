import * as React from "react";

import { cn } from "@/lib/utils";

export interface HaloProps {
  /** Centro horizontal del resplandor (longitud o porcentaje CSS). */
  x?: string;
  /** Centro vertical del resplandor. */
  y?: string;
  /** Tamaño de la elipse, «ancho alto». */
  size?: string;
  /** Opacidad del primario en el centro. */
  strength?: number;
  className?: string;
}

/**
 * Halo: un resplandor del primario en un punto del contenedor `relative`,
 * que se funde en el fondo. Dos halos (uno arriba a la izquierda, otro al
 * fondo) son la atmósfera de una landing; uno detrás de un titular es su
 * luz. Solo pinta un gradiente: no cuesta scroll.
 */
export function Halo({ x = "50%", y = "22%", size = "52rem 28rem", strength = 0.18, className }: HaloProps) {
  return (
    <div
      aria-hidden
      data-slot="halo"
      className={cn("halo", className)}
      style={{ "--halo-x": x, "--halo-y": y, "--halo-size": size, "--halo-alpha": strength } as React.CSSProperties}
    />
  );
}
