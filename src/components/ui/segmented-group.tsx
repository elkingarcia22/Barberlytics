import * as React from "react";
import { cn } from "@/lib/utils";

export interface SegmentedGroupOption<T extends string> {
  id: T;
  label: string;
  render?: React.ReactNode;
}

export interface SegmentedGroupProps<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentedGroupOption<T>[];
  className?: string;
}

/**
 * Una fila de opciones excluyentes, todas a la vista: el modo claro/oscuro,
 * el radio, la densidad, el idioma. Es la alternativa corta a una lista
 * vertical cuando las opciones son pocas y caben en una sola línea — cada
 * elección se ve y se toca sin desplegar nada.
 */
export function SegmentedGroup<T extends string>({ label, value, onChange, options, className }: SegmentedGroupProps<T>) {
  return (
    <fieldset className={cn("space-y-2", className)}>
      <legend className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">{label}</legend>
      <div
        role="radiogroup"
        aria-label={label}
        className="grid gap-1 rounded-lg bg-tab-track p-1"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((option) => {
          const active = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.id)}
              className={cn(
                "flex h-8 items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                active ? "bg-surface text-text-primary shadow-card" : "text-text-secondary hover:text-text-primary"
              )}
            >
              {option.render}
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
