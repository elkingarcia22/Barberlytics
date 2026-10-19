import { api } from "@/lib/api";

/**
 * Confirmar la identidad antes de algo sensible (docs/API_CONTRACT.md, «Auth»): un código nuevo al celular
 * de la cuenta da un permiso de 5 minutos que el cliente de la API manda en `X-Step-Up`. Vive solo en la
 * memoria de la pestaña: se pierde al recargar y al cerrar sesión.
 */

let current: { token: string; expiresAt: number } | null = null;

export const stepUpToken = (now = Date.now()): string | null => (current && current.expiresAt > now ? current.token : null);
export const clearStepUp = (): void => {
  current = null;
};

export const stepUpApi = {
  request: () => api.post<{ phoneHint: string }>("/auth/step-up/request"),
  verify: async (code: string) => {
    const result = await api.post<{ token: string; expiresAt: string }>("/auth/step-up/verify", { code });
    current = { token: result.token, expiresAt: new Date(result.expiresAt).getTime() };
    return result;
  },
};
