import { api } from "@/lib/api";
import {
  authUserSchema,
  resetTicketSchema,
  sessionSchema,
  type AuthProvider,
  type AuthUser,
  type Credentials,
  type RecoveryRequest,
  type RecoveryVerify,
  type ResetTicket,
  type Session,
} from "./types";

export const authApi = {
  login: (credentials: Credentials) => api.post<Session>("/auth/login", credentials, { schema: sessionSchema }),
  /** `credential` es lo que entregó el SDK del proveedor en el navegador (ver `providers.ts`). */
  loginWithProvider: (provider: AuthProvider, credential: string) =>
    api.post<Session>("/auth/oauth", { provider, credential }, { schema: sessionSchema }),
  me: (signal?: AbortSignal) => api.get<AuthUser>("/auth/me", { schema: authUserSchema, signal }),
  logout: () => api.post<void>("/auth/logout"),
  recovery: {
    request: (body: RecoveryRequest) => api.post<void>("/auth/recovery/request", body),
    verify: (body: RecoveryVerify) => api.post<ResetTicket>("/auth/recovery/verify", body, { schema: resetTicketSchema }),
    reset: (body: ResetTicket & { password: string }) => api.post<void>("/auth/recovery/reset", body),
  },
};
