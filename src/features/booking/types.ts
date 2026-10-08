import { z } from "zod";

/**
 * El contrato de la reserva en línea (docs/API_CONTRACT.md, «Reserva en
 * línea»). Es la cara pública de la barbería: no lleva sesión de la app. El
 * cliente se identifica con su celular; para ver y cambiar sus citas pide un
 * código que devuelve un token propio de la reserva.
 */

export const tipOptionSchema = z.object({ id: z.string(), type: z.enum(["percent", "amount"]), value: z.number() });

export const bookingBranchSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  city: z.string(),
  phone: z.string(),
  /** «09:00» y «19:00»: el horario de hoy. */
  opensAt: z.string(),
  closesAt: z.string(),
  imageUrl: z.string().nullable(),
  barbers: z.number(),
});
export type BookingBranch = z.infer<typeof bookingBranchSchema>;

export const bookingShopSchema = z.object({
  name: z.string(),
  logoUrl: z.string().nullable(),
  coverUrl: z.string().nullable(),
  phone: z.string(),
  currency: z.string(),
  taxPercent: z.number(),
  minNoticeMinutes: z.number(),
  slotMinutes: z.number(),
  cancelHours: z.number(),
  lateFeePercent: z.number(),
  maxCancellations: z.number(),
  policy: z.string(),
  tipOptions: z.array(tipOptionSchema),
  defaultTipId: z.string().nullable(),
  payment: z.object({ card: z.boolean(), payAtShop: z.boolean() }),
  branches: z.array(bookingBranchSchema),
});
export type BookingShop = z.infer<typeof bookingShopSchema>;

export const bookingServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  durationMin: z.number(),
  /** El precio base; cada barbero puede cobrar distinto. */
  price: z.number(),
  imageUrl: z.string().nullable(),
  isCombo: z.boolean(),
  popular: z.boolean(),
});
export type BookingService = z.infer<typeof bookingServiceSchema>;

export const bookingBarberSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
  level: z.string().nullable(),
  description: z.string(),
  gallery: z.array(z.string()),
  rating: z.number(),
  reviews: z.number(),
  /** Los servicios que hace y lo que cobra por cada uno. */
  prices: z.record(z.string(), z.number()),
});
export type BookingBarber = z.infer<typeof bookingBarberSchema>;

export const bookingProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  price: z.number(),
  imageUrl: z.string().nullable(),
});
export type BookingProduct = z.infer<typeof bookingProductSchema>;

export const bookingCatalogSchema = z.object({
  services: z.array(bookingServiceSchema),
  barbers: z.array(bookingBarberSchema),
  products: z.array(bookingProductSchema),
});
export type BookingCatalog = z.infer<typeof bookingCatalogSchema>;

export const bookingGuestSchema = z.object({ id: z.string(), name: z.string(), relation: z.string() });
export type BookingGuest = z.infer<typeof bookingGuestSchema>;

export const lastVisitSchema = z.object({ branchId: z.string(), serviceIds: z.array(z.string()), barberId: z.string().nullable(), at: z.string() });
export type LastVisit = z.infer<typeof lastVisitSchema>;

export const bookingCustomerSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string(),
  isNew: z.boolean(),
  /** «Reserva y pago solo en línea»: no puede elegir pagar en la barbería. */
  onlineOnly: z.boolean(),
  guests: z.array(bookingGuestSchema),
  lastVisit: lastVisitSchema.nullable(),
  /** Saldo a favor de reembolsos anteriores. */
  credit: z.number(),
  upcoming: z.number(),
});
export type BookingCustomer = z.infer<typeof bookingCustomerSchema>;

export const visitSuggestionSchema = z.object({
  /** Cada cuántos días suele volver (su frecuencia de visita). */
  everyDays: z.number(),
  lastVisitAt: z.string(),
  /** El día que le toca: última visita + su ritmo. */
  dueDate: z.string(),
  isOverdue: z.boolean(),
  /** La hora a la que suele venir. */
  usualTime: z.string(),
  branchId: z.string(),
  serviceIds: z.array(z.string()),
  /** Horas libres propuestas, la mejor primero: «AAAA-MM-DDTHH:mm» y quién atiende. */
  options: z.array(z.object({ start: z.string(), barberId: z.string(), sameBarber: z.boolean() })),
});
export type VisitSuggestion = z.infer<typeof visitSuggestionSchema>;
export const suggestionResponseSchema = z.object({ suggestion: visitSuggestionSchema.nullable() });

