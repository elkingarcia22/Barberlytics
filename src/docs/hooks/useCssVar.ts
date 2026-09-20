import * as React from "react";
import { useTheme } from "@/themes";

/**
 * Lee el valor resuelto de una variable CSS en `<html>` y lo vuelve a leer
 * cada vez que cambia el tema, para que las páginas de tokens muestren
 * siempre el valor vivo y no el de la hoja de estilos.
 */
export function useCssVar(name: string): string {
  const { tokens, resolvedMode } = useTheme();
  return React.useMemo(() => {
    void tokens;
    void resolvedMode;
    if (typeof window === "undefined") return "";
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }, [name, tokens, resolvedMode]);
}

/** Igual que `useCssVar` pero para varias variables a la vez. */
export function useCssVars(names: readonly string[]): Record<string, string> {
  const { tokens, resolvedMode } = useTheme();
  return React.useMemo(() => {
    void tokens;
    void resolvedMode;
    if (typeof window === "undefined") return {};
    const css = getComputedStyle(document.documentElement);
    return Object.fromEntries(names.map((name) => [name, css.getPropertyValue(name).trim()]));
  }, [names, tokens, resolvedMode]);
}
