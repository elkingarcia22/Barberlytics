import { cn } from "@/lib/utils";

export type BackdropScope = "page" | "container";

export interface GrainProps {
  /** `page` lo fija al viewport (una vez por página); `container`, al padre `relative`. */
  scope?: BackdropScope;
  className?: string;
}

/**
 * Grano: una textura de ruido sobre el fondo, sin coste de red y sin
 * interceptar el puntero. Es lo que separa un fondo plano de una superficie
 * con material. El contenido que va encima debe ser `relative` para quedar
 * por delante.
 */
export function Grain({ scope = "container", className }: GrainProps) {
  return <div aria-hidden data-slot="grain" data-scope={scope} className={cn("grain", className)} />;
}
