import { api } from "@/lib/api";
import type { NoteInput } from "@/features/calendar/types";
import { customerDetailSchema, customersResponseSchema, type CustomerDetail, type CustomerInput, type CustomersResponse, type GuestInput } from "./types";

/** Contrato de clientes; ver docs/API_CONTRACT.md. */
export const customersApi = {
  list: (signal?: AbortSignal) => api.get<CustomersResponse>("/customers", { schema: customersResponseSchema, signal }),
  get: (id: string, signal?: AbortSignal) => api.get<CustomerDetail>(`/customers/${id}`, { schema: customerDetailSchema, signal }),
  create: (input: CustomerInput, branchId: string) => api.post<CustomerDetail>("/customers", { ...input, branchId }, { schema: customerDetailSchema }),
  update: (id: string, input: CustomerInput) => api.patch<CustomerDetail>(`/customers/${id}`, input, { schema: customerDetailSchema }),
  /** Borrado lógico: sale del directorio; sus citas y cobros pasados se conservan. */
  remove: (id: string) => api.delete<void>(`/customers/${id}`),
  setBlocked: (id: string, blocked: boolean) => api.patch<CustomerDetail>(`/customers/${id}`, { blocked }, { schema: customerDetailSchema }),
  /** «Reserva y pago solo en línea»: viaja solo, sin la ficha entera. */
  setOnlineOnly: (id: string, onlineOnly: boolean) => api.patch<CustomerDetail>(`/customers/${id}`, { onlineOnly }, { schema: customerDetailSchema }),
  /** La nota es del cliente de la agenda: mismo endpoint que usa la cita. */
  addNote: (id: string, input: NoteInput) => api.post<unknown>(`/clients/${id}/notes`, input),
  addGuest: (id: string, input: GuestInput) => api.post<CustomerDetail>(`/customers/${id}/guests`, input, { schema: customerDetailSchema }),
  removeGuest: (id: string, guestId: string) => api.delete<CustomerDetail>(`/customers/${id}/guests/${guestId}`, { schema: customerDetailSchema }),
};
