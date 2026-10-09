import { cn } from "@/lib/utils";
import { ClipperOrb } from "./ClipperOrb";

interface AiSparkGlyphProps {
  /** Lado del glifo en píxeles. */
  size?: number;
  className?: string;
}

/**
 * La marca de la IA «trabajando»: el orbe de Clipper pensando (halo vivo, gira rápido).
 *
 * Se conserva con este nombre porque es la misma marca en dos tamaños muy distintos —el panel de
 * "Analizando" a 42 px y el aviso de una tarjeta rehaciéndose a 18—; a tamaños pequeños va sin
 * halo ni anillo para no ensuciar el texto que la acompaña.
 */
export function AiSparkGlyph({ size = 42, className }: AiSparkGlyphProps) {
  return <ClipperOrb size={size} state="thinking" bare={size < 32} className={cn("shrink-0", className)} />;
}
