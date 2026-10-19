import * as React from "react";
import { addWeeks, differenceInMinutes, addMinutes, format } from "date-fns";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { calendarLocale } from "@/components/date/calendarLocale";
import { TimeSlotPicker, formatClock } from "@/components/scheduling";
import { SegmentedControl } from "@/components/selection";
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
import { SendToClient } from "./SendToClient";
import { targetOf } from "./sendTarget";

/**
 * «Reagendar», como una página dentro del panel. Arriba se elige cómo: lo
 * agenda la barbería ya —en el día que toca por su ritmo (o a 4 semanas si aún
 * no tiene), con las horas libres de su barbero y el mismo servicio; si la
 * visita traía varias citas enlazadas, se reagendan todas y quedan enlazadas
 * otra vez— o se le manda al cliente el enlace de la reserva en línea con todo
 * puesto, por correo o SMS, para que escoja la hora y pague. Debajo, siempre
 * un solo botón principal: «Agendar…» o «Enviar».
 */

/** Sin ritmo todavía, la próxima se propone a este plazo. */
const DEFAULT_WEEKS = 4;

type Mode = "pick" | "link";

export function NextVisitBooker({ model, ctx, group = [], onDone }: { model: AppointmentModel; ctx: ModelContext; /** Las citas de la misma visita (ella incluida), para reagendarlas juntas. */ group?: readonly Appointment[]; /** Volver a la cita (tras agendar o enviar). */ onDone: () => void }) {
  const t = useAppT();
  const canSend = model.phone !== "" || model.email !== "";
  const [mode, setMode] = React.useState<Mode>("pick");
  return (
    <div className="flex flex-col gap-5" data-testid="panel-next-visit">
      {canSend && (
        <SegmentedControl
          fullWidth
          value={mode}
          onChange={(value) => setMode(value === "link" ? "link" : "pick")}
          options={[
            { value: "pick", label: t("calendar.panel.next.modePick") },
            { value: "link", label: t("calendar.panel.next.modeLink") },
          ]}
          ariaLabel={t("calendar.panel.next.mode")}
        />
      )}
      {mode === "pick" ? <PickTime model={model} ctx={ctx} group={group} onDone={onDone} /> : <SendRebookLink model={model} onSent={onDone} />}
    </div>
  );
}

/** Lo agenda la barbería: la hora en la tira y un botón «Agendar…». */
function PickTime({ model, ctx, group, onDone }: { model: AppointmentModel; ctx: ModelContext; group: readonly Appointment[]; onDone: () => void }) {
  const t = useAppT();
  const { locale, formatDate } = useLocale();
  const create = useCreateAppointment();
  const update = useUpdateAppointment();
  const now = ctx.now ?? new Date();
  const suggested = model.nextVisit && model.nextVisit > now ? model.nextVisit : addWeeks(appointmentStart(model.appointment), DEFAULT_WEEKS);
  const [value, setValue] = React.useState<Date | null>(null);
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
      toast.success(created.length > 1 ? t("calendar.panel.next.bookedMany", { count: created.length }) : t("calendar.panel.next.booked"), { description: t("calendar.panel.next.bookedHint", { name: model.firstName, when: when(value) }) });
      onDone();
    } catch (error) {
      const { title, description } = describeError(error);
      toast.error(title, { description });
    }
  };

  return (
    <>
      <Text size="sm" tone="secondary">
        {model.nextVisit && model.known?.visitEveryDays
          ? t("calendar.panel.next.byRhythm", { days: model.known.visitEveryDays, date: formatDate(suggested, { weekday: "long", day: "numeric", month: "long" }) })
          : t("calendar.panel.next.noRhythm", { weeks: DEFAULT_WEEKS })}
      </Text>
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
    </>
  );
}

/** Que elija él: el enlace de la reserva en línea con lo de esta cita, por correo o SMS, como se manda el recibo. */
function SendRebookLink({ model, onSent }: { model: AppointmentModel; onSent: () => void }) {
  const t = useAppT();
  const link = buildRebookLink(window.location.origin, { branchId: model.appointment.branchId, serviceIds: model.appointment.serviceIds, barberId: model.appointment.barberId });
  return <SendToClient target={targetOf(model)} kind="rebookLink" lead={t("calendar.panel.next.linkHint")} body={t("calendar.panel.next.linkMessage", { name: model.firstName, link })} onSent={onSent} />;
}
