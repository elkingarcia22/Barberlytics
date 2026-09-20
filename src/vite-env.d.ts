/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base de la API, p. ej. `https://api.empresa.com/v1`. Por defecto `/api`. */
  readonly VITE_API_URL?: string;
  /** `"true"` fuerza el backend simulado (MSW); `"false"` lo apaga incluso en desarrollo. */
  readonly VITE_USE_MOCKS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
