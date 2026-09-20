/**
 * Dónde vive el token de acceso en el navegador.
 *
 * `sessionStorage` por defecto: sobrevive a recargas pero muere al cerrar la
 * pestaña, y no viaja entre pestañas. Si el backend emite cookies httpOnly
 * (la opción más segura), cambia esta implementación por una que no guarde
 * nada y deja que `credentials: "include"` haga el trabajo.
 */
export interface TokenStorage {
  get(): string | null;
  set(token: string): void;
  clear(): void;
}

const KEY = "thema.session.token";

function safeStorage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export const sessionTokenStorage: TokenStorage = {
  get: () => safeStorage()?.getItem(KEY) ?? null,
  set: (token) => safeStorage()?.setItem(KEY, token),
  clear: () => safeStorage()?.removeItem(KEY),
};

/** Para pruebas: un almacenamiento en memoria que no toca el navegador. */
export function createMemoryTokenStorage(initial: string | null = null): TokenStorage {
  let token = initial;
  return {
    get: () => token,
    set: (next) => {
      token = next;
    },
    clear: () => {
      token = null;
    },
  };
}
