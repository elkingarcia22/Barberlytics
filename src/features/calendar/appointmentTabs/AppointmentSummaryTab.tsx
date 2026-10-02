import { format } from "date-fns";
import { CalendarClock, Flag, HeartHandshake, Lock, Route, UserCheck } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { calendarLocale } from "@/components/date/calendarLocale";
import { DrawerSection } from "@/components/overlays";
import { Stepper } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Text } from "@/components/typography";
import { ClientTypeBadge, DetailRow } from "../calendarShared";
import {
  JOURNEY,
  appointmentRange,
  appointmentStart,
  findBarber,
  findClient,
  isUnpaid,
  nextStep,
  servicesMinutes,
  servicesOf,
  servicesPrice,
  type ModelContext,
} from "../calendarModel";
import { CLIENT_TYPE_KEYS, PAYMENT_METHOD_KEYS, type Appointment, type AppointmentStatus } from "../types";

/**
 * Resumen: lo que toca hacer ahora, el recorrido del cliente, la cita tal
 * cual se agendó y la fidelidad al barbero. Cuatro tarjetas con la misma
 * anatomía; cambia el icono, el tono y el texto.
 */

export interface AppointmentSummaryTabProps {
  appointment: Appointment;
  ctx: ModelContext;
  onStatus: (appointment: Appointment, status: AppointmentStatus) => void;
  onPay: (appointment: Appointment) => void;
  onDuration: (appointment: Appointment, minutes: number) => void;
}

const DURATIONS = [15, 30, 45, 60, 75, 90, 105, 120, 150, 180];

