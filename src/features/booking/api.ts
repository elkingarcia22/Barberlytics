import { z } from "zod";
import { api } from "@/lib/api";
import {
  availabilitySchema,
  bookedAppointmentSchema,
  bookingCatalogSchema,
  bookingCustomerSchema,
  bookingShopSchema,
  cancelResultSchema,
  lookupSchema,
  myAppointmentsSchema,
  otpVerifySchema,
  receiptSentSchema,
  reservationSchema,
  type Availability,
  type BookedAppointment,
  type BookingCatalog,
  type BookingCustomer,
  type BookingShop,
  type CancelResult,
  type LookupResult,
  type MyAppointments,
  type NewCustomerInput,
  type OtpVerify,
  type ReceiptSent,
  type RescheduleInput,
  type Reservation,
  type ReservationInput,
} from "./types";
import type { Promo } from "./pricing";

const promoSchema = z.object({ code: z.string(), type: z.enum(["percent", "amount"]), value: z.number(), firstVisitOnly: z.boolean().optional(), minAppointments: z.number().optional() });
const otpSentSchema = z.object({ sentTo: z.string() });

const session = (token: string) => ({ "x-booking-token": token });

/** Contrato de la reserva en línea; ver docs/API_CONTRACT.md. */
export const bookingApi = {
  shop: (signal?: AbortSignal) => api.get<BookingShop>("/booking/shop", { schema: bookingShopSchema, signal }),
  catalog: (branchId: string, signal?: AbortSignal) => api.get<BookingCatalog>("/booking/catalog", { query: { branchId }, schema: bookingCatalogSchema, signal }),
  availability: (params: { branchId: string; date: string; serviceIds: readonly string[]; barberId: string | null; exclude?: string }, signal?: AbortSignal) =>
    api.get<Availability>("/booking/availability", {
      query: { branchId: params.branchId, date: params.date, serviceIds: params.serviceIds.join(","), barberId: params.barberId, exclude: params.exclude },
      schema: availabilitySchema,
      signal,
    }),
  lookup: (phone: string) => api.post<LookupResult>("/booking/lookup", { phone }, { schema: lookupSchema }),
  createCustomer: (input: NewCustomerInput) => api.post<BookingCustomer>("/booking/customers", input, { schema: bookingCustomerSchema }),
  checkPromo: (input: { code: string; customerId: string | null; appointments: number }) => api.post<Promo>("/booking/promo", input, { schema: promoSchema }),
  reserve: (input: ReservationInput) => api.post<Reservation>("/booking/reservations", input, { schema: reservationSchema, timeoutMs: 30_000 }),
  requestOtp: (phone: string) => api.post<{ sentTo: string }>("/booking/otp/request", { phone }, { schema: otpSentSchema }),
  verifyOtp: (phone: string, code: string) => api.post<OtpVerify>("/booking/otp/verify", { phone, code }, { schema: otpVerifySchema }),
  myAppointments: (token: string, signal?: AbortSignal) => api.get<MyAppointments>("/booking/me/appointments", { headers: session(token), schema: myAppointmentsSchema, signal }),
  reschedule: (token: string, id: string, input: RescheduleInput) => api.patch<BookedAppointment>(`/booking/appointments/${id}`, input, { headers: session(token), schema: bookedAppointmentSchema }),
  cancel: (token: string, id: string, refundTo: "card" | "credit") => api.post<CancelResult>(`/booking/appointments/${id}/cancel`, { refundTo }, { headers: session(token), schema: cancelResultSchema }),
  sendReceipt: (reservationId: string, input: { channel: "email" | "sms"; to: string }) => api.post<ReceiptSent>(`/booking/reservations/${reservationId}/receipt`, input, { schema: receiptSentSchema }),
};
