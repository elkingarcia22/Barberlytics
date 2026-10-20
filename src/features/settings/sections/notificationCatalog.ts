import type { AppMessageKey } from "@/app/i18n/types";

/**
 * El catálogo de avisos: a quién le llegan, de qué avisan y por qué canal.
 * Es la única fuente: de aquí salen las pestañas, los grupos y las llaves con
 * las que se guarda cada interruptor (`audiencia.evento.canal`).
 *
 * Un aviso con `threshold` lleva un número que lo afina —un porcentaje de
 * ocupación, los minutos antes de la cita—.
 */

export type NotificationChannel = "email" | "push" | "sms" | "whatsapp";
export type NotificationAudience = "admin" | "barberCommission" | "barberRent" | "frontDesk" | "owner" | "clients";

export interface NotificationEvent {
  id: string;
  labelKey: AppMessageKey;
  channels: readonly NotificationChannel[];
  threshold?: { unit: "percent" | "minutes"; default: number };
}

export interface NotificationGroup {
  id: string;
  labelKey: AppMessageKey;
  events: readonly NotificationEvent[];
}

const EMAIL_PUSH: readonly NotificationChannel[] = ["email", "push"];
const PUSH: readonly NotificationChannel[] = ["push"];
const EMAIL_SMS: readonly NotificationChannel[] = ["email", "sms"];
/** Lo que se le manda al cliente por su cita sale primero por WhatsApp (el motor de mensajes de la reserva). */
const CLIENT_MESSAGE: readonly NotificationChannel[] = ["whatsapp", "email", "sms"];

const event = (id: string, channels: readonly NotificationChannel[], threshold?: NotificationEvent["threshold"]): NotificationEvent => ({ id, labelKey: `cfg.notify.event.${id}` as AppMessageKey, channels, threshold });
const group = (id: string, events: readonly NotificationEvent[]): NotificationGroup => ({ id, labelKey: `cfg.notify.group.${id}` as AppMessageKey, events });

const CLIENT_IMPORT = [event("clientImportFailed", EMAIL_PUSH), event("clientImportDone", EMAIL_PUSH)];
const CLIENT_STATES = [event("clientLost", PUSH), event("clientAtRisk", PUSH), event("clientRecovered", PUSH), event("clientVip", PUSH)];
const APPOINTMENT_CHANGES = [event("appointmentChanged", PUSH), event("appointmentCancelled", PUSH)];
const STOCK = [event("productLow", PUSH), event("productOut", PUSH), event("comboLow", PUSH), event("comboOut", PUSH)];
const PRODUCT_IMPORT = [event("productImportFailed", EMAIL_PUSH), event("productImportDone", EMAIL_PUSH)];
const METRICS_HEALTH = [event("metricDown", EMAIL_PUSH), event("metricUp", EMAIL_PUSH)];
const RETENTION = [event("retentionAbove", PUSH, { unit: "percent", default: 70 }), event("retentionBelow", PUSH, { unit: "percent", default: 40 })];
const REPORTS = [event("reportDaily", EMAIL_PUSH), event("reportWeekly", EMAIL_PUSH), event("reportMonthly", EMAIL_PUSH), event("reportQuarterly", EMAIL_PUSH), event("reportYearly", EMAIL_PUSH), event("priceSuggestion", EMAIL_PUSH)];
const SHOP_OCCUPANCY = event("shopOccupancy", PUSH, { unit: "percent", default: 85 });
const TIME_OFF = [event("barberBlocked", PUSH), event("vacationRequested", PUSH), event("rentVacation", PUSH)];
const BARBER_DAY = [event("waitlistAssigned", PUSH), event("specialResources", PUSH)];
const REMINDER = event("appointmentReminder", PUSH, { unit: "minutes", default: 30 });
/* Lo que también sale en la campana de la app («En la app»): apagarlo aquí lo saca de ahí. */
const BOOKING_ONLINE = event("bookingOnline", PUSH);
const WHATSAPP_FAILED = event("whatsappFailed", PUSH);
const WHATSAPP_REPLY = event("whatsappReply", PUSH);
/** El cliente marcó «Ya llegué» en el kiosco de la sede. */
const CLIENT_ARRIVED = event("clientArrived", PUSH);
const NO_SHOW = event("appointmentNoShow", PUSH);
const CASH = [event("registerDifference", PUSH), event("registerOpen", PUSH), event("payrollDue", PUSH)];
const VACATION_DECIDED = [event("vacationApproved", PUSH), event("vacationDenied", PUSH)];

