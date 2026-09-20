import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { describeError } from "@/lib/api";
import { usersApi } from "./api";
import type { User, UserInput, UsersListParams, UsersPage } from "./types";

/**
 * Claves de caché jerárquicas: invalidar `lists()` refresca todos los
 * listados sin tocar los detalles, y `detail(id)` es la fuente de una
 * pantalla de persona.
 */
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params: UsersListParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

export function useUsersQuery(params: UsersListParams) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: ({ signal }) => usersApi.list(params, signal),
    // Al cambiar de página se conserva la anterior en pantalla mientras llega la nueva.
    placeholderData: keepPreviousData,
  });
}

export function useUserQuery(id: string | null) {
  return useQuery({
    queryKey: userKeys.detail(id ?? ""),
    queryFn: ({ signal }) => usersApi.get(id as string, signal),
    enabled: Boolean(id),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UserInput) => usersApi.create(input),
    onSuccess: (user) => {
      queryClient.setQueryData(userKeys.detail(user.id), user);
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success("Persona creada", { description: `${user.name} ya aparece en la lista.` });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<UserInput> }) => usersApi.update(id, input),
    // Optimista: la fila cambia al instante y se revierte si el servidor dice que no.
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: userKeys.lists() });
      const previous = queryClient.getQueriesData<UsersPage>({ queryKey: userKeys.lists() });
      queryClient.setQueriesData<UsersPage>({ queryKey: userKeys.lists() }, (page) =>
        page ? { ...page, items: page.items.map((item) => (item.id === id ? { ...item, ...input } : item)) } : page
      );
      return { previous };
    },
    onError: (error, _variables, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      const { title, description } = describeError(error);
      toast.error(title, { description });
    },
    onSuccess: (user) => {
      queryClient.setQueryData(userKeys.detail(user.id), user);
      toast.success("Cambios guardados");
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: userKeys.lists() }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (user: User) => usersApi.remove(user.id),
    onSuccess: (_result, user) => {
      queryClient.removeQueries({ queryKey: userKeys.detail(user.id) });
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success("Persona eliminada", { description: user.name });
    },
    onError: (error) => {
      const { title, description } = describeError(error);
      toast.error(title, { description });
    },
  });
}
