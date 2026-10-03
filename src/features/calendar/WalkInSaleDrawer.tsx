import * as React from "react";
import { format, isSameDay } from "date-fns";
import { Footprints } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { DrawerSection, SidePanelShell } from "@/components/overlays";
import { Field, SearchableSelect } from "@/components/forms";
import { DatePicker } from "@/components/date";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PersonAvatar } from "./calendarShared";
import { atMinutes, formatClock, minutesOfDay } from "@/components/scheduling";
import { clockLabel, halfHourOptions, useOpenKey } from "./calendarFormat";
import { nextFreeMinute, type ModelContext } from "./calendarModel";
import { useCreateAppointment } from "./queries";
import { CLIENT_TYPE_KEYS, type Appointment, type CalendarDay } from "./types";

/**
 * Venta sin cita: registrar un servicio que ya se hizo sin agendar —fecha,
 * hora, cliente, servicio y barbero— para que cuente en ventas y en la
 * comisión. Al crearla se abre el cobro.
 */

export interface WalkInSaleDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ctx: ModelContext;
  date: Date;
  now?: Date;
  /** La agenda del día: con ella se sabe quién está libre para atender ya. */
  day?: CalendarDay;
  onCreated: (appointment: Appointment) => void;
}

const HOURS = halfHourOptions(6, 24);

const roundedClock = (date: Date): string => {
  const minutes = Math.floor((date.getHours() * 60 + date.getMinutes()) / 30) * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
};

export function WalkInSaleDrawer(props: WalkInSaleDrawerProps) {
  return <WalkInSalePanel key={useOpenKey(props.open)} {...props} />;
}

function WalkInSalePanel({ open, onOpenChange, ctx, date, now, day: agenda, onCreated }: WalkInSaleDrawerProps) {
  const t = useAppT();
  const { current } = useLocale();
  const create = useCreateAppointment();
  const [day, setDay] = React.useState<Date | null>(date);
  const [time, setTime] = React.useState(roundedClock(now ?? new Date()));
  const [clientId, setClientId] = React.useState("cli_walkin");
  const [serviceId, setServiceId] = React.useState("");
  // Quien llega sin cita quiere al primero que quede libre: los barberos salen
  // en ese orden y el más pronto viene ya elegido.
  const nowDate = now ?? new Date();
  const ranked = ctx.catalog.barbers
    .map((barber) => ({ barber, free: agenda && isSameDay(date, nowDate) ? nextFreeMinute(barber, date, agenda.appointments, agenda.blocks, minutesOfDay(nowDate)) : null }))
    .sort((a, b) => (a.free ?? Infinity) - (b.free ?? Infinity));
  const [barberId, setBarberId] = React.useState(() => ranked.find((item) => item.free !== null && item.barber.acceptsWalkIns)?.barber.id ?? "");

  const submit = () => {
    if (!day || !serviceId || !barberId) return;
    create.mutate(
      { clientId, barberId, serviceIds: [serviceId], start: `${format(day, "yyyy-MM-dd")}T${time}`, walkIn: true, repeat: "none", requestedBarberId: null },
      {
        onSuccess: (appointment) => {
          onOpenChange(false);
          onCreated(appointment);
        },
        onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
      }
    );
  };

  return (
    <SidePanelShell
      open={open}
      onOpenChange={onOpenChange}
      title={t("calendar.walkInSale.title")}
      description={t("calendar.walkInSale.hint")}
      actions={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={!day || !serviceId || !barberId || create.isPending} data-testid="walk-in-sale-submit">
            {t("calendar.walkInSale.create")}
          </Button>
        </>
      }
    >
      <DrawerSection icon={Footprints} tone="brand" title={t("calendar.walkInSale.title")} hint={t("calendar.walkInSale.hint")}>
        <div className="space-y-3" data-testid="walk-in-sale-drawer">
          <div className="grid gap-3 sm:grid-cols-2">
            <DatePicker label={t("calendar.walkInSale.date")} value={day} onChange={(value) => setDay(value ?? null)} locale={current.intl} />
            <Field label={t("calendar.walkInSale.time")}>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOURS.map((hour) => (
                    <SelectItem key={hour} value={hour}>
                      {clockLabel(hour, ctx.intl)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label={t("calendar.field.client")} required>
            <SearchableSelect
              value={clientId}
              onValueChange={setClientId}
              placeholder={t("calendar.create.pickClient")}
              options={ctx.catalog.clients.map((client) => ({ value: client.id, label: client.name, description: `${client.phone} · ${t(CLIENT_TYPE_KEYS[client.type])}` }))}
            />
          </Field>
          <Field label={t("calendar.field.service")} required>
            <SearchableSelect
              value={serviceId}
              onValueChange={setServiceId}
              placeholder={t("calendar.create.pickService")}
              options={ctx.catalog.services.map((item) => ({ value: item.id, label: item.name, description: t("calendar.create.durationPrice", { minutes: item.durationMin, price: ctx.formatMoney(item.price) }) }))}
            />
          </Field>
          <Field label={t("calendar.field.barber")} required>
            <Select value={barberId} onValueChange={setBarberId}>
              <SelectTrigger data-testid="walk-in-sale-barber">
                <SelectValue placeholder={t("calendar.create.pickBarber")} />
              </SelectTrigger>
              <SelectContent>
                {ranked.map(({ barber, free }) => (
                  <SelectItem key={barber.id} value={barber.id}>
                    <span className="flex items-center gap-2">
                      <PersonAvatar name={barber.name} avatarUrl={barber.avatarUrl} size="sm" />
                      {barber.name}
                      {free !== null && <span className="text-text-muted">· {t("calendar.resource.free", { time: formatClock(atMinutes(date, free), ctx.intl) })}</span>}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </DrawerSection>
    </SidePanelShell>
  );
}
