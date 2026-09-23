import { cn } from "@/lib/utils";
import type { BackdropScope } from "./Grain";

export interface VignetteProps {
  /** `page` lo fija al viewport; `container`, al padre `relative`. */
  scope?: BackdropScope;
  className?: string;
}

/**
 * Viñeta: los bordes se hunden y el centro respira. En oscuro es sombra; en
 * claro, un velo del primario. Va una vez, sobre el fondo de la página o de
 * una portada; nunca sobre una card.
 */
export function Vignette({ scope = "container", className }: VignetteProps) {
  return <div aria-hidden data-slot="vignette" data-scope={scope} className={cn("vignette", className)} />;
}
