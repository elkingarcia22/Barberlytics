import { addDays } from "date-fns";
import { useAppT } from "@/app/i18n";
import { formatClock } from "@/components/scheduling";
import { appointmentEnd, appointmentStart, durationLabel, findBarber, findClient, isUnpaid, lateMinutes, servicesOf, type ModelContext } from "../calendarModel";
import { appointmentPlaybook, type AppointmentActionId, type AppointmentPlaybook } from "../appointmentPlaybook";
import { appointmentInsights, type AppointmentInsight } from "../appointmentInsights";
import { ACTION_LABEL } from "../appointmentActions";
import { appointmentBill } from "../checkoutMath";
import type { CreateAppointmentInitial } from "../CreateAppointmentDrawer";
import { PAYMENT_METHOD_KEYS, type Appointment, type AppointmentStatus, type Barber, type Client, type ClientNote, type Service } from "../types";

/**
 * Lo que todas las versiones del panel de una cita saben de ella: quién es,
 * qué se hace, cuánto vale, qué alertas trae, en qué va y qué toca hacer.
 * Cada versión lo pinta a su manera; el cálculo y las acciones son uno solo.
 */

export interface AppointmentHandlers {
  onStatus: (appointment: Appointment, status: AppointmentStatus) => void;
  onBarberReady: (appointment: Appointment) => void;
  onPay: (appointment: Appointment) => void;
  onRebook: (initial: CreateAppointmentInitial) => void;
  onCancel: (appointment: Appointment) => void;
  onNoShow: (appointment: Appointment) => void;
}

/** La cortesía de la barbería: un corte por cada tantas visitas (la regla del seed de Configuración). */
export const LOYALTY_EVERY = 10;
const LOYALTY_REWARD_SERVICE_ID = "svc_corte";

export interface AppointmentModel {
  appointment: Appointment;
  client: Client | undefined;
  /** El cliente con ficha (no un «sin cita» anónimo). */
  known: Client | undefined;
  clientName: string;
  firstName: string;
  barber: Barber | undefined;
  requested: Barber | undefined;
  services: Service[];
  price: number;
  unpaid: boolean;
  /** Alergias y medicación: lo que no se puede pasar por alto. */
  critical: ClientNote[];
  notes: ClientNote[];
  /** Solo dígitos, para `tel:` y `sms:`; vacío si no hay o el rol no deja contactar. */
  phone: string;
  /** Su correo, si lo dejó y el rol deja contactar; vacío si no. */
  email: string;
  /** Cómo escribirle: por SMS y por correo, con un texto ya puesto si se da. */
  writeLinks: (draft?: WriteDraft) => WriteLink[];
  playbook: AppointmentPlaybook;
  headline: string;
  insights: AppointmentInsight[];
  /** Para cuándo tocaría la próxima visita según su ritmo, contando desde esta. */
  nextVisit: Date | null;
  lastVisit: Date | null;
  /** Visitas que lleva hacia la próxima cortesía (esta incluida si aún no se cobra). */
  loyaltyProgress: number;
  /** Cuándo pasó cada paso, sacado del historial (la hora real, no la agendada). */
  stepTimes: StepTimes;
  /** El servicio que regala la membresía. */
  rewardName: string;
  run: (action: AppointmentActionId) => void;
  /** Llevar la cita a otro estado sin pasar por una acción (deshacer el último paso). */
  setStatus: (status: AppointmentStatus) => void;
  /** Agendar la próxima con lo de esta, en una fecha dada (atajos de semanas, ritmo). */
  rebookOn: (date: Date) => void;
  href: (action: AppointmentActionId) => string | null;
  /** El texto de la acción; cobrar dice cuánto. */
  label: (action: AppointmentActionId) => string;
}

export interface WriteDraft {
  subject: string;
  text: string;
}

export interface WriteLink {
  channel: "sms" | "email";
  href: string;
}

export interface StepTimes {
  arrived: Date | null;
  seated: Date | null;
  paid: Date | null;
}

/** La última vez que la cita pasó a ese estado, según su historial. */
function statusTime(appointment: Appointment, status: AppointmentStatus): Date | null {
  const entry = [...appointment.history].reverse().find((item) => item.event === `status:${status}`);
  return entry ? new Date(entry.at) : null;
}

const digits = (phone: string) => phone.replace(/[^\d+]/g, "");

