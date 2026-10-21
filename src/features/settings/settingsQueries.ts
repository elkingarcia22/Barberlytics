import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingKeys } from "@/features/booking/queries";
import type { ZodType } from "zod";
import { settingsApi } from "./settingsApi";
import type { SettingsListId, SettingsSectionId } from "./settingsTypes";

export const settingsKeys = {
  all: ["settings"] as const,
  section: (id: SettingsSectionId) => [...settingsKeys.all, "section", id] as const,
  list: (id: SettingsListId) => [...settingsKeys.all, "list", id] as const,
};

/** Un ajuste que es un solo documento. */
export function useSettingsSection<T>(id: SettingsSectionId, schema: ZodType<T>) {
  return useQuery({ queryKey: settingsKeys.section(id), queryFn: ({ signal }) => settingsApi.section(id, schema, signal) });
}

export function useSaveSettingsSection<T>(id: SettingsSectionId, schema: ZodType<T>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => settingsApi.saveSection(id, schema, body),
    onSuccess: (saved) => {
      queryClient.setQueryData(settingsKeys.section(id), saved);
      // La reserva en línea se arma con varias secciones (reglas, cobros, propinas, apariencia):
      // tiene que volver a pedirse para que «Ver la reserva» muestre lo recién guardado.
      void queryClient.invalidateQueries({ queryKey: bookingKeys.shop() });
    },
  });
}

/** Un ajuste que es una lista. Toda mutación devuelve la lista ya actualizada. */
export function useSettingsList<T>(id: SettingsListId, schema: ZodType<T>) {
  return useQuery({ queryKey: settingsKeys.list(id), queryFn: ({ signal }) => settingsApi.list(id, schema, signal) });
}

export function useSettingsListMutations<T>(id: SettingsListId, schema: ZodType<T>) {
  const queryClient = useQueryClient();
  const store = (data: { items: T[] }) => queryClient.setQueryData(settingsKeys.list(id), data);
  const save = useMutation({ mutationFn: ({ itemId, body }: { itemId: string | null; body: unknown }) => (itemId ? settingsApi.updateItem(id, schema, itemId, body) : settingsApi.createItem(id, schema, body)), onSuccess: store });
  const remove = useMutation({ mutationFn: (itemId: string) => settingsApi.removeItem(id, schema, itemId), onSuccess: store });
  return { save, remove };
}