export function AppointmentSummaryTab({ appointment, ctx, onStatus, onPay, onDuration }: AppointmentSummaryTabProps) {
  const t = useAppT();
  const { locale, formatDate } = useLocale();
  const client = findClient(ctx.catalog, appointment.clientId);
  const barber = findBarber(ctx.catalog, appointment.barberId);
  const requested = findBarber(ctx.catalog, appointment.requestedBarberId);
  const manager = findBarber(ctx.catalog, client?.preferredBarberId ?? null);
  const services = servicesOf(ctx.catalog, appointment);
  const price = servicesPrice(services);
  const step = nextStep(appointment.status);
  const unpaid = isUnpaid(appointment);
  const firstName = (client?.name ?? t("calendar.clientType.walkin")).split(" ")[0];
  const dayLabel = format(appointmentStart(appointment), "dd/MMM/yyyy", { locale: calendarLocale(locale) }).toUpperCase();

  const nextText =
    appointment.status === "scheduled"
      ? t("calendar.next.notArrived", { name: firstName })
      : appointment.status === "arrived"
        ? t("calendar.next.arrived", { name: firstName })
        : appointment.status === "seated"
          ? t("calendar.next.seated", { name: firstName })
          : appointment.status === "paid"
            ? t("calendar.next.paid", { date: appointment.payment ? formatDate(new Date(appointment.payment.paidAt), { day: "numeric", month: "short" }) : "—", method: appointment.payment ? t(PAYMENT_METHOD_KEYS[appointment.payment.method]) : "—" })
            : appointment.status === "no_show"
              ? t("calendar.next.noShow")
              : t("calendar.next.cancelled");

  const journeyIndex = client ? Math.max(0, JOURNEY.indexOf(client.type)) : -1;

  return (
    <div className="space-y-3">
      <DrawerSection icon={Flag} tone="brand" title={t("calendar.section.nextStep")} hint={t("calendar.section.nextStepHint")}>
        <div className="space-y-3">
          <Text>{nextText}</Text>
          {unpaid && (
            <div className="flex flex-col gap-2">
              {step && step.status !== "paid" && (
                <Button onClick={() => onStatus(appointment, step.status)} data-testid="appointment-next-step">
                  {t("calendar.detail.stepWithPrice", { label: t(step.labelKey), price: ctx.formatMoney(price) })}
                </Button>
              )}
              <Button variant={step && step.status !== "paid" ? "outline" : "default"} onClick={() => onPay(appointment)} data-testid="appointment-pay">
                {t("calendar.detail.payAppointment")}
              </Button>
            </div>
          )}
        </div>
      </DrawerSection>

      <DrawerSection icon={Route} tone="positive" title={t("calendar.section.journey")} hint={t("calendar.section.journeyHint")}>
        {client && client.type !== "walkin" ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ClientTypeBadge type={client.type} />
                <Text variant="muted">{t("calendar.journey.visitsHere", { count: client.visits })}</Text>
              </div>
              <Text variant="small" tone="secondary">
                {t("calendar.journey.visitNumber", { count: client.visits + (appointment.status === "paid" ? 0 : 1) })}
              </Text>
            </div>
            <Stepper size="sm" current={journeyIndex} steps={JOURNEY.map((type) => ({ id: type, label: t(CLIENT_TYPE_KEYS[type]) }))} />
          </div>
        ) : (
          <Text variant="muted">{t("calendar.journey.walkIn")}</Text>
        )}
      </DrawerSection>

      <DrawerSection icon={CalendarClock} tone="neutral" title={t("calendar.section.appointment", { date: dayLabel })} hint={t("calendar.section.appointmentHint")}>
        <div>
          <DetailRow label={t("calendar.field.client")}>{client?.name ?? t("calendar.clientType.walkin")}</DetailRow>
          <DetailRow label={t("calendar.field.service")}>
            {services.map((service) => `${service.name} · ${t("calendar.field.minutes", { count: service.durationMin })}`).join(" + ")}
          </DetailRow>
          <DetailRow label={t("calendar.field.barber")}>{barber?.name ?? "—"}</DetailRow>
          <DetailRow label={t("calendar.field.datetime")}>{appointmentRange(appointment, ctx.intl)}</DetailRow>
          <DetailRow label={t("calendar.field.duration")}>
            {unpaid ? (
              <Select value={String(appointment.durationMin)} onValueChange={(value) => onDuration(appointment, Number(value))}>
                <SelectTrigger size="sm" className="w-28" aria-label={t("calendar.detail.changeDuration")} data-testid="appointment-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[...new Set([...DURATIONS, appointment.durationMin])].sort((a, b) => a - b).map((minutes) => (
                    <SelectItem key={minutes} value={String(minutes)}>
                      {t("calendar.field.minutes", { count: minutes })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              t("calendar.field.minutes", { count: appointment.durationMin })
            )}
          </DetailRow>
          <DetailRow label={t("calendar.field.price")} strong>
            {ctx.formatMoney(price)}
          </DetailRow>
          <div className="flex items-center justify-between pt-3">
            <Text variant="muted">{t("calendar.field.total", { count: services.length, minutes: servicesMinutes(services) })}</Text>
            <Text weight="semibold" tabular>
              {ctx.formatMoney(price)}
            </Text>
          </div>
        </div>
      </DrawerSection>

      <DrawerSection
        icon={HeartHandshake}
        tone="warning"
        title={t("calendar.section.loyalty")}
        hint={t("calendar.section.loyaltyHint")}
        action={
          <span className="inline-flex items-center gap-1 text-xs text-text-muted">
            <Lock className="size-3.5" aria-hidden="true" /> {t("calendar.loyalty.auto")}
          </span>
        }
      >
        <div className="space-y-3">
          {manager && (
            <div className="flex items-start gap-3 rounded-lg bg-surface-subtle p-3">
              <UserCheck className="mt-0.5 size-5 shrink-0 text-text-secondary" aria-hidden="true" />
              <div>
                <Text weight="semibold">{t("calendar.loyalty.managedBy", { name: manager.name })}</Text>
                {manager.id !== appointment.barberId && <Text variant="muted">{t("calendar.loyalty.managedByOther", { name: manager.name })}</Text>}
              </div>
            </div>
          )}
          <div>
            <DetailRow label={t("calendar.loyalty.requested")} strong>
              {requested?.name ?? t("calendar.loyalty.noPreference")}
            </DetailRow>
            {barber && client && client.type !== "walkin" && (
              <DetailRow label={t("calendar.loyalty.withBarber", { name: barber.name.split(" ")[0] })} strong>
                {t("calendar.loyalty.visitsWith", { count: Math.max(1, Math.round(client.visits * (manager?.id === barber.id ? 0.7 : 0.25))), total: client.visits })}
              </DetailRow>
            )}
            {client && client.type !== "walkin" && (
              <DetailRow label={t("calendar.loyalty.otherBarbers")} strong>
                {Math.min(ctx.catalog.barbers.length - 1, Math.max(0, Math.round(client.visits / 10)))}
              </DetailRow>
            )}
          </div>
        </div>
      </DrawerSection>
    </div>
  );
}
