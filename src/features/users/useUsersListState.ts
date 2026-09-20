import * as React from "react";
import { useSearchParams } from "react-router";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { DEFAULT_PAGE_SIZE } from "@/lib/api/pagination";
import { userStatusSchema, type UsersListParams, type UserStatus } from "./types";

/**
 * El estado del listado vive en la URL (búsqueda, estado, orden, página):
 * copiar el enlace reproduce la misma vista y el botón "atrás" funciona.
 * La búsqueda se escribe al instante pero se consulta con retraso.
 */
export function useUsersListState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const statusParam = searchParams.get("status") ?? "";
  const status: UserStatus | "" = userStatusSchema.safeParse(statusParam).success ? (statusParam as UserStatus) : "";
  const sort = searchParams.get("sort") ?? "name";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
  const debouncedSearch = useDebouncedValue(search, 300);

  const set = React.useCallback(
    (patch: Record<string, string | number | undefined>) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(patch)) {
            if (value === undefined || value === "" || value === 1 && key === "page") next.delete(key);
            else next.set(key, String(value));
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const params: UsersListParams = { search: debouncedSearch, status, sort, page, pageSize: DEFAULT_PAGE_SIZE };

  return {
    search,
    status,
    sort,
    page,
    params,
    setSearch: (value: string) => set({ search: value, page: undefined }),
    setStatus: (value: string) => set({ status: value === "all" ? undefined : value, page: undefined }),
    setSort: (value: string) => set({ sort: value }),
    setPage: (value: number) => set({ page: value }),
  };
}