export const lookupSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("known"), customer: bookingCustomerSchema }),
  z.object({ status: z.literal("new") }),
  z.object({ status: z.literal("blocked") }),
]);
export type LookupResult = z.infer<typeof lookupSchema>;

export const slotSchema = z.object({ time: z.string(), barberIds: z.array(z.string()) });
export type Slot = z.infer<typeof slotSchema>;
export const availabilitySchema = z.object({ date: z.string(), slots: z.array(slotSchema) });
export type Availability = z.infer<typeof availabilitySchema>;

export const bookedStatusSchema = z.enum(["scheduled", "completed", "cancelled", "no_show"]);
export type BookedStatus = z.infer<typeof bookedStatusSchema>;

export const bookedAppointmentSchema = z.object({
  id: z.string(),
  reservationId: z.string().nullable(),
  branchId: z.string(),
  branchName: z.string(),
  personName: z.string(),
  guestRelation: z.string().nullable(),
  serviceIds: z.array(z.string()),
  serviceNames: z.array(z.string()),
  barberId: z.string(),
  barberName: z.string(),
  barberAvatarUrl: z.string().nullable(),
  noPreference: z.boolean(),
  /** ISO local de la sucursal, sin zona. */
  start: z.string(),
  durationMin: z.number(),
  price: z.number(),
  /** Lo que ya se pagó por esta cita en línea. */
  paid: z.number(),
  status: bookedStatusSchema,
});
export type BookedAppointment = z.infer<typeof bookedAppointmentSchema>;

export const totalsSchema = z.object({
  services: z.number(),
  products: z.number(),
  discount: z.number(),
  subtotal: z.number(),
  tax: z.number(),
  tip: z.number(),
  total: z.number(),
});

export const payMethodSchema = z.enum(["card", "wallet", "shop", "credit"]);
export type PayMethod = z.infer<typeof payMethodSchema>;

export const reservationSchema = z.object({
  id: z.string(),
  number: z.string(),
  createdAt: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  email: z.string(),
  phone: z.string(),
  appointments: z.array(bookedAppointmentSchema),
  products: z.array(z.object({ productId: z.string(), name: z.string(), qty: z.number(), price: z.number() })),
  promoCode: z.string().nullable(),
  totals: totalsSchema,
  payment: z.object({ method: payMethodSchema, status: z.enum(["paid", "pending"]), last4: z.string().nullable(), brand: z.string().nullable(), paid: z.number() }),
});
export type Reservation = z.infer<typeof reservationSchema>;

export const myAppointmentsSchema = z.object({ upcoming: z.array(bookedAppointmentSchema), past: z.array(bookedAppointmentSchema), reservations: z.array(reservationSchema) });
export type MyAppointments = z.infer<typeof myAppointmentsSchema>;

export const otpVerifySchema = z.object({ token: z.string(), customer: bookingCustomerSchema });
export type OtpVerify = z.infer<typeof otpVerifySchema>;

export const cancelResultSchema = z.object({ appointment: bookedAppointmentSchema, fee: z.number(), refund: z.number(), refundTo: z.enum(["card", "credit", "none"]) });
export type CancelResult = z.infer<typeof cancelResultSchema>;

export const receiptSentSchema = z.object({ channel: z.enum(["email", "sms"]), to: z.string() });
export type ReceiptSent = z.infer<typeof receiptSentSchema>;

/* ------------------------------------------------------------- entradas */

export interface NewCustomerInput {
  phone: string;
  firstName: string;
  lastName: string;
  email: string;
  marketing: boolean;
}

export interface ReservationItemInput {
  /** `null` es para quien reserva; si no, un invitado guardado o uno nuevo por nombre. */
  guestId: string | null;
  guestName?: string;
  guestRelation?: string;
  serviceIds: string[];
  /** `null` = sin preferencia: el backend asigna el primer barbero libre. */
  barberId: string | null;
  /** «AAAA-MM-DDTHH:mm». */
  start: string;
}

export interface ReservationInput {
  customerId: string;
  branchId: string;
  items: ReservationItemInput[];
  products: { productId: string; qty: number }[];
  tipId: string | null;
  promoCode: string | null;
  method: PayMethod;
  card?: { number: string; name: string };
  notes?: string;
}

export interface RescheduleInput {
  start: string;
  barberId: string | null;
}
