import { cn } from "@/lib/utils";

/** Muestra debajo de un picker el valor controlado que guarda el ejemplo. */
export function ValueReadout({ label = "Valor", value, className }: { label?: string; value: string; className?: string }) {
  return (
    <p className={cn("text-xs text-text-muted", className)}>
      {label}:{" "}
      <code className="rounded bg-surface-subtle px-1.5 py-0.5 font-mono text-[11px] text-text-primary">{value || "—"}</code>
    </p>
  );
}

/** Marco con espacio para que el popover del calendario no quede recortado. */
export const PICKER_FRAME = "min-h-[380px] items-start pt-8";

/** Marco más alto para pickers de dos meses. */
export const WIDE_PICKER_FRAME = "min-h-[460px] items-start pt-8";
