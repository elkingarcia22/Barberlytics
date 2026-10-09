import { z } from "zod";
import type { AppMessageKey } from "@/app/i18n/types";

/**
 * El contrato del calendario (docs/API_CONTRACT.md, «Calendario»): lo que el
 * backend manda y lo que la pantalla le pide. Todo lo que se lee se valida
 * con Zod al llegar; las enumeraciones traen código y la interfaz decide
 * cómo se leen (por eso aquí van claves de idioma, no textos).
 */

export const workingRangeSchema = z.object({ start: z.string(), end: z.string() });
export type WorkingRange = z.infer<typeof workingRangeSchema>;

export const barberSchema = z.object({
  id: z.string(),
  branchId: z.string(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
  /** El nombre del nivel («Senior»), o nada. */
  level: z.string().nullable(),
  /** Franjas por día de la semana (0 = domingo). */
  workingHours: z.record(z.string(), z.array(workingRangeSchema)),
  acceptsWalkIns: z.boolean(),
  bookingVisible: z.boolean().optional(),
});
export type Barber = z.infer<typeof barberSchema>;

export const clientTypeSchema = z.enum(["walkin", "new", "retained", "frequent", "vip"]);
export type ClientType = z.infer<typeof clientTypeSchema>;

export const noteKindSchema = z.enum(["note", "medication", "allergy"]);
export type NoteKind = z.infer<typeof noteKindSchema>;

export const clientNoteSchema = z.object({ id: z.string(), kind: noteKindSchema, text: z.string(), createdAt: z.string() });
export type ClientNote = z.infer<typeof clientNoteSchema>;

export const clientSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  type: clientTypeSchema,
  visits: z.number(),
  cancellations: z.number(),
  noShows: z.number(),
  lastVisitAt: z.string().nullable(),
  preferredBarberId: z.string().nullable(),
  visitEveryDays: z.number().nullable(),
  notes: z.array(clientNoteSchema),
  /** La foto del cliente; sin ella se pintan sus iniciales. */
  avatarUrl: z.string().nullable().optional(),
});
export type Client = z.infer<typeof clientSchema>;

export const serviceSchema = z.object({ id: z.string(), name: z.string(), category: z.string(), durationMin: z.number(), price: z.number(), imageUrl: z.string().nullable().optional() });
export type Service = z.infer<typeof serviceSchema>;

export const productSchema = z.object({ id: z.string(), name: z.string(), category: z.string(), price: z.number(), imageUrl: z.string().nullable().optional() });
export type Product = z.infer<typeof productSchema>;

export const catalogSchema = z.object({
  barbers: z.array(barberSchema),
  clients: z.array(clientSchema),
  services: z.array(serviceSchema),
  products: z.array(productSchema),
});
export type CalendarCatalog = z.infer<typeof catalogSchema>;

export const appointmentStatusSchema = z.enum(["scheduled", "arrived", "seated", "paid", "no_show", "cancelled"]);
export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;

export const appointmentSourceSchema = z.enum(["internal", "online", "walkin"]);
export const repeatRuleSchema = z.enum(["none", "weekly", "biweekly", "triweekly", "monthly", "bimonthly", "quarterly"]);
export type RepeatRule = z.infer<typeof repeatRuleSchema>;

export const paymentMethodSchema = z.enum(["cash", "card", "link", "mixed"]);
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export const historyEntrySchema = z.object({ id: z.string(), at: z.string(), actor: z.string(), event: z.string() });
export type HistoryEntry = z.infer<typeof historyEntrySchema>;

export const paymentSchema = z.object({ method: paymentMethodSchema, tip: z.number(), tax: z.number(), total: z.number(), paidAt: z.string() });
export type Payment = z.infer<typeof paymentSchema>;

export const productLineSchema = z.object({ productId: z.string(), qty: z.number() });
export type ProductLine = z.infer<typeof productLineSchema>;