export const NOTIFICATION_CATALOG: Readonly<Record<NotificationAudience, readonly NotificationGroup[]>> = {
  admin: [
    group("clients", [...CLIENT_IMPORT, event("badReview", PUSH), ...CLIENT_STATES, event("clientBlocked", PUSH), WHATSAPP_FAILED, WHATSAPP_REPLY]),
    group("products", [...STOCK, ...PRODUCT_IMPORT]),
    group("calendar", [BOOKING_ONLINE, ...APPOINTMENT_CHANGES, NO_SHOW, CLIENT_ARRIVED, event("barberOccupancy", PUSH, { unit: "percent", default: 90 }), SHOP_OCCUPANCY, ...TIME_OFF]),
    group("cash", CASH),
    group("metrics", [...METRICS_HEALTH, ...RETENTION]),
    group("reports", REPORTS),
  ],
  barberCommission: [group("appointments", [BOOKING_ONLINE, ...APPOINTMENT_CHANGES, NO_SHOW, CLIENT_ARRIVED, event("appointmentNewClient", PUSH), REMINDER]), group("calendar", [...BARBER_DAY, ...VACATION_DECIDED]), group("pay", [event("payrollPaid", PUSH)]), group("metrics", METRICS_HEALTH)],
  barberRent: [group("clients", [...CLIENT_IMPORT, ...CLIENT_STATES]), group("appointments", [BOOKING_ONLINE, ...APPOINTMENT_CHANGES, NO_SHOW, CLIENT_ARRIVED, event("appointmentNewClient", PUSH), REMINDER]), group("calendar", [...BARBER_DAY, ...VACATION_DECIDED]), group("pay", [event("payrollPaid", PUSH)]), group("metrics", METRICS_HEALTH)],
  frontDesk: [group("appointments", [BOOKING_ONLINE, ...APPOINTMENT_CHANGES, NO_SHOW, CLIENT_ARRIVED, WHATSAPP_FAILED, WHATSAPP_REPLY]), group("calendar", [event("waitlistJoined", PUSH), event("barberBlocked", PUSH), event("vacationApprovedTeam", PUSH), ...VACATION_DECIDED]), group("cash", [event("registerOpen", PUSH)])],
  owner: [
    group("clients", [...CLIENT_IMPORT, event("clientBlocked", PUSH), event("badReview", PUSH), WHATSAPP_FAILED, WHATSAPP_REPLY]),
    group("products", [...STOCK, ...PRODUCT_IMPORT, event("giftcardImportFailed", PUSH), event("giftcardImportDone", PUSH)]),
    group("calendar", [BOOKING_ONLINE, ...APPOINTMENT_CHANGES, NO_SHOW, CLIENT_ARRIVED, SHOP_OCCUPANCY, ...TIME_OFF]),
    group("cash", CASH),
    group("metrics", [...METRICS_HEALTH, ...RETENTION]),
    group("reports", REPORTS),
  ],
  clients: [group("appointments", [event("bookingConfirmed", CLIENT_MESSAGE), event("bookingRescheduled", CLIENT_MESSAGE), event("bookingCancelled", EMAIL_SMS), event("bookingReminder", CLIENT_MESSAGE), event("bookingMissed", EMAIL_SMS), event("giftcardReceived", EMAIL_SMS), event("proactiveBooking", EMAIL_SMS)])],
};

export const AUDIENCES: readonly NotificationAudience[] = ["owner", "admin", "frontDesk", "barberCommission", "barberRent", "clients"];

export const toggleKey = (audience: NotificationAudience, eventId: string, channel: NotificationChannel): string => `${audience}.${eventId}.${channel}`;
export const thresholdKey = (audience: NotificationAudience, eventId: string): string => `${audience}.${eventId}`;

/** Todos los ids de evento del catálogo, sin repetir: para el diccionario y las pruebas. */
export const ALL_EVENT_IDS: readonly string[] = [...new Set(Object.values(NOTIFICATION_CATALOG).flatMap((groups) => groups.flatMap((item) => item.events.map((entry) => entry.id))))];
export const ALL_GROUP_IDS: readonly string[] = [...new Set(Object.values(NOTIFICATION_CATALOG).flatMap((groups) => groups.map((item) => item.id)))];

/** De qué rol de la barbería es cada pestaña de destinatario. */
export const AUDIENCE_OF_ROLE = { owner: "owner", admin: "admin", recepcion: "frontDesk", "barbero-comision": "barberCommission", "barbero-renta": "barberRent" } as const satisfies Record<string, NotificationAudience>;

/** El evento del catálogo que corresponde a cada aviso de la campana. */
export function eventOfNotification(kind: string, status?: unknown): string | null {
  const map: Record<string, string> = {
    onlineBooking: "bookingOnline",
    cancelled: "appointmentCancelled",
    noShow: "appointmentNoShow",
    whatsappFailed: "whatsappFailed",
    whatsappReply: "whatsappReply",
    clientArrived: "clientArrived",
    waitlistJoined: "waitlistJoined",
    lowStock: "productLow",
    outOfStock: "productOut",
    registerDifference: "registerDifference",
    registerOpen: "registerOpen",
    payrollDue: "payrollDue",
    payrollPaid: "payrollPaid",
    lowReview: "badReview",
    absenceRequested: "vacationRequested",
  };
  if (kind === "absenceDecided") return status === "approved" ? "vacationApproved" : "vacationDenied";
  return map[kind] ?? null;
}
