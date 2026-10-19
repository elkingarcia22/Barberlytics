import * as React from "react";
import { addWeeks, format } from "date-fns";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { calendarLocale } from "@/components/date/calendarLocale";
import { TimeSlotPicker, formatClock } from "@/components/scheduling";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { ThemaIcon } from "@/icons";
import { appointmentStart, toLocalIso, type ModelContext } from "../calendarModel";
import { useCreateAppointment } from "../queries";
import { useFreeSlots } from "./useFreeSlots";
import type { AppointmentModel } from "./useAppointmentModel";

/**
 * «¿Le agendamos la próxima?»: lo que se le dice al cliente antes de que se
 * vaya. Abre en el día que toca por su ritmo (o a 4 semanas si aún no tiene),
 * con las horas libres de su barbero, y la deja agendada con un toque, con
 * el mismo servicio. Es el rebook de Boulevard y Mangomint, sin salir del panel.
 */

/** Sin ritmo todavía, la próxima se propone a este plazo. */
const DEFAULT_WEEKS = 4;

export function NextVisitBooker({ model, ctx, bare = false }: { model: AppointmentModel; ctx: ModelContext; /** Sin su título: lo pone afuera quien la usa (la pregunta de «Arma la cita»). */ bare?: boolean }) {
  const t = useAppT();
  const { locale, formatDate } = useLocale();
  const create = useCreateAppointment();
  const now = ctx.now ?? new Date();
  const suggested = model.nextVisit && model.nextVisit > now ? model.nextVisit : addWeeks(appointmentStart(model.appointment), DEFAULT_WEEKS);
  const [value, setValue] = React.useState<Date | null>(null);
  const [booked, setBooked] = React.useState<Date | null>(null);
  const slots = useFreeSlots({ branchId: model.appointment.branchId, barber: model.barber, durationMin: model.appointment.durationMin, initialDay: suggested, now });
  const firstName = model.barber?.name.split(" ")[0] ?? "";
  const when = (date: Date) => `${format(date, "EEE d 'de' MMM", { locale: calendarLocale(locale) })}, ${formatClock(date, ctx.intl)}`;

  const book = async () => {
    if (!value) return;
    try {
      await create.mutateAsync({
        clientId: model.appointment.clientId,
        barberId: model.appointment.barberId,
        serviceIds: model.appointment.serviceIds,
        start: toLocalIso(value),
        walkIn: false,
        repeat: "none",
        requestedBarberId: model.appointment.barberId,
        notes: null,
      });
      setBooked(value);
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
          <Text weight="semibold">{t("calendar.panel.next.booked")}</Text>
          <Text size="sm" tone="secondary" className="first-letter:uppercase">
            {t("calendar.panel.next.bookedLine", { when: when(booked), barber: firstName })}
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
      <TimeSlotPicker value={value} onChange={setValue} startDate={now} day={slots.day} onDayChange={slots.setDay} isDayDisabled={slots.isDayDisabled} isSlotDisabled={slots.isSlotDisabled} hideUnavailable loading={slots.loading} daysCount={90} />
      <Button size="lg" onClick={() => void book()} disabled={!value || create.isPending} data-testid="panel-next-book">
        <ThemaIcon name="calendarAdd" />
        {value ? t("calendar.panel.next.bookAt", { when: when(value), barber: firstName }) : t("calendar.panel.next.pick")}
      </Button>
    </section>
  );
}
