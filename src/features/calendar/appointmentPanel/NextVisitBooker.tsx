import * as React from "react";
import { addWeeks, differenceInMinutes, addMinutes, format } from "date-fns";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { calendarLocale } from "@/components/date/calendarLocale";
import { TimeSlotPicker, formatClock } from "@/components/scheduling";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ThemaIcon } from "@/icons";
import { buildRebookLink } from "@/features/booking/rebookLink";
import { appointmentStart, newLinkId, toLocalIso, type ModelContext } from "../calendarModel";
import { useCreateAppointment, useUpdateAppointment } from "../queries";
import type { Appointment } from "../types";
import { useFreeSlots } from "./useFreeSlots";
import type { AppointmentModel } from "./useAppointmentModel";
import { TileRow, type Tile } from "./StageParts";
import { writeMenu } from "./writeChannels";

/**
 * «¿Le agendamos la próxima?»: lo que se le dice al cliente antes de que se
 * vaya. Abre en el día que toca por su ritmo (o a 4 semanas si aún no tiene),
 * con las horas libres de su barbero, y la deja agendada con un toque, con
 * el mismo servicio. Si la visita traía varias citas (enlazadas), se pueden
 * reagendar todas en el mismo orden y quedan enlazadas otra vez. O, si
 * prefiere elegir él, se le manda el enlace de la reserva en línea con todo
 * puesto para que escoja la hora y pague.
 */

/** Sin ritmo todavía, la próxima se propone a este plazo. */
const DEFAULT_WEEKS = 4;

