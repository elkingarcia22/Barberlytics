import { z } from "zod";
import { customerSourceSchema, cutRecordSchema, referralSummarySchema } from "./loyalty";
import type { AppMessageKey } from "@/app/i18n/types";
import { clientNoteSchema, conductReportSchema } from "@/features/calendar/types";

/**
 * En qué momento de la relación está un cliente. Los cuatro primeros dicen
 * cuánto viene; los tres siguientes, qué pasó con el tiempo; `blocked` es
 * una decisión del negocio y manda sobre los demás.
 */
export const customerSegmentSchema = z.enum(["new", "retained", "frequent", "vip", "atRisk", "lost", "recovered", "blocked"]);
export type CustomerSegment = z.infer<typeof customerSegmentSchema>;

export const customerSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  /** La foto del cliente; sin ella se pintan sus iniciales. */
  avatarUrl: z.string().nullable().optional(),
  email: z.string(),
  branchId: z.string(),
  segment: customerSegmentSchema,
  blocked: z.boolean(),
  ltv: z.number(),
  visits: z.number(),
  cancellations: z.number(),
  noShows: z.number(),
  lastVisitAt: z.string().nullable(),
  visitEveryDays: z.number().nullable(),
  preferredBarber: z.string().nullable(),
  /** La ficha de equipo del barbero que prefiere: con ella se recorta «sus clientes». */
  preferredBarberId: z.string().nullable().default(null),
  /** Los barberos con los que tiene cita por atender o cobrada en los últimos 12 meses. */
  barberIds: z.array(z.string()).default([]),
  birthDate: z.string().nullable(),
  createdAt: z.string(),
  /** Alergias y medicamentos anotados: lo que el barbero tiene que ver antes de empezar. */
  medicalNotes: z.number(),
  /** Etiquetas propias («cera mate», «estudiante»): para filtrar y escribir a un grupo. */
  tags: z.array(z.string()).default([]),
  /** Cómo llegó («¿cómo nos conociste?»). */
  source: customerSourceSchema.nullable().default(null),
});
export type Customer = z.infer<typeof customerSchema>;

export const customersResponseSchema = z.object({ items: z.array(customerSchema) });
export type CustomersResponse = z.infer<typeof customersResponseSchema>;

export const customerAppointmentStatusSchema = z.enum(["scheduled", "completed", "cancelled", "no_show"]);
export type CustomerAppointmentStatus = z.infer<typeof customerAppointmentStatusSchema>;

export const customerAppointmentSchema = z.object({
  id: z.string(),
  service: z.string(),
  start: z.string(),
  barber: z.string().nullable(),
  barberId: z.string().nullable().default(null),
  source: z.enum(["internal", "online", "walkin"]),
  requestedBarber: z.boolean(),
  status: customerAppointmentStatusSchema,
  total: z.number(),
});
export type CustomerAppointment = z.infer<typeof customerAppointmentSchema>;

export const customerPaymentSchema = z.object({
  id: z.string(),
  date: z.string(),
  status: z.enum(["paid", "refunded"]),
  amount: z.number(),
  method: z.enum(["cash", "card", "link"]),
  reference: z.string(),
});
export type CustomerPayment = z.infer<typeof customerPaymentSchema>;

export const customerGuestSchema = z.object({ id: z.string(), name: z.string(), relation: z.string(), visits: z.number() });
export type CustomerGuest = z.infer<typeof customerGuestSchema>;

export const customerProductSchema = z.object({ id: z.string(), name: z.string(), units: z.number(), total: z.number(), lastBoughtAt: z.string(), imageUrl: z.string().nullable().optional() });
export type CustomerProduct = z.infer<typeof customerProductSchema>;

export const customerDetailSchema = customerSchema.extend({
  country: z.string(),
  state: z.string(),
  city: z.string(),
  address: z.string(),
  zipcode: z.string(),
  onlineOnly: z.boolean(),
  stats: z.object({
    avgTicket: z.number(),
    transactions: z.number(),
    completedRate: z.number(),
    cancelledRate: z.number(),
    noShowRate: z.number(),
    rebookRate: z.number(),
    leadTimeDays: z.number(),
  }),
  notes: z.array(clientNoteSchema),
  /** Los reportes de actitud que dejó el equipo al cerrar sus citas. */
  conduct: z.array(conductReportSchema).default([]),
  guests: z.array(customerGuestSchema),
  appointments: z.array(customerAppointmentSchema),
  lastAppointmentId: z.string().nullable(),
  payments: z.array(customerPaymentSchema),
  products: z.array(customerProductSchema),
  /** Su código de referido, quién lo trajo y a cuántos trajo. */
  referral: referralSummarySchema.optional(),
  /** El último corte anotado (fórmula y fotos). */
  lastCut: cutRecordSchema.nullable().default(null),
});
export type CustomerDetail = z.infer<typeof customerDetailSchema>;

