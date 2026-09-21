import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiAuth, isApiError } from "@/lib/api";
import { authApi } from "./api";
import { sessionTokenStorage, type TokenStorage } from "./tokenStorage";
import type { AuthStatus, AuthUser, Credentials } from "./types";
import { AuthContext, type AuthContextValue } from "./authContext";

export interface AuthProviderProps {
  children: React.ReactNode;
  storage?: TokenStorage;
}

/**
 * Sesión de la aplicación. Al montar, si hay token pide `/auth/me`; si el
 * token ya no vale, lo descarta. Conecta el cliente HTTP para que adjunte el
 * token y para que un 401 en cualquier petición cierre la sesión.
 */
export function AuthProvider({ children, storage = sessionTokenStorage }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = React.useState<AuthStatus>(() => (storage.get() ? "loading" : "anonymous"));
  const [user, setUser] = React.useState<AuthUser | null>(null);

  const clearSession = React.useCallback(() => {
    storage.clear();
    setUser(null);
    setStatus("anonymous");
    queryClient.clear();
  }, [storage, queryClient]);

  // El puente con el cliente HTTP se configura antes de cualquier petición.
  React.useLayoutEffect(() => {
    apiAuth.getToken = () => storage.get();
    apiAuth.onUnauthorized = clearSession;
    return () => {
      apiAuth.getToken = () => null;
      apiAuth.onUnauthorized = undefined;
    };
  }, [storage, clearSession]);

  React.useEffect(() => {
    if (!storage.get()) return;
    const controller = new AbortController();

    /*
     * Recuperar la sesión al cargar reintenta antes de rendirse.
     *
     * Solo un 401 significa "este token ya no vale": ahí se cierra y punto.
     * Un fallo de red o una respuesta que no cuadra son transitorios —una
     * recarga con el service worker aún tomando el control los produce— y
     * echar a la persona por eso es perder su sesión por un parpadeo.
     */
    const RETRY_DELAYS_MS = [180, 600];

    const attempt = (tries: number): void => {
      authApi
        .me(controller.signal)
        .then((profile) => {
          if (controller.signal.aborted) return;
          setUser(profile);
          setStatus("authenticated");
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          if (isApiError(error) && error.code === "unauthorized") return; // el puente ya cerró
          const delay = RETRY_DELAYS_MS[tries];
          if (delay === undefined) {
            clearSession();
            return;
          }
          window.setTimeout(() => {
            if (!controller.signal.aborted) attempt(tries + 1);
          }, delay);
        });
    };

    attempt(0);
    return () => controller.abort();
  }, [storage, clearSession]);

  const login = React.useCallback(
    async (credentials: Credentials) => {
      const session = await authApi.login(credentials);
      storage.set(session.accessToken);
      setUser(session.user);
      setStatus("authenticated");
      return session.user;
    },
    [storage]
  );

  const logout = React.useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* cerrar sesión debe funcionar aunque el servidor no responda */
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const refresh = React.useCallback(async () => {
    const profile = await authApi.me();
    setUser(profile);
  }, []);

  const value = React.useMemo<AuthContextValue>(() => ({ status, user, login, logout, refresh }), [status, user, login, logout, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
