import * as React from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * `true` cuando el sistema pide menos movimiento. Se suscribe al media query,
 * así cambiar la preferencia con la página abierta apaga las animaciones
 * de JavaScript igual que las de CSS.
 */
export function useReducedMotion(): boolean {
  const subscribe = React.useCallback((onChange: () => void) => {
    const media = window.matchMedia(QUERY);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false
  );
}
