import * as React from "react";
import { format } from "date-fns";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { calendarLocale } from "@/components/date/calendarLocale";
import { SelectableRow } from "@/components/selection";
import { TimeSlotPicker, formatClock } from "@/components/scheduling";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { appointmentStart, durationLabel, servicesMinutes, servicesPrice, toLocalIso, type ModelContext } from "../calendarModel";
import { PersonAvatar, ProductThumb, ServiceThumb } from "../calendarShared";
import type { Appointment, AppointmentPatch } from "../types";
import { BarberRequestField } from "./BarberRequest";
import { InlineList, PanelField } from "./bookingStyle";
import { useFreeSlots } from "./useFreeSlots";
import type { AppointmentModel } from "./useAppointmentModel";

/**
 * La cita como en «Arma tu cita» de la reserva en línea: servicios, barbero y
 * día y hora, cada uno un campo con foto que abre su lista en su sitio. Se
 * cambia mientras no ha ingresado; después, para el barbero de comisión, el
 * barbero y la hora quedan con candado (dueño, administrador, recepción y
 * renta la siguen cambiando) y los servicios se pueden sumar hasta cobrar, que es cuando se pide «y de paso la barba». Al final, el
 * comentario y la foto del corte para el barbero, también como tarjeta.
 */

type Field = "services" | "barber" | "when" | "request";

export interface AppointmentFieldsProps {
  model: AppointmentModel;
  ctx: ModelContext;
  onPatch: (appointment: Appointment, patch: AppointmentPatch) => void;
}

export function AppointmentFields({ model, ctx, onPatch }: AppointmentFieldsProps) {
  const t = useAppT();
  const { locale } = useLocale();
  const [open, setOpen] = React.useState<Field | null>(null);
  const { appointment, services, barber } = model;
  const start = appointmentStart(appointment);
  // El barbero y la hora se cambian mientras no ha llegado; después, solo el barbero de comisión los ve con candado.
  const notStarted = appointment.status === "scheduled" || (model.unpaid && !(ctx.access?.locksAfterCheckIn ?? false));
  const canAddServices = model.unpaid;
  const toggle = (field: Field) => setOpen((current) => (current === field ? null : field));
  const close = () => setOpen(null);
  const day = format(start, "EEE d 'de' MMM", { locale: calendarLocale(locale) });
  const lockedHint = t("calendar.panel.fields.locked");

  return (
    <div className="flex flex-col gap-2">
      <PanelField
        eyebrow={t("calendar.panel.fields.services")}
        value={services.map((service) => service.name).join(" + ") || "—"}
        detail={`${durationLabel(appointment.durationMin)} · ${ctx.formatMoney(servicesPrice(services))}`}
        imageUrl={services[0]?.imageUrl}
        icon="scissors"
        open={open === "services"}
        onOpen={canAddServices ? () => toggle("services") : undefined}
        testId="panel-field-services"
      />
      {open === "services" && <ServicesList model={model} ctx={ctx} onPatch={onPatch} onClose={close} />}
      {/* Los productos de la cita (los que se pidieron al reservar en línea o se sumaron en caja), uno por tarjeta. */}
      {appointment.products.map((line) => {
        const product = ctx.catalog.products.find((entry) => entry.id === line.productId);
        if (!product) return null;
        return (
          <PanelField
            key={line.productId}
            eyebrow={t("calendar.panel.fields.product")}
            value={product.name}
            detail={`× ${line.qty} · ${ctx.formatMoney(product.price * line.qty)}`}
            leading={<ProductThumb product={product} size="md" tone="neutral" />}
            testId="panel-field-product"
          />
        );
      })}
      <PanelField
        eyebrow={t("calendar.panel.fields.barber")}
        value={barber?.name ?? "—"}
        detail={model.requested?.id === barber?.id ? t("calendar.panel.fields.requested") : t("calendar.panel.fields.assigned")}
        leading={<PersonAvatar name={barber?.name ?? ""} avatarUrl={barber?.avatarUrl} />}
        round
        open={open === "barber"}
        onOpen={notStarted ? () => toggle("barber") : undefined}
        locked={!notStarted}
        lockedHint={lockedHint}
        testId="panel-field-barber"
      />
      {open === "barber" && <BarberList model={model} ctx={ctx} onPatch={onPatch} onClose={close} />}
      <PanelField
        eyebrow={t("calendar.panel.fields.when")}
        value={`${day.charAt(0).toUpperCase()}${day.slice(1)} · ${formatClock(start, ctx.intl)}`}
        detail={durationLabel(appointment.durationMin)}
        icon="calendar"
        open={open === "when"}
        onOpen={notStarted ? () => toggle("when") : undefined}
        locked={!notStarted}
        lockedHint={lockedHint}
        testId="panel-field-when"
      />
      {open === "when" && <WhenList model={model} ctx={ctx} onPatch={onPatch} onClose={close} />}
      <BarberRequestField model={model} onPatch={onPatch} open={open === "request"} onToggle={() => toggle("request")} />
    </div>
  );
}