export function useAppointmentModel(appointment: Appointment, ctx: ModelContext, handlers: AppointmentHandlers): AppointmentModel {
  const t = useAppT();
  const client = findClient(ctx.catalog, appointment.clientId);
  const known = client && client.type !== "walkin" ? client : undefined;
  const clientName = client?.name ?? t("calendar.clientType.walkin");
  const firstName = clientName.split(" ")[0];
  const services = servicesOf(ctx.catalog, appointment);
  // Lo que vale y lo que falta cobrar en caja: con el impuesto de la sucursal y sin lo ya pagado al reservar en línea.
  const bill = appointmentBill(ctx.catalog, appointment.serviceIds, appointment.products, appointment.online, appointment.barberId, appointment);
  const price = appointment.payment?.total ?? bill.total;
  const canContact = ctx.access?.canContact ?? true;
  const phone = known?.phone && canContact ? digits(known.phone) : "";
  const email = known?.email && canContact ? known.email : "";
  const playbook = appointmentPlaybook(appointment, ctx.now, { hasPhone: phone !== "" });
  const lastVisit = known?.lastVisitAt ? new Date(known.lastVisitAt) : null;
  // La próxima se cuenta desde esta cita: es la que se está atendiendo.
  const nextVisit = known?.visitEveryDays ? addDays(appointmentStart(appointment), known.visitEveryDays) : null;
  const visitsCounted = (known?.visits ?? 0) + (appointment.status === "paid" ? 0 : 1);

  const headline = (): string => {
    switch (playbook.stage) {
      case "late":
        return t("calendar.stage.late", { time: durationLabel(lateMinutes(appointment, ctx.now) ?? 0) });
      case "upcoming":
        return t("calendar.next.notArrived", { name: firstName });
      case "waiting":
        return t("calendar.next.arrived", { name: firstName });
      case "seated":
        return t("calendar.stage.seated", { time: formatClock(appointmentEnd(appointment), ctx.intl) });
      case "toCollect":
        return t("calendar.stage.toCollect");
      case "paid":
        return t("calendar.stage.paid", { method: appointment.payment ? t(PAYMENT_METHOD_KEYS[appointment.payment.method]) : "—" });
      case "noShow":
        return t("calendar.next.noShow");
      case "cancelled":
        return t("calendar.next.cancelled");
    }
  };

  const run = (action: AppointmentActionId) => {
    if (action === "checkIn") handlers.onStatus(appointment, "arrived");
    if (action === "seat") handlers.onStatus(appointment, "seated");
    if (action === "pay") handlers.onPay(appointment);
    if (action === "ready") handlers.onBarberReady(appointment);
    if (action === "rebook") handlers.onRebook({ clientId: appointment.clientId, serviceId: appointment.serviceIds[0], barberId: appointment.barberId, start: nextVisit ?? undefined });
    if (action === "noShow") handlers.onNoShow(appointment);
    if (action === "cancel") handlers.onCancel(appointment);
  };

  const href = (action: AppointmentActionId) => (action === "call" ? `tel:${phone}` : action === "message" ? `sms:${phone}` : null);
  const writeLinks = (draft?: WriteDraft): WriteLink[] => [
    ...(phone ? [{ channel: "sms" as const, href: `sms:${phone}${draft ? `?body=${encodeURIComponent(draft.text)}` : ""}` }] : []),
    ...(email ? [{ channel: "email" as const, href: `mailto:${email}${draft ? `?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.text)}` : ""}` }] : []),
  ];

  return {
    appointment,
    client,
    known,
    clientName,
    firstName,
    barber: findBarber(ctx.catalog, appointment.barberId),
    requested: findBarber(ctx.catalog, appointment.requestedBarberId),
    services,
    price,
    unpaid: isUnpaid(appointment),
    critical: client?.notes.filter((note) => note.kind !== "note") ?? [],
    notes: client?.notes.filter((note) => note.kind === "note") ?? [],
    phone,
    email,
    writeLinks,
    playbook,
    headline: headline(),
    insights: appointmentInsights(appointment, client, ctx.catalog),
    nextVisit,
    lastVisit,
    loyaltyProgress: known ? ((visitsCounted - 1) % LOYALTY_EVERY) + 1 : 0,
    stepTimes: {
      arrived: statusTime(appointment, "arrived"),
      seated: statusTime(appointment, "seated"),
      paid: appointment.payment ? new Date(appointment.payment.paidAt) : statusTime(appointment, "paid"),
    },
    rewardName: ctx.catalog.services.find((service) => service.id === LOYALTY_REWARD_SERVICE_ID)?.name ?? t("calendar.panel.loyalty.rewardFallback"),
    run,
    setStatus: (status) => handlers.onStatus(appointment, status),
    rebookOn: (date) => handlers.onRebook({ clientId: appointment.clientId, serviceId: appointment.serviceIds[0], barberId: appointment.barberId, start: date }),
    href,
    label: (action) => (action === "pay" ? t("calendar.detail.payAmount", { price: ctx.formatMoney(bill.due) }) : t(ACTION_LABEL[action])),
  };
}