export function NextVisitBooker({ model, ctx, bare = false, group = [] }: { model: AppointmentModel; ctx: ModelContext; /** Sin su título: lo pone afuera quien la usa. */ bare?: boolean; /** Las citas de la misma visita (ella incluida), para reagendarlas juntas. */ group?: readonly Appointment[] }) {
  const t = useAppT();
  const { locale, formatDate } = useLocale();
  const create = useCreateAppointment();
  const update = useUpdateAppointment();
  const now = ctx.now ?? new Date();
  const suggested = model.nextVisit && model.nextVisit > now ? model.nextVisit : addWeeks(appointmentStart(model.appointment), DEFAULT_WEEKS);
  const [value, setValue] = React.useState<Date | null>(null);
  const [booked, setBooked] = React.useState<{ at: Date; count: number } | null>(null);
  const others = group.filter((item) => item.id !== model.appointment.id);
  const [withOthers, setWithOthers] = React.useState(others.length > 0);
  const slots = useFreeSlots({ branchId: model.appointment.branchId, barber: model.barber, durationMin: model.appointment.durationMin, initialDay: suggested, now });
  const firstName = model.barber?.name.split(" ")[0] ?? "";
  const when = (date: Date) => `${format(date, "EEE d 'de' MMM", { locale: calendarLocale(locale) })}, ${formatClock(date, ctx.intl)}`;

  const book = async () => {
    if (!value) return;
    const base = appointmentStart(model.appointment);
    // Las demás citas de la visita, a la misma distancia de esta que tenían (mismo orden, mismos barberos).
    const plan = [model.appointment, ...(withOthers ? others : [])].map((item) => ({ item, start: addMinutes(value, differenceInMinutes(appointmentStart(item), base)) }));
    try {
      const created: Appointment[] = [];
      for (const { item, start } of plan) {
        created.push(await create.mutateAsync({ clientId: item.clientId, barberId: item.barberId, serviceIds: item.serviceIds, start: toLocalIso(start), walkIn: false, repeat: "none", requestedBarberId: item.barberId, notes: null }));
      }
      // Varias: quedan enlazadas, como la visita de la que salen.
      if (created.length > 1) await Promise.all(created.map((item) => update.mutateAsync({ id: item.id, patch: { linkId: newLinkId(created[0]) } })));
      setBooked({ at: value, count: created.length });
      toast.success(t("calendar.panel.next.booked"), { description: t("calendar.panel.next.bookedHint", { name: model.firstName, when: when(value) }) });
    } catch (error) {
      const { title, description } = describeError(error);
      toast.error(title, { description });
    }
  };

  if (booked) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-success/10 px-4 py-3" data-testid="panel-next-booked">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success text-primary-foreground">
          <ThemaIcon name="check" size="sm" tone="inverse" />
        </span>
        <span className="flex min-w-0 flex-col">
          <Text weight="semibold">{booked.count > 1 ? t("calendar.panel.next.bookedMany", { count: booked.count }) : t("calendar.panel.next.booked")}</Text>
          <Text size="sm" tone="secondary" className="first-letter:uppercase">
            {t("calendar.panel.next.bookedLine", { when: when(booked.at), barber: firstName })}
          </Text>
        </span>
      </div>
    );
  }

  return (
    <section aria-label={t("calendar.panel.next.title")} className="flex flex-col gap-3" data-testid="panel-next-visit">
      <div className="flex flex-col gap-0.5">
        {!bare && <Text weight="semibold">{t("calendar.panel.next.title")}</Text>}
        <Text size="sm" tone="secondary">
          {model.nextVisit && model.known?.visitEveryDays
            ? t("calendar.panel.next.byRhythm", { days: model.known.visitEveryDays, date: formatDate(suggested, { weekday: "long", day: "numeric", month: "long" }) })
            : t("calendar.panel.next.noRhythm", { weeks: DEFAULT_WEEKS })}
        </Text>
      </div>
      {others.length > 0 && (
        <label className="flex items-center justify-between gap-3 rounded-xl border border-input bg-surface px-3 py-2.5">
          <span className="flex min-w-0 flex-col">
            <Text as="span" size="sm" weight="medium">
              {others.length === 1 ? t("calendar.panel.next.withOther") : t("calendar.panel.next.withOthers", { count: others.length })}
            </Text>
            <Text as="span" size="xs" tone="muted">
              {t("calendar.panel.next.withOthersHint")}
            </Text>
          </span>
          <Switch checked={withOthers} onCheckedChange={setWithOthers} data-testid="panel-next-with-others" />
        </label>
      )}
      <TimeSlotPicker value={value} onChange={setValue} startDate={now} day={slots.day} onDayChange={slots.setDay} isDayDisabled={slots.isDayDisabled} isSlotDisabled={slots.isSlotDisabled} hideUnavailable loading={slots.loading} daysCount={90} />
      <Button size="lg" onClick={() => void book()} disabled={!value || create.isPending} data-testid="panel-next-book">
        <ThemaIcon name="calendarAdd" />
        {value ? (withOthers && others.length > 0 ? t("calendar.panel.next.bookManyAt", { count: others.length + 1, when: when(value) }) : t("calendar.panel.next.bookAt", { when: when(value), barber: firstName })) : t("calendar.panel.next.pick")}
      </Button>
      <SendRebookLink model={model} />
    </section>
  );
}

/**
 * Que elija él: el enlace de la reserva en línea con lo de esta cita, como se
 * manda el recibo —una tarjeta con su menú de SMS o correo—; ahí escoge la
 * hora y paga.
 */
function SendRebookLink({ model }: { model: AppointmentModel }) {
  const t = useAppT();
  if (!model.phone && !model.email) return null;
  const link = buildRebookLink(window.location.origin, { branchId: model.appointment.branchId, serviceIds: model.appointment.serviceIds, barberId: model.appointment.barberId });
  const tile: Tile = {
    id: "rebook-link",
    icon: <Send className="size-5 text-primary" />,
    label: t("calendar.panel.next.linkSend"),
    title: t("calendar.panel.next.linkSendTitle"),
    menu: writeMenu(model, t, { subject: t("calendar.panel.next.linkSubject"), text: t("calendar.panel.next.linkMessage", { name: model.firstName, link }) }),
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 p-3" data-testid="panel-next-link">
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Text size="sm" weight="medium">
          {t("calendar.panel.next.linkTitle")}
        </Text>
        <Text size="xs" tone="muted">
          {t("calendar.panel.next.linkHint")}
        </Text>
      </span>
      <div className="w-24 shrink-0">
        <TileRow tiles={[tile]} label={t("calendar.panel.next.linkSendTitle")} />
      </div>
    </div>
  );
}
