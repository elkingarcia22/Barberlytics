import { z } from "zod";
import { GATEWAY_PROVIDERS, type GatewayProvider } from "./gatewayProviders";

/**
 * Las formas de cada ajuste. Dos familias, como en el backend: documentos
 * (`/settings/:section`, un objeto que se guarda entero) y listas
 * (`/settings/lists/:list`, con alta, edición y borrado).
 */

export type SettingsSectionId = "business" | "booking" | "pricing" | "tips" | "cardFee" | "commissions" | "payrollCycle" | "notifications" | "company" | "billing";
export type SettingsListId = "branches" | "closures" | "taxGroups" | "devices" | "gateways";

/* ---------------------------------------------------------------- negocio */

export const businessSchema = z.object({
  timezone: z.string(),
  timeFormat: z.enum(["12h", "24h"]),
  weekStart: z.enum(["monday", "sunday"]),
  openTime: z.string(),
  closeTime: z.string(),
  holidays: z.array(z.string()),
  website: z.string(),
  instagram: z.string(),
  facebook: z.string(),
  googleMaps: z.string(),
});
export type BusinessSettings = z.infer<typeof businessSchema>;

/* --------------------------------------------------------------- reservas */

export const bookingSchema = z.object({
  minNotice: z.number(),
  minNoticeUnit: z.enum(["minutes", "hours", "days"]),
  slotInterval: z.number(),
  surge: z.object({ enabled: z.boolean(), occupancy: z.number(), increase: z.number(), increaseType: z.enum(["percent", "amount"]) }),
  waitlist: z.object({ acceptMinutes: z.number(), arriveMinutes: z.number() }),
  paymentMethods: z.object({ card: z.boolean(), payAtShop: z.boolean() }),
  /** Anticipo con tarjeta para reservar pagando en la barbería: clientes nuevos y/o tras N inasistencias (0 = nunca). */
  deposit: z.object({ enabled: z.boolean(), percent: z.number(), newClients: z.boolean(), afterNoShows: z.number() }),
  /** Cliente frecuente: cada `every` visitas, el servicio `rewardServiceId` de cortesía. */
  loyalty: z.object({ enabled: z.boolean(), every: z.number(), rewardServiceId: z.string() }),
  /** Paquetes prepagados que se venden en la reserva: N visitas de un servicio, con vencimiento. */
  packages: z.array(z.object({ id: z.string(), name: z.string(), serviceId: z.string(), sessions: z.number(), price: z.number(), validDays: z.number() })).default([]),
  cancelHours: z.number(),
  /** Los bloqueos que pone un barbero quedan pendientes hasta que el dueño, el administrador o recepción los aprueban. */
  blocksNeedApproval: z.boolean().default(false),
  lateFeePercent: z.number(),
  maxCancellations: z.number(),
  policy: z.string(),
  /** Los pone el servidor; no se editan. */
  links: z.object({ widgetId: z.string(), scriptUrl: z.string(), bookingUrl: z.string(), frontDeskUrl: z.string(), portalUrl: z.string() }),
});
export type BookingSettings = z.infer<typeof bookingSchema>;

/* ----------------------------------------------------------------- cobros */

export const pricingSchema = z.object({ currency: z.string(), taxInclusive: z.boolean() });
export type PricingSettings = z.infer<typeof pricingSchema>;

export const tipOptionSchema = z.object({ id: z.string(), type: z.enum(["percent", "amount"]), value: z.number() });
export type TipOption = z.infer<typeof tipOptionSchema>;

export const tipsSchema = z.object({ options: z.array(tipOptionSchema), defaultId: z.string().nullable(), checkout: z.enum(["unset", "amount", "percent", "both"]) });
export type TipsSettings = z.infer<typeof tipsSchema>;

export const cardFeeSchema = z.object({ enabled: z.boolean(), name: z.string(), rate: z.number(), type: z.enum(["percent", "amount"]) });
export type CardFeeSettings = z.infer<typeof cardFeeSchema>;

/**
 * Una pasarela conectada. La clave secreta nunca vuelve del servidor: solo se
 * sabe si está guardada. Cada sucursal elige con cuál cobra.
 */
