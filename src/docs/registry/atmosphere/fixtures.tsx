import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * El escenario de las demos de atmósfera: un contenedor `relative` con el
 * color de fondo de la app, que recorta lo que se sale. Las piezas de esta
 * familia se colocan en absoluto dentro de él, como harían en una portada.
 */
export function Stage({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("relative w-full overflow-hidden rounded-2xl border border-border/60 bg-background", className)}>
      {children}
    </div>
  );
}

/** El vocabulario del oficio que usa la landing en su ticker. */
export const TRADE_WORDS = [
  "Fade",
  "Taper",
  "Navaja",
  "Barba",
  "Agenda",
  "Cierre de caja",
  "Comisiones",
  "Retención",
  "Ficha del cliente",
  "IA que aprende",
  "Cohorte 01",
  "Beta privada",
] as const;
