import * as React from "react";
import { AuthContext, type AuthContextValue } from "./AuthProvider";

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return context;
}

/** El usuario autenticado; lanza si se usa fuera de una ruta protegida. */
export function useCurrentUser() {
  const { user } = useAuth();
  if (!user) throw new Error("useCurrentUser requiere una sesión activa (envuelve la ruta con RequireAuth)");
  return user;
}
