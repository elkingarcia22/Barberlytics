import * as React from "react";
import { useTheme } from "@/themes";

/**
 * Remonta a sus hijos cada vez que cambia el preset o el modo del tema de la
 * documentación. `getUbitsChartTheme` lee los tokens con `getComputedStyle`
 * solo al montar el gráfico, y el observer interno de `EChart` reacciona
 * únicamente a la clase `.dark` (y solo refresca color, textStyle y tooltip).
 * Sin este remount, cambiar de preset dejaría el lienzo con los colores
 * anteriores. Es un detalle de la docs: en producción el tema no cambia en
 * caliente y no hace falta.
 */
export function ThemedChart({ children }: { children: React.ReactNode }) {
  const { preset, resolvedMode } = useTheme();
  return <React.Fragment key={`${preset.id}-${resolvedMode}`}>{children}</React.Fragment>;
}
