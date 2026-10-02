import { api } from "@/lib/api";
import {
  authUserSchema,
  sessionSchema,
  supportTicketResponseSchema,
  type AuthProvider,
  type AuthUser,
  type OtpRequest,
  type OtpVerify,
  type RecoveryRequest,
  type Session,
  type SignupRequest,
  type SupportTicketRequest,
  type SupportTicketResponse,
} from "./types";

export const authApi = {
  /** Envía el código por SMS; no abre sesión. */
  requestCode: (body: OtpRequest) => api.post<void>("/auth/otp/request", body),
  /** El código correcto abre la sesión. */
  verifyCode: (body: OtpVerify) => api.post<Session>("/auth/otp/verify", body, { schema: sessionSchema }),
  /** `credential` es lo que entregó el SDK del proveedor en el navegador (ver `providers.ts`). */
  loginWithProvider: (provider: AuthProvider, credential: string) =>
    api.post<Session>("/auth/oauth", { provider, credential }, { schema: sessionSchema }),
  me: (signal?: AbortSignal) => api.get<AuthUser>("/auth/me", { schema: authUserSchema, signal }),
  logout: () => api.post<void>("/auth/logout"),
  recovery: {
    /** Manda el celular registrado al correo. */
    request: (body: RecoveryRequest) => api.post<void>("/auth/recovery/request", body),
  },
  signup: (body: SignupRequest) => api.post<void>("/auth/signup", body),
  /** Sin sesión: se abre desde el login (no llegó el correo, acceso bloqueado). */
  createTicket: (body: SupportTicketRequest) =>
    api.post<SupportTicketResponse>("/support/tickets", body, { schema: supportTicketResponseSchema }),
};
