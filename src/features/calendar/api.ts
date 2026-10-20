import { z } from "zod";
import { api } from "@/lib/api";
import {
  appointmentSchema,
  calendarDaySchema,
  calendarMonthSchema,
  calendarRangeSchema,
  catalogSchema,
  clientSchema,
  saleSchema,
  timeBlockSchema,
  waitlistEntrySchema,
  waitlistSchema,
  type Appointment,
  type AppointmentInput,
  type AppointmentPatch,
  type ClientRestriction,
  type RefundItem,
  type BlockInput,
  type CalendarCatalog,
  type CalendarDay,
  type CalendarMonth,
  type CalendarRange,
  type CheckoutInput,
  type Client,
  type NoteInput,
  type Sale,
  type SaleInput,
  type TimeBlock,
  type DayRhythm,
  dayRhythmSchema,
  type WaitlistEntry,
  type WaitlistInput,
} from "./types";

/** Contrato del calendario; ver docs/API_CONTRACT.md. */
export const calendarApi = {
  catalog: (branchId: string, signal?: AbortSignal) =>
    api.get<CalendarCatalog>("/calendar/catalog", { query: { branchId }, schema: catalogSchema, signal }),
  day: (branchId: string, date: string, signal?: AbortSignal) =>
    api.get<CalendarDay>("/calendar/day", { query: { branchId, date }, schema: calendarDaySchema, signal }),
  range: (branchId: string, from: string, to: string, signal?: AbortSignal) =>
    api.get<CalendarRange>("/calendar/appointments", { query: { branchId, from, to }, schema: calendarRangeSchema, signal }),
  month: (branchId: string, month: string, barberId: string | null, signal?: AbortSignal) =>
    api.get<CalendarMonth>("/calendar/month", { query: { branchId, month, barberId }, schema: calendarMonthSchema, signal }),
  /** Cuántas citas suele tener cada día de la semana (las últimas semanas): día suave o pesado. */
  rhythm: (branchId: string, signal?: AbortSignal) => api.get<DayRhythm>("/calendar/rhythm", { query: { branchId }, schema: dayRhythmSchema, signal }),
  /** `branchId`: la sede donde se crea (la de la cabecera); el servidor la usa si el barbero trabaja en ella. */
  createAppointment: (input: AppointmentInput, branchId?: string) => api.post<Appointment>("/appointments", { ...input, branchId }, { schema: appointmentSchema }),
  /** El saldo de una tarjeta de regalo, para pagar con ella en la caja. */
  checkGiftCard: (code: string) => api.post<{ code: string; balance: number }>(`/booking/gift-cards/check`, { code }, { schema: z.object({ code: z.string(), balance: z.number() }) }),
  /** Devolver (todo o en parte) una cuenta cobrada; los productos devueltos vuelven al inventario. */
  refund: (id: string, input: { amount: number; reason: string; to: "cash" | "card"; items?: RefundItem[] }) => api.post<Appointment>(`/appointments/${id}/refund`, input, { schema: appointmentSchema }),
  /** Borrar una venta hecha por error: la cita vuelve a «en silla» sin pago (dueño y administrador). */
  voidPayment: (id: string, reason: string) => api.post<Appointment>(`/appointments/${id}/void-payment`, { reason }, { schema: appointmentSchema }),
  /** Restringir al cliente desde la agenda (bloquearlo o pedirle pago en línea): va a su ficha. */
  restrictClient: (clientId: string, patch: ClientRestriction) => api.patch<unknown>(`/customers/${clientId}`, patch),
  updateAppointment: (id: string, patch: AppointmentPatch) => api.patch<Appointment>(`/appointments/${id}`, patch, { schema: appointmentSchema }),
  checkout: (id: string, input: CheckoutInput) => api.post<Appointment>(`/appointments/${id}/checkout`, input, { schema: appointmentSchema }),
  /** Cobrar varias citas de una visita de una vez: o se cobran todas o ninguna. */
  checkoutVisit: (items: { id: string; input: CheckoutInput }[]) => api.post<{ items: Appointment[] }>("/visits/checkout", { items }, { schema: z.object({ items: z.array(appointmentSchema) }) }),
  addClientNote: (clientId: string, input: NoteInput) => api.post<Client>(`/clients/${clientId}/notes`, input, { schema: clientSchema }),
  updateClientNote: (clientId: string, noteId: string, input: Partial<NoteInput>) => api.patch<Client>(`/clients/${clientId}/notes/${noteId}`, input, { schema: clientSchema }),
  removeClientNote: (clientId: string, noteId: string) => api.delete<Client>(`/clients/${clientId}/notes/${noteId}`, { schema: clientSchema }),
  createBlock: (input: BlockInput) => api.post<TimeBlock>("/blocks", input, { schema: timeBlockSchema }),
  removeBlock: (id: string) => api.delete<void>(`/blocks/${id}`),
  updateBlock: (id: string, input: BlockInput) => api.patch<TimeBlock>(`/blocks/${id}`, input, { schema: timeBlockSchema }),
  /** Todos los bloqueos de la sucursal (con su repetición), para la lista de ausencias y bloqueos. */
  blocks: (branchId: string, signal?: AbortSignal) => api.get<{ items: TimeBlock[] }>("/calendar/blocks", { query: { branchId }, schema: z.object({ items: z.array(timeBlockSchema) }), signal }),
  /** Aprobar un bloqueo que puso un barbero (con la aprobación encendida en Configuración). */
  approveBlock: (id: string) => api.post<TimeBlock>(`/blocks/${id}/approve`, {}, { schema: timeBlockSchema }),
  waitlist: (branchId: string, date: string | null, signal?: AbortSignal) =>
    api.get<{ items: WaitlistEntry[] }>("/waitlist", { query: { branchId, date }, schema: waitlistSchema, signal }),
  addToWaitlist: (input: WaitlistInput) => api.post<WaitlistEntry>("/waitlist", input, { schema: waitlistEntrySchema }),
  removeFromWaitlist: (id: string) => api.delete<void>(`/waitlist/${id}`),
  createSale: (input: SaleInput) => api.post<Sale>("/sales", input, { schema: saleSchema }),
};
