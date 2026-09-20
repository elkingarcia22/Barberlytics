import { z } from "zod";

export const userRoleSchema = z.enum(["admin", "manager", "member"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const authUserSchema = z.object({
  id: z.string(),
  name: z.string(),
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
  email: z.string().min(1, "Escribe tu correo").email("Ese correo no parece válido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
export type Credentials = z.infer<typeof credentialsSchema>;

export type AuthStatus = "loading" | "authenticated" | "anonymous";