export const gatewaySchema = z.object({
  id: z.string(),
  provider: z.enum(GATEWAY_PROVIDERS),
  name: z.string(),
  publicKey: z.string(),
  hasSecret: z.boolean(),
  connected: z.boolean(),
});
export type Gateway = z.infer<typeof gatewaySchema>;
export interface GatewayInput {
  provider: GatewayProvider;
  name: string;
  publicKey: string;
  secretKey: string;
}

export const paymentsTestSchema = z.object({ ok: z.boolean(), message: z.string() });

/* ------------------------------------------------------------ pagos equipo */

export const commissionsSchema = z.object({ deductDiscounts: z.boolean(), deductTaxes: z.boolean(), deductServiceCost: z.boolean(), deductProductCost: z.boolean() });
export type CommissionSettings = z.infer<typeof commissionsSchema>;

export const payrollCycleSchema = z.object({ cycle: z.enum(["weekly", "biweekly", "monthly"]), startDay: z.number() });
export type PayrollCycleSettings = z.infer<typeof payrollCycleSchema>;

/* ----------------------------------------------------------------- avisos */

/** Hasta tres recordatorios al cliente, cada uno a tantas horas de la cita. */
export const MAX_REMINDERS = 3;
export const DEFAULT_REMINDER_HOURS: readonly number[] = [24, 2];
export const notificationsSchema = z.object({
  toggles: z.record(z.string(), z.boolean()),
  thresholds: z.record(z.string(), z.number()),
  reminderHours: z.array(z.number().int().min(1).max(168)).max(MAX_REMINDERS).optional(),
});
export type NotificationSettings = z.infer<typeof notificationsSchema>;

/* ----------------------------------------------------------------- cuenta */

export const companySchema = z.object({ name: z.string(), legalName: z.string(), identification: z.string(), website: z.string(), phone: z.string(), country: z.string() });
export type CompanySettings = z.infer<typeof companySchema>;

export const billingSchema = z.object({
  plan: z.object({ name: z.string(), cycle: z.enum(["monthly", "annual"]), price: z.number(), nextInvoiceAt: z.string() }),
  details: z.object({ name: z.string(), address: z.string(), city: z.string(), state: z.string(), email: z.string() }),
  method: z.object({ brand: z.string(), last4: z.string() }),
  invoices: z.array(z.object({ id: z.string(), concept: z.string(), total: z.number(), date: z.string() })),
});
export type BillingSettings = z.infer<typeof billingSchema>;

/* ----------------------------------------------------------------- listas */

export const branchSchema = z.object({
  id: z.string(),
  name: z.string(),
  legalName: z.string(),
  taxId: z.string(),
  country: z.string(),
  state: z.string(),
  city: z.string(),
  address: z.string(),
  zipcode: z.string(),
  phone: z.string(),
  currency: z.string(),
  language: z.string(),
  timezone: z.string(),
  /** El impuesto de la sucursal (Configuración › Impuestos): lo usa lo que no tiene tasa propia. */
  taxGroupId: z.string().nullable().default(null),
  /** Con qué pasarela cobra en línea; sin ella, la reserva solo deja pagar en la barbería. */
  gatewayId: z.string().nullable().default(null),
  description: z.string(),
  status: z.enum(["active", "inactive"]),
  createdAt: z.string(),
  teamSize: z.number().optional(),
});
export type Branch = z.infer<typeof branchSchema>;
export type BranchInput = Omit<Branch, "id" | "status" | "createdAt" | "teamSize">;

export const closureSchema = z.object({ id: z.string(), startDate: z.string(), endDate: z.string(), branchIds: z.array(z.string()), description: z.string() });
export type Closure = z.infer<typeof closureSchema>;
export type ClosureInput = Omit<Closure, "id">;

export const taxGroupSchema = z.object({ id: z.string(), name: z.string(), taxes: z.array(z.object({ name: z.string(), percent: z.number() })) });
export type TaxGroup = z.infer<typeof taxGroupSchema>;
export type TaxGroupInput = Omit<TaxGroup, "id">;

export const deviceSchema = z.object({ id: z.string(), name: z.string(), serial: z.string(), tpn: z.string(), hasAuthKey: z.boolean() });
export type Device = z.infer<typeof deviceSchema>;
export interface DeviceInput {
  name: string;
  serial: string;
  tpn: string;
  authKey: string;
}

export const CURRENCIES: readonly string[] = ["USD", "COP", "MXN", "EUR"];
