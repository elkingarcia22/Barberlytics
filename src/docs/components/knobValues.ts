import type { ControlValue, DocControl } from "../registry/types";

/** Valores iniciales de un playground: el `default` de cada control. */
export function defaultValues(controls: Record<string, DocControl>): Record<string, ControlValue> {
  return Object.fromEntries(Object.entries(controls).map(([key, control]) => [key, control.default]));
}
