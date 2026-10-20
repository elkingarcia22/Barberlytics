import * as React from "react";

const TICK_MS = 1000;

/**
 * Una cuenta regresiva en segundos: `start(n)` la arranca (desde un evento, nunca al pintar) y `left` dice
 * cuánto falta. Se usa para reenviar el código y para la espera del bloqueo.
 */
export function useCountdown(initialSeconds = 0): { left: number; start: (seconds: number) => void } {
  const [range, setRange] = React.useState<{ until: number; now: number } | null>(() => {
    if (initialSeconds <= 0) return null;
    const now = Date.now();
    return { until: now + initialSeconds * 1000, now };
  });
  const until = range?.until ?? null;

  React.useEffect(() => {
    if (until === null) return;
    const id = window.setInterval(() => {
      const now = Date.now();
      setRange((current) => (current ? { ...current, now } : current));
      if (now >= until) window.clearInterval(id);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [until]);

  const start = React.useCallback((seconds: number) => {
    const now = Date.now();
    setRange(seconds > 0 ? { until: now + seconds * 1000, now } : null);
  }, []);

  const left = range ? Math.max(0, Math.ceil((range.until - range.now) / 1000)) : 0;
  return { left, start };
}

/** «14:05» o «1:02:03»: lo que falta, para leerlo de un vistazo. */
export function formatCountdown(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = String(seconds % 60).padStart(2, "0");
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}` : `${minutes}:${rest}`;
}
