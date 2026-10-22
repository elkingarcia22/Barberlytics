import * as React from "react";
import { format, isSameDay } from "date-fns";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { PanelFooter, SidePanelShell } from "@/components/overlays";
import { Field } from "@/components/forms";
import { DatePicker } from "@/components/date";
import { SelectableRow } from "@/components/selection";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemaIcon } from "@/icons";
import { ClientAvatar, PersonAvatar, ServiceThumb } from "./calendarShared";
import { atMinutes, formatClock, minutesOfDay } from "@/components/scheduling";
import { clockLabel, halfHourOptions, useOpenKey } from "./calendarFormat";
import { durationLabel, nextFreeMinute, type ModelContext } from "./calendarModel";
import { useCreateAppointment } from "./queries";
import { useBranchId } from "@/features/team/teamUtils";
import { useLineupTurn } from "@/features/team/workforce";
import { CLIENT_TYPE_KEYS, type Appointment, type CalendarDay } from "./types";
import { InlineList, PanelField, PanelQuestion } from "./appointmentPanel/bookingStyle";
import { ClientPicker } from "./createAppointment/ClientPicker";
import { useWhenLabel } from "./createAppointment/createModel";
import { barberPrice } from "./createAppointment/useCreateDraft";
import { SaleCard, SaleCardHead } from "./saleParts";