export const appointmentSchema = z.object({
  id: z.string(),
  branchId: z.string(),
  clientId: z.string(),
  barberId: z.string(),
  requestedBarberId: z.string().nullable(),
  serviceIds: z.array(z.string()),
  products: z.array(productLineSchema),
  /** ISO local de la sucursal, sin zona. */
  start: z.string(),
  durationMin: z.number(),
  status: appointmentStatusSchema,
  barberReady: z.boolean(),
  walkIn: z.boolean(),
  source: appointmentSourceSchema,
  repeat: repeatRuleSchema,
  seriesId: z.string().nullable(),
  notes: z.string().nullable(),
  /** Fotos del corte que pidió el cliente al reservar en línea. */
  referencePhotos: z.array(z.string()).optional(),
  createdAt: z.string(),
  createdBy: z.string(),
  history: z.array(historyEntrySchema),
  payment: paymentSchema.nullable(),
  /**
   * Las citas enlazadas comparten este id: las que salieron de un mismo
   * agendamiento (varias personas o varias citas de una vez) o las que se
   * enlazaron a mano. `null` o sin él, va suelta.
   */
  linkId: z.string().nullable().optional(),
});
export type Appointment = z.infer<typeof appointmentSchema>;

export const blockCategorySchema = z.enum(["sick", "vacation", "holiday", "lunch", "meeting", "business", "personal"]);
export type BlockCategory = z.infer<typeof blockCategorySchema>;
export const blockRepeatSchema = z.enum(["none", "daily", "weekly", "monthly"]);
export type BlockRepeat = z.infer<typeof blockRepeatSchema>;

export const timeBlockSchema = z.object({
  id: z.string(),
  branchId: z.string(),
  barberId: z.string(),
  category: blockCategorySchema,
  repeat: blockRepeatSchema,
  startDate: z.string(),
  endDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  description: z.string().nullable(),
});
export type TimeBlock = z.infer<typeof timeBlockSchema>;

export const calendarDaySchema = z.object({
  date: z.string(),
  appointments: z.array(appointmentSchema),
  blocks: z.array(timeBlockSchema),
  /** Las franjas de cada barbero ese día, con las excepciones de la semana ya aplicadas. */
  hours: z.record(z.string(), z.array(workingRangeSchema)).optional(),
});
export type CalendarDay = z.infer<typeof calendarDaySchema>;

export const monthDaySchema = z.object({ date: z.string(), occupancy: z.number().nullable(), count: z.number() });
export const calendarMonthSchema = z.object({ month: z.string(), days: z.array(monthDaySchema) });
export type CalendarMonth = z.infer<typeof calendarMonthSchema>;

export const waitlistEntrySchema = z.object({
  id: z.string(),
  branchId: z.string(),
  clientId: z.string(),
  serviceId: z.string(),
  barberId: z.string().nullable(),
  slots: z.array(z.object({ date: z.string(), time: z.string() })),
  createdAt: z.string(),
});
export type WaitlistEntry = z.infer<typeof waitlistEntrySchema>;
export const waitlistSchema = z.object({ items: z.array(waitlistEntrySchema) });

export const saleSchema = z.object({
  id: z.string(),
  branchId: z.string(),
  items: z.array(productLineSchema),
  method: paymentMethodSchema,
  total: z.number(),
  paidAt: z.string(),
});
export type Sale = z.infer<typeof saleSchema>;

/* ------------------------------------------------------------- entradas */

export const appointmentInputSchema = z.object({
  clientId: z.string().min(1, "Elige el cliente"),
  barberId: z.string().min(1, "Elige el barbero"),
  serviceIds: z.array(z.string()).min(1, "Elige el servicio"),
  /** ISO local «AAAA-MM-DDTHH:mm». */
  start: z.string().min(16, "Elige fecha y hora"),
  walkIn: z.boolean(),
  repeat: repeatRuleSchema,
  requestedBarberId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  /** Quien agenda sin reglas (dueño, administrador, recepción, barbero de renta) puede pisar otra cita o un bloqueo. */
  force: z.boolean().optional(),
});
export type AppointmentInput = z.infer<typeof appointmentInputSchema>;