function ServicesList({ model, ctx, onPatch, onClose }: { model: AppointmentModel; ctx: ModelContext; onPatch: AppointmentFieldsProps["onPatch"]; onClose: () => void }) {
  const t = useAppT();
  const [picked, setPicked] = React.useState<string[]>(model.appointment.serviceIds);
  const chosen = ctx.catalog.services.filter((service) => picked.includes(service.id));
  const toggle = (id: string) => setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  const apply = () => {
    onPatch(model.appointment, { serviceIds: picked, durationMin: servicesMinutes(chosen) });
    onClose();
  };
  return (
    <InlineList
      title={t("calendar.panel.fields.servicesTitle")}
      description={t("calendar.panel.fields.servicesHint")}
      onClose={onClose}
      footer={
        <>
          <span className="flex min-w-0 flex-1 flex-col">
            <Text size="xs" tone="muted">
              {t("calendar.panel.fields.servicesCount", { count: chosen.length, minutes: servicesMinutes(chosen) })}
            </Text>
            <Text weight="semibold" tabular>
              {ctx.formatMoney(servicesPrice(chosen))}
            </Text>
          </span>
          <Button onClick={apply} disabled={chosen.length === 0} data-testid="panel-services-apply">
            {t("calendar.panel.fields.apply")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-2" role="group">
        {ctx.catalog.services.map((service) => (
          <SelectableRow key={service.id} role="checkbox" checked={picked.includes(service.id)} label={service.name} leading={<ServiceThumb service={service} size="md" />} onClick={() => toggle(service.id)}>
            <span className="flex flex-col">
              <Text as="span" weight="medium">
                {service.name}
              </Text>
              <Text as="span" size="xs" tone="muted" tabular>
                {durationLabel(service.durationMin)} · {ctx.formatMoney(service.price)}
              </Text>
            </span>
          </SelectableRow>
        ))}
      </div>
    </InlineList>
  );
}

function BarberList({ model, ctx, onPatch, onClose }: { model: AppointmentModel; ctx: ModelContext; onPatch: AppointmentFieldsProps["onPatch"]; onClose: () => void }) {
  const t = useAppT();
  const pick = (barberId: string) => {
    if (barberId !== model.appointment.barberId) onPatch(model.appointment, { barberId });
    onClose();
  };
  return (
    <InlineList title={t("calendar.panel.fields.barberTitle")} description={t("calendar.panel.fields.barberHint")} onClose={onClose}>
      <div className="flex flex-col gap-2" role="radiogroup">
        {ctx.catalog.barbers.map((barber) => (
          <SelectableRow key={barber.id} role="radio" checked={barber.id === model.appointment.barberId} label={barber.name} leading={<PersonAvatar name={barber.name} avatarUrl={barber.avatarUrl} />} onClick={() => pick(barber.id)}>
            <span className="flex flex-col">
              <Text as="span" weight="medium">
                {barber.name}
              </Text>
              {barber.level && (
                <Text as="span" size="xs" tone="muted">
                  {barber.level}
                </Text>
              )}
            </span>
          </SelectableRow>
        ))}
      </div>
    </InlineList>
  );
}

function WhenList({ model, ctx, onPatch, onClose }: { model: AppointmentModel; ctx: ModelContext; onPatch: AppointmentFieldsProps["onPatch"]; onClose: () => void }) {
  const t = useAppT();
  const { locale } = useLocale();
  const now = ctx.now ?? new Date();
  const start = appointmentStart(model.appointment);
  const [value, setValue] = React.useState<Date | null>(null);
  // La duración la ponen los servicios: aquí solo se mueve la cita a otro día u hora.
  const slots = useFreeSlots({ branchId: model.appointment.branchId, barber: model.barber, durationMin: model.appointment.durationMin, initialDay: start, now, excludeId: model.appointment.id });
  const label = value ? `${format(value, "EEE d 'de' MMM", { locale: calendarLocale(locale) })} · ${formatClock(value, ctx.intl)}` : "";
  const apply = () => {
    if (!value) return;
    onPatch(model.appointment, { start: toLocalIso(value) });
    onClose();
  };
  const buttonLabel = value ? t("calendar.panel.fields.moveTo", { when: label }) : t("calendar.panel.fields.pickTime");
  return (
    <InlineList
      title={t("calendar.panel.fields.whenTitle")}
      description={t("calendar.panel.fields.whenHint", { name: model.barber?.name.split(" ")[0] ?? "" })}
      onClose={onClose}
      footer={
        <Button className="flex-1" onClick={apply} disabled={!value} data-testid="panel-when-apply">
          {buttonLabel}
        </Button>
      }
    >
      <TimeSlotPicker value={value} onChange={setValue} startDate={now} day={slots.day} onDayChange={slots.setDay} isDayDisabled={slots.isDayDisabled} isSlotDisabled={slots.isSlotDisabled} hideUnavailable loading={slots.loading} slotMinutes={15} />
    </InlineList>
  );
}
