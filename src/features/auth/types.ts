import { z } from "zod";

export const userRoleSchema = z.enum(["admin", "manager", "member"]);
export type UserRole = z.infer<typeof userRoleSchema>;

/** Celular en E.164: «+» y de 8 a 15 dígitos, tal como lo emite `PhoneInput`. */
export const phoneSchema = z.string().min(1, "Escribe tu celular").regex(/^\+\d{8,15}$/, "Ese número no parece completo");

export const authUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string().email(),
  role: userRoleSchema,
  avatarUrl: z.string().url().optional().nullable(),
});
export type AuthUser = z.infer<typeof authUserSchema>;

export const sessionSchema = z.object({
  accessToken: z.string().min(1),
  user: authUserSchema,
});
export type Session = z.infer<typeof sessionSchema>;

export const credentialsSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
export type Credentials = z.infer<typeof credentialsSchema>;

/** Cuentas externas con las que se puede entrar. `microsoft` es «Outlook» en pantalla. */
export const authProviderSchema = z.enum(["google", "microsoft"]);
export type AuthProvider = z.infer<typeof authProviderSchema>;

export const recoveryRequestSchema = z.object({ phone: phoneSchema });
export type RecoveryRequest = z.infer<typeof recoveryRequestSchema>;

export const RECOVERY_CODE_LENGTH = 6;

export const recoveryVerifySchema = z.object({
  phone: phoneSchema,
  code: z.string().length(RECOVERY_CODE_LENGTH, `Escribe los ${RECOVERY_CODE_LENGTH} dígitos`),
});
export type RecoveryVerify = z.infer<typeof recoveryVerifySchema>;

export const resetTicketSchema = z.object({ resetToken: z.string().min(1) });
export type ResetTicket = z.infer<typeof resetTicketSchema>;

export const newPasswordSchema = z
  .object({
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, { path: ["confirm"], message: "Las contraseñas no coinciden" });
export type NewPassword = z.infer<typeof newPasswordSchema>;

export type AuthStatus = "loading" | "authenticated" | "anonymous";
