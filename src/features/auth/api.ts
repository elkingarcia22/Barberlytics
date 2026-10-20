import { api } from "@/lib/api";
import { legalVersion } from "@/features/legal/documents";
import { deviceInfo } from "./device";
import {
  authUserSchema,
  backupEmailSchema,
  sessionSchema,
  signupResultSchema,
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
  type SignupResult,
  type SupportTicketRequest,
  type SupportTicketResponse,
} from "./types";

export const authApi = {
  /** Envía el código por SMS (o al correo de respaldo con `channel: "email"`); no abre sesión. */
  requestCode: (body: OtpRequest) => api.post<void>("/auth/otp/request", body),
  /** El código correcto abre la sesión. Va con el dispositivo: si es nuevo, el servidor avisa a la cuenta. */
  verifyCode: (body: OtpVerify) => api.post<Session>("/auth/otp/verify", { ...body, device: deviceInfo() }, { schema: sessionSchema }),
  /** «No fui yo»: cierra todas las sesiones de la cuenta menos esta. */
  revokeOtherSessions: () => api.post<{ closed: number }>("/auth/sessions/revoke-others"),
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
  /** Con la versión de cada documento que se aceptó: términos, privacidad y acuerdo de encargo. */
  /** Crea la cuenta y la barbería con el paquete del país, y entra: devuelve la sesión y lo que quedó listo. */
  signup: (body: SignupRequest) =>
    api.post<SignupResult>("/auth/signup", { ...body, termsVersion: legalVersion("terms"), privacyVersion: legalVersion("privacy"), dpaVersion: legalVersion("dpa"), device: deviceInfo() }, { schema: signupResultSchema }),
  /** Manda el código al celular del registro, para verificarlo antes de crear la cuenta. */
  signupCode: (phone: string) => api.post<void>("/auth/signup/code", { phone }),
  /** Bloqueado: manda un código al correo de respaldo de la cuenta de ese número (204 siempre). */
  unlockRequest: (phone: string) => api.post<void>("/auth/unlock/request", { phone }),
  /** El código del correo levanta el bloqueo y abre la sesión. */
  unlockVerify: (body: OtpVerify) => api.post<Session>("/auth/unlock/verify", { ...body, device: deviceInfo() }, { schema: sessionSchema }),
  /** Sin sesión: se abre desde el login (no llegó el correo, acceso bloqueado). */
  createTicket: (body: SupportTicketRequest) =>
    api.post<SupportTicketResponse>("/support/tickets", body, { schema: supportTicketResponseSchema }),
};
