import * as React from "react";
import { useTheme } from "./themeContext";

/**
 * Fuerza un preset mientras la pantalla está montada, sin tocar el que la
 * persona eligió: no se guarda y al desmontar vuelve el suyo. Es lo que usa
 * el login para presentarse siempre con el tema premium.
 */
export function useForcedPreset(id: string) {
  const { setPresetOverride } = useTheme();

  React.useLayoutEffect(() => {
    setPresetOverride(id);
    return () => setPresetOverride(null);
  }, [id, setPresetOverride]);
}
