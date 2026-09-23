import { z } from "zod";
import type { AppMessageKey } from "@/app/i18n/types";
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

/**
 * Estados, roles y áreas son enumeraciones: el backend manda el código y la
 * interfaz decide cómo se lee. Por eso aquí van **claves**, no texto: así la
 * misma fila se lee "Activa" o "Active" según el idioma, sin que el backend
 * tenga que saber nada de idiomas.
 */
export const USER_STATUS_KEYS: Record<UserStatus, AppMessageKey> = {
  active: "userStatus.active",
  invited: "userStatus.invited",
  inactive: "userStatus.inactive",
};

export const USER_ROLE_KEYS: Record<UserRole, AppMessageKey> = {
  admin: "userRole.admin",
  manager: "userRole.manager",
  member: "userRole.member",
};

/** El código de cada área y la clave con la que se lee. */
export const AREA_KEYS = {
  Producto: "area.product",
  Ingeniería: "area.engineering",
  Ventas: "area.sales",
  Personas: "area.people",
  Marketing: "area.marketing",
  Finanzas: "area.finance",
  Operaciones: "area.operations",
  Soporte: "area.support",
} as const satisfies Record<string, AppMessageKey>;

export const AREAS = Object.keys(AREA_KEYS) as readonly (keyof typeof AREA_KEYS)[];

/** La clave de un área; si el backend manda una nueva, se lee tal cual. */
export function areaKey(area: string): AppMessageKey | undefined {
  return (AREA_KEYS as Record<string, AppMessageKey>)[area];
}
