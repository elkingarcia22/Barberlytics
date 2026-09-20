/**
 * Configuración de entorno del cliente, leída una sola vez de `import.meta.env`.
 * Centralizarla aquí evita que cada módulo interprete las variables a su manera.
 */
const rawMocks = import.meta.env.VITE_USE_MOCKS;

export const env = Object.freeze({
  apiUrl: (import.meta.env.VITE_API_URL ?? "/api").replace(/\/+$/, ""),
  /** Mocks encendidos: explícitamente con `true`, o en desarrollo salvo que se apaguen con `false`. */
  useMocks: rawMocks === "true" || (import.meta.env.DEV && rawMocks !== "false"),
  isDev: import.meta.env.DEV,
});
