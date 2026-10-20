/**
 * Con qué dispositivo se entra: un id que guarda este navegador y cómo se ve («Chrome en macOS»). Va al
 * entrar con el código; el servidor avisa a la cuenta cuando es uno nuevo. No es una huella del equipo:
 * borrar los datos del sitio lo vuelve «nuevo», y eso está bien (avisa de más, no de menos).
 */

const KEY = "thema.deviceId";

const BROWSERS: readonly [RegExp, string][] = [
  [/Edg\//, "Edge"],
  [/OPR\//, "Opera"],
  [/Chrome\//, "Chrome"],
  [/Firefox\//, "Firefox"],
  [/Safari\//, "Safari"],
];
const SYSTEMS: readonly [RegExp, string][] = [
  [/iPhone|iPad/, "iOS"],
  [/Android/, "Android"],
  [/Mac OS X/, "macOS"],
  [/Windows/, "Windows"],
  [/Linux/, "Linux"],
];

/** «Chrome en macOS», a partir del agente del navegador. */
export function deviceLabel(userAgent: string): string {
  const browser = BROWSERS.find(([pattern]) => pattern.test(userAgent))?.[1] ?? "Navegador";
  const system = SYSTEMS.find(([pattern]) => pattern.test(userAgent))?.[1];
  return system ? `${browser} · ${system}` : browser;
}

/** El id de este navegador (se crea la primera vez); sin almacenamiento, `null` y no se avisa. */
export function deviceInfo(): { id: string; label: string } | null {
  try {
    let id = window.localStorage.getItem(KEY);
    if (!id) {
      id = `dev-${crypto.randomUUID()}`;
      window.localStorage.setItem(KEY, id);
    }
    return { id, label: deviceLabel(navigator.userAgent) };
  } catch {
    return null;
  }
}
