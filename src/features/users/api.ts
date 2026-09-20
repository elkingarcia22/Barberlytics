import { api } from "@/lib/api";
import { DEFAULT_PAGE_SIZE } from "@/lib/api/pagination";
import { userSchema, usersPageSchema, type User, type UserInput, type UsersListParams, type UsersPage } from "./types";

/** Contrato de personas; ver docs/API_CONTRACT.md. */
export const usersApi = {
  list: (params: UsersListParams, signal?: AbortSignal) =>
    api.get<UsersPage>("/users", {
      query: { ...params, page: params.page ?? 1, pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE },
      schema: usersPageSchema,
      signal,
    }),
  get: (id: string, signal?: AbortSignal) => api.get<User>(`/users/${id}`, { schema: userSchema, signal }),
  create: (input: UserInput) => api.post<User>("/users", input, { schema: userSchema }),
  update: (id: string, input: Partial<UserInput>) => api.patch<User>(`/users/${id}`, input, { schema: userSchema }),
  remove: (id: string) => api.delete<void>(`/users/${id}`),
};
