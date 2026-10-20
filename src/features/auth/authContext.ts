import * as React from "react";
import type { AuthProvider, AuthStatus, AuthUser, OtpRequest, OtpVerify, Session } from "./types";

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  /** Paso 1 de entrar: pide el código por SMS al celular. */
  requestCode: (body: OtpRequest) => Promise<void>;
  /** Paso 2: el código correcto abre la sesión. */
  verifyCode: (body: OtpVerify) => Promise<AuthUser>;
  /** Entra con una cuenta de Google u Outlook vinculada. */
  loginWithProvider: (provider: AuthProvider) => Promise<AuthUser>;
  /** Abre una sesión que llegó por otra vía (el registro, el desbloqueo por correo). */
  startSession: (session: Session) => AuthUser;
  logout: () => Promise<void>;
  /** Vuelve a pedir el perfil (p. ej. tras editarlo). */
  refresh: () => Promise<void>;
}

export const AuthContext = React.createContext<AuthContextValue | null>(null);