/**
 * Venta sin cita: registrar un servicio que ya se hizo sin agendar —quién vino, qué se hizo, con
 * quién y cuándo— para que cuente en ventas y en la comisión. Con la cara de «Crear cita»: la tarjeta
 * con la hora arriba, cada dato un campo que abre su lista en su sitio y un solo botón; al crearla
 * se abre el cobro.
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

type SaleField = "client" | "services" | "barber" | "start";

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
  const when = useWhenLabel();
  const create = useCreateAppointment();
  const nowDate = now ?? new Date();
  const walkInClient = ctx.catalog.clients.find((client) => client.type === "walkin");
  const [day, setDay] = React.useState<Date | null>(date);
  const [time, setTime] = React.useState(roundedClock(nowDate));
  const [clientId, setClientId] = React.useState(walkInClient?.id ?? "");
  const [serviceIds, setServiceIds] = React.useState<string[]>([]);
  // Lo que se hizo es lo único sin valor de entrada: se abre primero.
  const [openField, setOpenField] = React.useState<SaleField | null>("services");
  const toggle = (field: SaleField) => setOpenField((current) => (current === field ? null : field));

  // Quien llega sin cita va a quien le toca en la fila de Equipo (el que menos lleva hoy y está
  // libre); sin fila, al primero que quede libre.
  const today = isSameDay(date, nowDate);
  const turn = useLineupTurn(useBranchId(), "walkIn", open && today);
  const turnOrder = turn.data?.items.map((item) => item.memberId) ?? [];
  const turnIndex = (id: string) => (turnOrder.indexOf(id) === -1 ? Number.MAX_SAFE_INTEGER : turnOrder.indexOf(id));
  const ranked = ctx.catalog.barbers
    .map((barber) => ({ barber, free: agenda && today ? nextFreeMinute(barber, date, agenda.appointments, agenda.blocks, minutesOfDay(nowDate)) : null }))
    .sort((a, b) => turnIndex(a.barber.id) - turnIndex(b.barber.id) || (a.free ?? Infinity) - (b.free ?? Infinity));
  const firstFree = ranked.find((item) => item.free !== null && item.barber.acceptsWalkIns)?.barber.id ?? "";
  const [picked, setBarberId] = React.useState<string | null>(null);
  const barberId = picked ?? turn.data?.next ?? firstFree;
  const next = turn.data?.items.find((item) => item.memberId === turn.data?.next);

  const client = ctx.catalog.clients.find((item) => item.id === clientId);
  const barber = ctx.catalog.barbers.find((item) => item.id === barberId);
  const services = ctx.catalog.services.filter((service) => serviceIds.includes(service.id));
  const minutes = services.reduce((sum, service) => sum + service.durationMin, 0);
  const price = barberPrice(barber, services);
  const [hour, minute] = time.split(":").map(Number);
  const start = day ? new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute) : null;
  const missing = services.length === 0 ? "calendar.walkInSale.missingService" : !barberId ? "calendar.walkInSale.missingBarber" : !start ? "calendar.walkInSale.missingStart" : null;

  const submit = () => {
    if (!day || services.length === 0 || !barberId) return;
    create.mutate(
      { clientId, barberId, serviceIds, start: `${format(day, "yyyy-MM-dd")}T${time}`, walkIn: true, repeat: "none", requestedBarberId: null },
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
    <SidePanelShell open={open} onOpenChange={onOpenChange} size="lg" title={t("calendar.walkInSale.title")}>
      <div data-testid="walk-in-sale-drawer">
        <SaleCard testId="walk-in-sale-cards">
          <SaleCardHead
            eyebrow={t("calendar.walkInSale.title")}
            title={start ? when(start, nowDate, ctx.intl) : t("calendar.createV.noTimeYet")}
            lead={barber && services.length > 0 ? t("calendar.createV.withBarber", { name: barber.name, duration: durationLabel(minutes) }) : t("calendar.walkInSale.lead")}
          />

          <PanelQuestion title={t("calendar.walkInSale.who")}>
            <PanelField
              eyebrow={t("calendar.panel.fields.client")}
              value={client ? (client.type === "walkin" ? t("calendar.walkInSale.walkInClient") : client.name) : ""}
              placeholder={t("calendar.create.pickClient")}
              detail={client ? (client.type === "walkin" ? t("calendar.panel.client.walkInHint") : `${t(CLIENT_TYPE_KEYS[client.type])} · ${client.phone}`) : undefined}
              leading={client ? <ClientAvatar client={client.type === "walkin" ? undefined : client} name={client.type === "walkin" ? t("calendar.walkInSale.walkInClient") : undefined} /> : undefined}
              icon="users"
              round
              open={openField === "client"}
              onOpen={() => toggle("client")}
              testId="walk-in-sale-client"
            />
            {openField === "client" && (
              <ClientPicker
                clients={ctx.catalog.clients}
                selectedId={clientId}
                pinned={walkInClient}
                onPick={(id) => {
                  setClientId(id);
                  setOpenField(services.length === 0 ? "services" : null);
                }}
                onClose={() => setOpenField(null)}
              />
            )}
          </PanelQuestion>

          <PanelQuestion title={t("calendar.walkInSale.what")}>
            <div className="flex flex-col gap-2">
              <PanelField
                eyebrow={t("calendar.panel.fields.services")}
                value={services.map((service) => service.name).join(" + ")}
                placeholder={t("calendar.create.pickService")}
                detail={services.length > 0 ? `${durationLabel(minutes)} · ${ctx.formatMoney(price)}` : undefined}
                imageUrl={services[0]?.imageUrl}
                icon="scissors"
                open={openField === "services"}
                onOpen={() => toggle("services")}
                testId="walk-in-sale-services"
              />
              {openField === "services" && (
                <InlineList
                  title={t("calendar.panel.fields.servicesTitle")}
                  description={t("calendar.panel.fields.servicesHint")}
                  onClose={() => setOpenField(null)}
                  footer={
                    <>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <Text size="xs" tone="muted">
                          {t("calendar.panel.fields.servicesCount", { count: services.length, minutes })}
                        </Text>
                        <Text weight="semibold" tabular>
                          {ctx.formatMoney(price)}
                        </Text>
                      </span>
                      <Button onClick={() => setOpenField(null)} disabled={services.length === 0} data-testid="walk-in-sale-services-done">
                        {t("calendar.createV.done")}
                      </Button>
                    </>
                  }
                >
                  <div className="flex flex-col gap-2" role="group">
                    {ctx.catalog.services.map((service) => (
                      <SelectableRow
                        key={service.id}
                        role="checkbox"
                        checked={serviceIds.includes(service.id)}
                        label={service.name}
                        leading={<ServiceThumb service={service} size="md" />}
                        onClick={() => setServiceIds((current) => (current.includes(service.id) ? current.filter((id) => id !== service.id) : [...current, service.id]))}
                      >
                        <span className="flex flex-col">
                          <Text as="span" weight="medium">
                            {service.name}
                          </Text>
                          <Text as="span" size="xs" tone="muted" tabular>
                            {durationLabel(service.durationMin)} · {ctx.formatMoney(barberPrice(barber, [service]))}
                          </Text>
                        </span>
                      </SelectableRow>
                    ))}
                  </div>
                </InlineList>
              )}

              <PanelField
                eyebrow={t("calendar.panel.fields.barber")}
                value={barber?.name ?? ""}
                placeholder={t("calendar.create.pickBarber")}
                detail={barber && next?.memberId === barber.id ? t("calendar.walkInSale.turnShort", { count: next.count }) : (barber?.level ?? undefined)}
                leading={barber ? <PersonAvatar name={barber.name} avatarUrl={barber.avatarUrl} /> : undefined}
                icon="users"
                round
                open={openField === "barber"}
                onOpen={() => toggle("barber")}
                testId="walk-in-sale-barber"
              />
              {openField === "barber" && (
                <InlineList title={t("calendar.panel.fields.barberTitle")} description={next ? t("calendar.walkInSale.turn", { name: next.name, count: next.count }) : undefined} onClose={() => setOpenField(null)}>
                  <div className="flex flex-col gap-2" role="radiogroup">
                    {ranked.map(({ barber: item, free }) => (
                      <SelectableRow
                        key={item.id}
                        role="radio"
                        checked={item.id === barberId}
                        label={item.name}
                        leading={<PersonAvatar name={item.name} avatarUrl={item.avatarUrl} />}
                        onClick={() => {
                          setBarberId(item.id);
                          setOpenField(null);
                        }}
                      >
                        <span className="flex flex-col">
                          <Text as="span" weight="medium">
                            {item.name}
                          </Text>
                          <Text as="span" size="xs" tone="muted" tabular>
                            {[next?.memberId === item.id ? t("calendar.walkInSale.turnShort", { count: next.count }) : null, free !== null ? t("calendar.resource.free", { time: formatClock(atMinutes(date, free), ctx.intl) }) : null, services.length > 0 ? ctx.formatMoney(barberPrice(item, services)) : null].filter(Boolean).join(" · ")}
                          </Text>
                        </span>
                      </SelectableRow>
                    ))}
                  </div>
                </InlineList>
              )}

              <PanelField
                eyebrow={t("calendar.panel.fields.when")}
                value={start ? when(start, nowDate, ctx.intl) : ""}
                placeholder={t("calendar.createV.pickTime")}
                detail={services.length > 0 ? durationLabel(minutes) : undefined}
                icon="calendar"
                open={openField === "start"}
                onOpen={() => toggle("start")}
                testId="walk-in-sale-when"
              />
              {openField === "start" && <WhenPicker day={day} time={time} onDay={setDay} onTime={setTime} intl={ctx.intl} onClose={() => setOpenField(null)} />}
            </div>
          </PanelQuestion>

          <PanelFooter>
            {services.length > 0 && (
              <div className="flex items-baseline justify-between gap-3">
                <Text size="sm" tone="muted">
                  {t("calendar.createV.totalLine", { count: services.length, duration: durationLabel(minutes) })}
                </Text>
                <Text size="lg" weight="semibold" tabular>
                  {ctx.formatMoney(price)}
                </Text>
              </div>
            )}
            <Button size="lg" className="w-full" onClick={submit} disabled={Boolean(missing) || create.isPending} data-testid="walk-in-sale-submit">
              {!missing && <ThemaIcon name="check" />}
              {missing ? t(missing) : t("calendar.walkInSale.submitAt", { when: when(start!, nowDate, ctx.intl) })}
            </Button>
          </PanelFooter>
        </SaleCard>
      </div>
    </SidePanelShell>
  );
}

/** Cuándo fue: el día y la hora, en la lista que se abre bajo el campo. */
function WhenPicker({ day, time, onDay, onTime, intl, onClose }: { day: Date | null; time: string; onDay: (day: Date | null) => void; onTime: (time: string) => void; intl: string; onClose: () => void }) {
  const t = useAppT();
  const { current } = useLocale();
  return (
    <InlineList title={t("calendar.walkInSale.whenTitle")} onClose={onClose}>
      <div className="grid gap-3 px-1 sm:grid-cols-2">
        <DatePicker label={t("calendar.walkInSale.date")} value={day} onChange={(value) => onDay(value ?? null)} locale={current.intl} />
        <Field label={t("calendar.walkInSale.time")}>
          <Select value={time} onValueChange={onTime}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HOURS.map((hour) => (
                <SelectItem key={hour} value={hour}>
                  {clockLabel(hour, intl)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
    </InlineList>
  );
}
