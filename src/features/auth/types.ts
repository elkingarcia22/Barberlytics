import { z } from "zod";
import { parseE164 } from "@/components/forms";

export const userRoleSchema = z.enum(["admin", "manager", "member"]);
export type UserRole = z.infer<typeof userRoleSchema>;

/**
 * Celular en E.164 tal como lo emite `PhoneInput`, completo según el país:
 * un celular de Colombia tiene 10 dígitos, uno de Chile 9. Si faltan, el
 * mensaje dice cuántos son.
 */
export const phoneSchema = z
  .string()
  .min(1, "Escribe tu celular")
  .superRefine((value, ctx) => {
    const { country, national } = parseE164(value);
    if (!country || !/^\d+$/.test(national)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ese número no parece válido" });
      return;
    }
    if (national.length < country.length) {
      const missing = country.length - national.length;
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Un celular de ${country.name} tiene ${country.length} dígitos; ${missing === 1 ? "falta 1" : `faltan ${missing}`}`,
      });
    }
  });

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

/** Paso 1: el celular al que se envía el código. */
export const otpRequestSchema = z.object({ phone: phoneSchema });
export type OtpRequest = z.infer<typeof otpRequestSchema>;

export const OTP_LENGTH = 6;

/** Paso 2: el código que llegó por SMS. */
export const otpVerifySchema = z.object({
  phone: phoneSchema,
  code: z.string().length(OTP_LENGTH, `Escribe los ${OTP_LENGTH} dígitos`),
});
export type OtpVerify = z.infer<typeof otpVerifySchema>;

/** Cuentas externas con las que se puede entrar. `microsoft` es «Outlook» en pantalla. */
export const authProviderSchema = z.enum(["google", "microsoft"]);
export type AuthProvider = z.infer<typeof authProviderSchema>;

/** Olvidé mi número: se manda al correo registrado. */
export const recoveryRequestSchema = z.object({
  email: z.string().min(1, "Escribe tu correo").email("Ese correo no parece válido"),
});
export type RecoveryRequest = z.infer<typeof recoveryRequestSchema>;

export type AuthStatus = "loading" | "authenticated" | "anonymous";
