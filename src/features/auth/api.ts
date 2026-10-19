import { api } from "@/lib/api";
import {
  authUserSchema,
  backupEmailSchema,
  sessionSchema,
  supportTicketResponseSchema,
  type AuthProvider,
  type AuthUser,
  type BackupEmail,
  type BackupEmailRequest,
  type BackupEmailVerify,
  type OtpRequest,
  type OtpVerify,
  type RecoveryRequest,
  type Session,
  type SignupRequest,
  type SupportTicketRequest,
  type SupportTicketResponse,
} from "./types";

export const authApi = {
  /** Envía el código por SMS (o al correo de respaldo con `channel: "email"`); no abre sesión. */
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
  /** El correo de respaldo de la sesión: por si el SMS no llega al entrar. */
  backupEmail: {
    get: (signal?: AbortSignal) => api.get<BackupEmail>("/auth/backup-email", { schema: backupEmailSchema, signal }),
    /** Manda un código al correo nuevo; todavía no lo activa. */
    request: (body: BackupEmailRequest) => api.post<void>("/auth/backup-email", body),
    /** El código correcto deja el correo activo. */
    verify: (body: BackupEmailVerify) => api.post<BackupEmail>("/auth/backup-email/verify", body, { schema: backupEmailSchema }),
    remove: () => api.delete<void>("/auth/backup-email"),
  },
  signup: (body: SignupRequest) => api.post<void>("/auth/signup", body),
  /** Manda el código al celular del registro, para verificarlo antes de crear la cuenta. */
  signupCode: (phone: string) => api.post<void>("/auth/signup/code", { phone }),
  /** Sin sesión: se abre desde el login (no llegó el correo, acceso bloqueado). */
  createTicket: (body: SupportTicketRequest) =>
    api.post<SupportTicketResponse>("/support/tickets", body, { schema: supportTicketResponseSchema }),
};
