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
    authApi
      .me(controller.signal)
      .then((profile) => {
        setUser(profile);
        setStatus("authenticated");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        // Un 401 ya cerró la sesión desde el puente; cualquier otro fallo
        // (red caída) también nos deja fuera: sin perfil no hay app.
        if (!isApiError(error) || error.code !== "unauthorized") clearSession();
      });
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
