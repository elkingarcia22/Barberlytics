import { cn } from "@/lib/utils";
import { ClipperOrb } from "./ClipperOrb";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Marca de procedencia: esto lo escribió la IA.
 *
 * Solo el orbe de Clipper. No es un estado ni una acción —
 * no se puede pulsar y no cambia con la edición: dice de dónde salió el
 * contenido, que es justo lo que alguien revisando la lista más tarde no
 * puede deducir mirando los campos. Va en la línea del rótulo ("SECCIÓN 3",
 * "OBJETIVO 1") y no junto al título, para que se lea como metadato de la
 * tarjeta y no como parte de lo que dice.
 *
 * Sin pastilla ni letra: al lado de un rótulo que ya está en versalitas, un
 * segundo bloque de texto competía con él por la misma línea. El orbe solo
 * es la misma marca que el botón que lo generó, y el tooltip guarda la
 * palabra para quien la necesite.
 */
export function AiGeneratedBadge({ className }: { className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("inline-flex shrink-0 items-center", className)}>
          <ClipperOrb bare size={14} />
          <span className="sr-only">Generado por Clipper</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">Generado por Clipper</TooltipContent>
    </Tooltip>
  );
}
