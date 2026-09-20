import { api } from "@/lib/api";
import { authUserSchema, sessionSchema, type AuthUser, type Credentials, type Session } from "./types";

/** Contrato de autenticación; ver docs/API_CONTRACT.md. */
export const authApi = {
  login: (credentials: Credentials) => api.post<Session>("/auth/login", credentials, { schema: sessionSchema }),
  me: (signal?: AbortSignal) => api.get<AuthUser>("/auth/me", { schema: authUserSchema, signal }),
  logout: () => api.post<void>("/auth/logout"),
};
