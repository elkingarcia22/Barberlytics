import * as React from "react";
import type { AuthStatus, AuthUser, Credentials } from "./types";

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  login: (credentials: Credentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
  /** Vuelve a pedir el perfil (p. ej. tras editarlo). */
  refresh: () => Promise<void>;
}

export const AuthContext = React.createContext<AuthContextValue | null>(null);