export interface AppointmentPatch {
  status?: AppointmentStatus;
  barberReady?: boolean;
  start?: string;
  barberId?: string;
  durationMin?: number;
  serviceIds?: string[];
  notes?: string | null;
  /** Enlazarla con otras citas (su id de enlace) o desenlazarla (`null`). */
  linkId?: string | null;
  /** Por qué se hace el cambio («movida 15 min porque la anterior se alargó»): queda en el historial. */
  reason?: string;
  /** Saltarse la regla de no pisar: solo quien agenda sin reglas. */
  force?: boolean;
  /** Quién lo decidió cuando no fue la persona que está en pantalla: el asistente. */
  actor?: "assistant";
}

export interface CheckoutInput {
  serviceIds: string[];
  products: ProductLine[];
  tip: number;
  method: PaymentMethod;
  /** El recargo por tarjeta, si Configuración lo tiene encendido. */
  surcharge?: number;
}

export const blockInputSchema = z.object({
  barberId: z.string().min(1, "Elige el barbero"),
  category: blockCategorySchema,
  repeat: blockRepeatSchema,
  startDate: z.string().min(10, "Elige la fecha de inicio"),
  endDate: z.string().min(10, "Elige la fecha fin"),
  startTime: z.string().min(5, "Elige la hora de inicio"),
  endTime: z.string().min(5, "Elige la hora de cierre"),
  description: z.string().nullable(),
});
export type BlockInput = z.infer<typeof blockInputSchema>;

export interface WaitlistInput {
  branchId: string;
  clientId: string;
  serviceId: string;
  barberId: string | null;
  slots: { date: string; time: string }[];
}

export interface SaleInput {
  branchId: string;
  items: ProductLine[];
  method: PaymentMethod;
}

export interface NoteInput {
  kind: NoteKind;
  text: string;
}

/* --------------------------------------------------------------- claves */

export type CalendarView = "agenda" | "day" | "week" | "month";
export const CALENDAR_VIEWS: readonly CalendarView[] = ["agenda", "day", "week", "month"];

/** El filtro «Equipo»: los que trabajan, todos, o un barbero por id. */
export type TeamFilter = "working" | "all" | (string & {});

export const STATUS_KEYS: Record<AppointmentStatus, AppMessageKey> = {
  scheduled: "calendar.status.scheduled",
  arrived: "calendar.status.arrived",
  seated: "calendar.status.seated",
  paid: "calendar.status.paid",
  no_show: "calendar.status.noShow",
  cancelled: "calendar.status.cancelled",
};

export const CLIENT_TYPE_KEYS: Record<ClientType, AppMessageKey> = {
  walkin: "calendar.clientType.walkin",
  new: "calendar.clientType.new",
  retained: "calendar.clientType.retained",
  frequent: "calendar.clientType.frequent",
  vip: "calendar.clientType.vip",
};

export const REPEAT_KEYS: Record<RepeatRule, AppMessageKey> = {
  none: "calendar.repeat.none",
  weekly: "calendar.repeat.weekly",
  biweekly: "calendar.repeat.biweekly",
  triweekly: "calendar.repeat.triweekly",
  monthly: "calendar.repeat.monthly",
  bimonthly: "calendar.repeat.bimonthly",
  quarterly: "calendar.repeat.quarterly",
};

export const BLOCK_CATEGORY_KEYS: Record<BlockCategory, AppMessageKey> = {
  sick: "calendar.block.category.sick",
  vacation: "calendar.block.category.vacation",
  holiday: "calendar.block.category.holiday",
  lunch: "calendar.block.category.lunch",
  meeting: "calendar.block.category.meeting",
  business: "calendar.block.category.business",
  personal: "calendar.block.category.personal",
};

export const BLOCK_REPEAT_KEYS: Record<BlockRepeat, AppMessageKey> = {
  none: "calendar.block.repeat.none",
  daily: "calendar.block.repeat.daily",
  weekly: "calendar.block.repeat.weekly",
  monthly: "calendar.block.repeat.monthly",
};

export const PAYMENT_METHOD_KEYS: Record<PaymentMethod, AppMessageKey> = {
  cash: "calendar.checkout.cash",
  card: "calendar.checkout.card",
  link: "calendar.checkout.link",
  mixed: "calendar.checkout.mixed",
};

export const NOTE_KIND_KEYS: Record<NoteKind, AppMessageKey> = {
  note: "calendar.notes.note",
  medication: "calendar.notes.medication",
  allergy: "calendar.notes.allergies",
};
