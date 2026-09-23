import * as React from "react";

import { cn } from "@/lib/utils";

type FoilTag = "span" | "em" | "strong";

export interface FoilProps extends React.HTMLAttributes<HTMLElement> {
  /** Etiqueta en línea; `em` para la palabra enfática de un titular. */
  as?: FoilTag;
}

/**
 * Lámina dorada: la palabra de marca con un barrido de luz cada siete
 * segundos. El oro es `--color-brand`, así que en un tema azul la lámina es
 * azul. Una palabra o dos por pantalla; la luz pierde sentido si se repite.
 */
export function Foil({ as = "span", className, ...props }: FoilProps) {
  const Comp = as as React.ElementType;
  return <Comp data-slot="foil" className={cn("foil", className)} {...props} />;
}
