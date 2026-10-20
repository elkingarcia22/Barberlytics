import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiAuth, isApiError } from "@/lib/api";
import { clearServerSession, obtainStaffSession } from "@/lib/api/serverSession";
import { authApi } from "./api";
import { requestProviderCredential } from "./providers";
import { sessionTokenStorage, type TokenStorage } from "./tokenStorage";
import type { AuthProvider as AuthProviderName, AuthStatus, AuthUser, OtpRequest, OtpVerify } from "./types";
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
    clearServerSession();
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

  const openSession = React.useCallback(
    (session: { accessToken: string; user: AuthUser }) => {
      storage.set(session.accessToken);
      setUser(session.user);
      setStatus("authenticated");
      return session.user;
    },
    [storage]
  );

  const requestCode = React.useCallback((body: OtpRequest) => authApi.requestCode(body), []);

  const verifyCode = React.useCallback(
    async (body: OtpVerify) => {
      const user = openSession(await authApi.verifyCode(body));
      // La sesión firmada de las funciones pagas (voz, Clipper, narración, WhatsApp): con el mismo
      // celular y código. No se espera: si no llega, esas funciones responden su respaldo.
      void obtainStaffSession({ phone: body.phone, code: body.code });
      return user;
    },
    [openSession]
  );

  const loginWithProvider = React.useCallback(
    async (provider: AuthProviderName) => {
      const credential = await requestProviderCredential(provider);
      return openSession(await authApi.loginWithProvider(provider, credential));
    },
    [openSession]
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

  const value = React.useMemo<AuthContextValue>(() => ({ status, user, requestCode, verifyCode, loginWithProvider, startSession: openSession, logout, refresh }),
    [status, user, requestCode, verifyCode, loginWithProvider, openSession, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
