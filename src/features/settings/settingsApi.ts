import type { ZodType } from "zod";
import { z } from "zod";
import { api } from "@/lib/api";
import type { GatewayProvider } from "./gatewayProviders";
import { paymentsTestSchema, type SettingsListId, type SettingsSectionId } from "./settingsTypes";

/** Contrato de configuración; ver docs/API_CONTRACT.md. */
export const settingsApi = {
  section: <T,>(id: SettingsSectionId, schema: ZodType<T>, signal?: AbortSignal) => api.get<T>(`/settings/${id}`, { schema, signal }),
  saveSection: <T,>(id: SettingsSectionId, schema: ZodType<T>, body: unknown) => api.put<T>(`/settings/${id}`, body, { schema }),
  list: <T,>(id: SettingsListId, schema: ZodType<T>, signal?: AbortSignal) => api.get<{ items: T[] }>(`/settings/lists/${id}`, { schema: z.object({ items: z.array(schema) }), signal }),
  createItem: <T,>(id: SettingsListId, schema: ZodType<T>, body: unknown) => api.post<{ items: T[] }>(`/settings/lists/${id}`, body, { schema: z.object({ items: z.array(schema) }) }),
  updateItem: <T,>(id: SettingsListId, schema: ZodType<T>, itemId: string, body: unknown) => api.patch<{ items: T[] }>(`/settings/lists/${id}/${itemId}`, body, { schema: z.object({ items: z.array(schema) }) }),
  removeItem: <T,>(id: SettingsListId, schema: ZodType<T>, itemId: string) => api.delete<{ items: T[] }>(`/settings/lists/${id}/${itemId}`, { schema: z.object({ items: z.array(schema) }) }),
  testGateway: (body: { provider: GatewayProvider; publicKey: string; secretKey: string }) => api.post<z.infer<typeof paymentsTestSchema>>("/settings/gateways/test", body, { schema: paymentsTestSchema }),
  deleteAccount: (confirmation: string) => api.post<void>("/account/delete", { confirmation }),
};
