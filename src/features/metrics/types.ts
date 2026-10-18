import { z } from "zod";

/** Un valor con su lectura del periodo anterior, para la píldora de variación. */
const comparedSchema = z.object({ value: z.number(), previous: z.number() });
export type Compared = z.infer<typeof comparedSchema>;

export const periodGranularitySchema = z.enum(["day", "week", "month"]);
export type MetricsGranularity = z.infer<typeof periodGranularitySchema>;

export const incomeLineSchema = z.enum(["services", "products", "taxes", "tips", "fees", "noShow"]);
export type IncomeLine = z.infer<typeof incomeLineSchema>;

export const appointmentStatusSchema = z.enum(["completed", "pendingCollection", "cancelled", "noShow"]);
export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;

export const bookingMethodSchema = z.enum(["internal", "online", "walkIn"]);
export type BookingMethod = z.infer<typeof bookingMethodSchema>;

export const daypartSchema = z.enum(["morning", "afternoon", "evening"]);
export type Daypart = z.infer<typeof daypartSchema>;

export const paymentMethodSchema = z.enum(["card", "cash", "transfer", "giftCard"]);
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

const catalogRowSchema = z.object({ id: z.string(), name: z.string(), count: z.number(), amount: z.number() });
export type CatalogRow = z.infer<typeof catalogRowSchema>;

export const metricsBusinessSchema = z.object({
  period: z.object({ granularity: periodGranularitySchema, from: z.string(), to: z.string() }),
  previous: z.object({ from: z.string(), to: z.string() }),
  /** Quién atiende en la sucursal, para el filtro; no depende del filtro puesto. */
  barbers: z.array(z.object({ id: z.string(), name: z.string() })),
  kpis: z.object({
    sales: comparedSchema,
    averageTicket: comparedSchema,
    transactions: comparedSchema,
    tipsRate: comparedSchema,
    tipsAmount: z.number(),
    cancellationRate: comparedSchema,
    refunds: z.object({ amount: z.number(), rate: z.number() }),
    discounts: z.object({ amount: z.number(), rate: z.number() }),
  }),
  /** Un punto por día del periodo (por hora cuando el periodo es un día). */
  trend: z.array(z.object({ label: z.string(), sales: z.number(), appointments: z.number() })),
  income: z.array(z.object({ id: incomeLineSchema, amount: z.number() })),
  appointments: z.object({
    total: z.number(),
    clients: z.number(),
    byStatus: z.array(z.object({ id: appointmentStatusSchema, count: z.number() })),
    byMethod: z.array(z.object({ id: bookingMethodSchema, count: z.number() })),
    byDaypart: z.array(z.object({ id: daypartSchema, count: z.number() })),
    byHour: z.array(z.object({ hour: z.number().int().min(0).max(23), count: z.number() })),
  }),
  payments: z.array(z.object({ id: paymentMethodSchema, amount: z.number() })),
  services: z.array(catalogRowSchema),
  products: z.array(catalogRowSchema),
});
export type MetricsBusiness = z.infer<typeof metricsBusinessSchema>;

const periodSchema = z.object({ granularity: periodGranularitySchema, from: z.string(), to: z.string() });
const previousSchema = z.object({ from: z.string(), to: z.string() });

// ── Clientes ──
export const clientTypeSchema = z.enum(["new", "retainedNew", "repeat", "recovered"]);
export type ClientType = z.infer<typeof clientTypeSchema>;
export const visitFrequencySchema = z.enum(["weekly", "biweekly", "monthly", "occasional"]);
export type VisitFrequency = z.infer<typeof visitFrequencySchema>;

export const metricsCustomersSchema = z.object({
  period: periodSchema,
  previous: previousSchema,
  clients: z.number(),
  kpis: z.object({
    retentionRate: comparedSchema,
    avgIncomePerClient: comparedSchema,
    onlineBookings: comparedSchema,
    walkInRate: comparedSchema,
  }),
  byClientType: z.array(z.object({ id: clientTypeSchema, count: z.number() })),
  newVsReturning: z.object({ new: z.number(), returning: z.number() }),
  barberPreference: z.object({ withPreference: z.number(), noPreference: z.number() }),
  visitFrequency: z.array(z.object({ id: visitFrequencySchema, count: z.number() })),
});
export type MetricsCustomers = z.infer<typeof metricsCustomersSchema>;

// ── Barberos ──
export const metricsBarbersSchema = z.object({
  period: periodSchema,
  previous: previousSchema,
  kpis: z.object({
    totalNet: comparedSchema,
    loyalty: comparedSchema,
    avgOccupancy: comparedSchema,
    avgTicket: comparedSchema,
  }),
  barbers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      net: z.number(),
      services: z.number(),
      occupancy: z.number(),
      cancellationRate: z.number(),
      tipsRate: z.number(),
    })
  ),
});
export type MetricsBarbers = z.infer<typeof metricsBarbersSchema>;

// ── Marketing ──
export const metricsMarketingSchema = z.object({
  period: periodSchema,
  previous: previousSchema,
  kpis: z.object({
    onlineBookings: comparedSchema,
    bestChannel: z.string().nullable(),
    campaignBookings: comparedSchema,
  }),
  channels: z.array(z.object({ id: z.string(), name: z.string(), bookings: z.number(), visits: z.number() })),
  campaigns: z.array(z.object({ id: z.string(), name: z.string(), bookings: z.number(), revenue: z.number() })),
});
export type MetricsMarketing = z.infer<typeof metricsMarketingSchema>;

// ── IA ──
export const suggestionGroupSchema = z.enum(["clients", "growth", "operations"]);
export type SuggestionGroup = z.infer<typeof suggestionGroupSchema>;
export const suggestionTypeSchema = z.enum(["risk", "recommendation", "opportunity", "insight"]);

export const metricsInsightsSchema = z.object({
  /** Los tres meses que alimentan el diagnóstico. */
  window: previousSchema,
  health: z.object({
    score: z.number(),
    completionRate: z.number(),
    retentionRate: z.number(),
    noShowRate: z.number(),
    avgTicket: z.number(),
  }),
  risks: z.object({ churned: z.number(), atRisk: z.number(), overdue: z.number() }),
  capacity: z.object({
    hours: z.array(z.number().int()),
    /** Ocupación 0–100 por día de la semana (lunes primero) y hora. */
    rows: z.array(z.object({ day: z.number().int().min(0).max(6), values: z.array(z.number()) })),
  }),
  suggestions: z.array(
    z.object({
      id: z.string(),
      group: suggestionGroupSchema,
      type: suggestionTypeSchema,
      tag: z.string(),
      title: z.string(),
      description: z.string(),
      action: z.string(),
      evidence: z.string().optional(),
    })
  ),
});
export type MetricsInsights = z.infer<typeof metricsInsightsSchema>;

export interface MetricsParams {
  granularity: MetricsGranularity;
  /** «2026-09-28»: cualquier día dentro del periodo. */
  date: string;
  /** `all` o el id de un barbero. */
  barberId: string;
  /** La sucursal de la cabecera: cada una tiene sus cifras. */
  branchId: string;
}

export const ALL_BARBERS = "all";