/** Lo que captura el formulario de alta y edición. Los mensajes son claves del diccionario. */
export const customerInputSchema = z.object({
  firstName: z.string().trim().min(2, "customers.form.error.firstName"),
  lastName: z.string().trim().min(2, "customers.form.error.lastName"),
  phone: z.string().refine((value) => value.replace(/\D/g, "").length >= 8, "customers.form.error.phone"),
  /** Opcional: el celular identifica al cliente. */
  email: z.string().trim().refine((value) => value === "" || z.string().email().safeParse(value).success, "customers.form.error.email"),
  country: z.string().trim(),
  state: z.string().trim(),
  city: z.string().trim(),
  address: z.string().trim(),
  zipcode: z.string().trim(),
  birthDate: z.string(),
  onlineOnly: z.boolean(),
  /** «¿Cómo nos conociste?». */
  source: customerSourceSchema.nullable(),
  /** El código de referido con el que llegó (solo al crearlo). */
  referralCode: z.string().trim(),
});
export type CustomerInput = z.infer<typeof customerInputSchema>;

export const EMPTY_CUSTOMER_INPUT: CustomerInput = { firstName: "", lastName: "", phone: "", email: "", country: "", state: "", city: "", address: "", zipcode: "", birthDate: "", onlineOnly: false, source: null, referralCode: "" };

export interface GuestInput {
  name: string;
  relation: string;
}

export const SEGMENT_KEYS: Readonly<Record<CustomerSegment, AppMessageKey>> = {
  new: "customers.segment.new",
  retained: "customers.segment.retained",
  frequent: "customers.segment.frequent",
  vip: "customers.segment.vip",
  atRisk: "customers.segment.atRisk",
  lost: "customers.segment.lost",
  recovered: "customers.segment.recovered",
  blocked: "customers.segment.blocked",
};

/** Qué significa cada segmento, en una línea: se lee al elegirlo, no después de buscarlo. */
export const SEGMENT_HINT_KEYS: Readonly<Record<CustomerSegment, AppMessageKey>> = {
  new: "customers.segment.newHint",
  retained: "customers.segment.retainedHint",
  frequent: "customers.segment.frequentHint",
  vip: "customers.segment.vipHint",
  atRisk: "customers.segment.atRiskHint",
  lost: "customers.segment.lostHint",
  recovered: "customers.segment.recoveredHint",
  blocked: "customers.segment.blockedHint",
};

export const APPOINTMENT_STATUS_KEYS: Readonly<Record<CustomerAppointmentStatus, AppMessageKey>> = {
  scheduled: "customers.appointment.scheduled",
  completed: "customers.appointment.completed",
  cancelled: "customers.appointment.cancelled",
  no_show: "customers.appointment.noShow",
};

export const APPOINTMENT_SOURCE_KEYS: Readonly<Record<CustomerAppointment["source"], AppMessageKey>> = {
  internal: "customers.source.internal",
  online: "customers.source.online",
  walkin: "customers.source.walkin",
};

export const PAYMENT_METHOD_KEYS: Readonly<Record<CustomerPayment["method"], AppMessageKey>> = {
  cash: "customers.method.cash",
  card: "customers.method.card",
  link: "customers.method.link",
};

/** «Marcela Gómez Ruiz» → nombre y apellidos, para precargar el formulario. */
export function splitName(name: string): { firstName: string; lastName: string } {
  const [firstName = "", ...rest] = name.trim().split(/\s+/);
  return { firstName, lastName: rest.join(" ") };
}

export function inputFromDetail(customer: CustomerDetail): CustomerInput {
  return { ...splitName(customer.name), phone: customer.phone.replace(/[^\d+]/g, ""), email: customer.email, country: customer.country, state: customer.state, city: customer.city, address: customer.address, zipcode: customer.zipcode, birthDate: customer.birthDate ?? "", onlineOnly: customer.onlineOnly, source: customer.source, referralCode: "" };
}
