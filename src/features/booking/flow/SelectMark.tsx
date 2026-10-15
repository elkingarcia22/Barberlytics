import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";

interface SelectMarkProps {
  /** Círculo si se elige uno (sede, barbero); casilla si se pueden varios (servicios). */
  kind: "radio" | "checkbox";
  checked: boolean;
  /** Cuando el elemento que la contiene se señala (el grupo de la fila), la marca lo sigue. */
  className?: string;
}

/**
 * La marca de elegir, igual en todas las opciones de la reserva —tarjetas y filas de listas—: vacía
 * mientras no se elige y rellena con su check al elegirla. Decorativa: el rol y el estado los lleva
 * el botón que la contiene.
 */
export function SelectMark({ kind, checked, className }: SelectMarkProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-6 shrink-0 items-center justify-center border transition-colors duration-fast",
        kind === "radio" ? "rounded-full" : "rounded-md",
        checked ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background group-hover/row:border-primary/50",
        className
      )}
    >
      {checked && <ThemaIcon name="check" size="xs" tone="inverse" />}
    </span>
  );
}
