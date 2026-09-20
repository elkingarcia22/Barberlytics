import { z } from "zod";
import { paginatedSchema } from "@/lib/api/pagination";

export const userStatusSchema = z.enum(["active", "invited", "inactive"]);
export type UserStatus = z.infer<typeof userStatusSchema>;

export const userRoleSchema = z.enum(["admin", "manager", "member"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  area: z.string(),
  role: userRoleSchema,
  status: userStatusSchema,
  createdAt: z.string(),
  lastActiveAt: z.string().nullable(),
  avatarUrl: z.string().nullable(),
});
export type User = z.infer<typeof userSchema>;

export const usersPageSchema = paginatedSchema(userSchema);
export type UsersPage = z.infer<typeof usersPageSchema>;

/** Lo que el formulario captura y el backend valida. */
export const userInputSchema = z.object({
  name: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres"),
  email: z.string().trim().min(1, "Escribe el correo").email("Ese correo no parece válido"),
  area: z.string().trim().min(1, "El área es obligatoria"),
  role: userRoleSchema,
  status: userStatusSchema,
});
export type UserInput = z.infer<typeof userInputSchema>;

export interface UsersListParams {
  search?: string;
  status?: UserStatus | "";
  sort?: string;
  page?: number;
  pageSize?: number;
}

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: "Activa",
  invited: "Invitada",
  inactive: "Inactiva",
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  manager: "Líder",
  member: "Colaborador",
};

export const AREAS = ["Producto", "Ingeniería", "Ventas", "Personas", "Marketing", "Finanzas", "Operaciones", "Soporte"] as const;
