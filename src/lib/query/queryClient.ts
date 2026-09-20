import { QueryClient } from "@tanstack/react-query";
import { isApiError } from "@/lib/api";

/**
 * Política global de caché y reintentos. Los errores del cliente (4xx) no se
 * reintentan: repetir un 403 no lo convierte en 200. Los de red y servidor
 * sí, dos veces, con espera creciente.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (isApiError(error) && error.status >= 400 && error.status < 500) return false;
          return failureCount < 2;
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export const queryClient = createQueryClient();
