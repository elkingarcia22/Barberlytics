import * as React from "react";
import { format } from "date-fns";
import { useQueries } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { calendarLocale } from "@/components/date/calendarLocale";
import { formatClock } from "@/components/scheduling";
import { Text } from "@/components/typography";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ThemaIcon } from "@/icons";
import { describeError, isApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { calendarApi } from "../api";
import { appointmentStart, toLocalIso, type ModelContext } from "../calendarModel";
import { calendarKeys, useCreateAppointment } from "../queries";
import { InlineList } from "./bookingStyle";
import { bookableStops, pinDates, planStop, type PinStop } from "./pinPlan";
import type { AppointmentModel } from "./useAppointmentModel";

/**
 * «Fijar la cita», como en la reserva en línea: cada cuántas semanas y
 * cuántas más, con las fechas que quedarían a la vista antes de confirmar
 * (mismo barbero y servicios; la misma hora, o la libre más cercana si ese
 * día está ocupado). Los días sin hueco se dicen ahí mismo y no se agendan.
 */

const WEEKS = [1, 2, 3, 4] as const;
const COUNTS = [2, 3, 4, 6] as const;
const DEFAULT_WEEKS = 3;
const DEFAULT_COUNT = 3;
const DAYS_PER_WEEK = 7;
/** Qué dice cada fecha de la vista previa a la derecha. */
const STOP_LABEL: Partial<Record<PinStop["kind"], "calendar.panel.pin.new" | "calendar.panel.pin.moved" | "calendar.panel.pin.full" | "calendar.panel.pin.taken">> = {
  same: "calendar.panel.pin.new",
  moved: "calendar.panel.pin.moved",
  full: "calendar.panel.pin.full",
  taken: "calendar.panel.pin.taken",
};

/** Opciones que se eligen de a una, en una fila que ocupa todo el ancho (como en la reserva). */
function Choice<T extends number>({ label, values, value, onChange, render, hint }: { label: string; values: readonly T[]; value: T; onChange: (value: T) => void; render: (value: T) => string; hint?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Text size="sm" weight="medium">
        {label}
      </Text>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-4 gap-2">
        {values.map((option) => (
          <Button key={option} type="button" role="radio" aria-checked={value === option} variant={value === option ? "default" : "outline"} size="sm" className="px-2" onClick={() => onChange(option)}>
            {render(option)}
          </Button>
        ))}
      </div>
      {hint && (
        <Text size="xs" tone="muted">
          {hint}
        </Text>
      )}
    </div>
  );
}

export function PinSeries({ model, ctx, onClose, onPinned }: { model: AppointmentModel; ctx: ModelContext; onClose: () => void; /** Cuando ya quedó al menos una: la próxima ya no hay que agendarla aparte. */ onPinned?: () => void }) {
  const t = useAppT();
  const { locale } = useLocale();
  const create = useCreateAppointment();
  const usual = model.known?.visitEveryDays ? Math.min(4, Math.max(1, Math.round(model.known.visitEveryDays / DAYS_PER_WEEK))) : null;
  const [weeks, setWeeks] = React.useState<number>(usual ?? DEFAULT_WEEKS);
  const [count, setCount] = React.useState<number>(DEFAULT_COUNT);
  const [saving, setSaving] = React.useState(false);
  const [result, setResult] = React.useState<{ created: Date[]; skipped: Date[] } | null>(null);
  const start = appointmentStart(model.appointment);
  const dates = pinDates(start, weeks, count);
  const days = useQueries({
    queries: dates.map((date) => {
      const key = format(date, "yyyy-MM-dd");
      return { queryKey: calendarKeys.day(model.appointment.branchId, key), queryFn: ({ signal }: { signal: AbortSignal }) => calendarApi.day(model.appointment.branchId, key, signal), staleTime: 30_000 };
    }),
  });
  const stops: PinStop[] = dates.map((date, index) => (model.barber ? planStop({ date, day: days[index]?.data, barber: model.barber, durationMin: model.appointment.durationMin, clientId: model.appointment.clientId }) : { kind: "same", date }));
  const checking = stops.some((stop) => stop.kind === "unknown");
  const bookable = bookableStops(stops);
  const when = (date: Date) => `${format(date, "EEE, d 'de' MMM", { locale: calendarLocale(locale) })} · ${formatClock(date, ctx.intl)}`;
  const barber = model.barber?.name.split(" ")[0] ?? "";

  const pin = async () => {
    setSaving(true);
    const created: Date[] = [];
    const skipped: Date[] = [];
    for (const date of bookable) {
      try {
        await create.mutateAsync({ clientId: model.appointment.clientId, barberId: model.appointment.barberId, serviceIds: model.appointment.serviceIds, start: toLocalIso(date), walkIn: false, repeat: "none", requestedBarberId: model.appointment.barberId, notes: null });
        created.push(date);
      } catch (error) {
        // Sin hueco ese día (otra cita o un bloqueo): se dice cuál y se sigue con las demás.
        if (isApiError(error) && error.status === 409) skipped.push(date);
        else {
          const { title, description } = describeError(error);
          toast.error(title, { description });
          setSaving(false);
          return;
        }
      }
    }
    setSaving(false);
    setResult({ created, skipped });
    if (created.length > 0) {
      toast.success(doneTitle(created.length));
      onPinned?.();
    }
  };
  const doneTitle = (total: number) => (total === 1 ? t("calendar.panel.pin.doneOne") : t("calendar.panel.pin.done", { count: total }));

  if (result) {
    return (
      <InlineList title={doneTitle(result.created.length)} description={t("calendar.panel.pin.doneLead", { name: model.firstName })} onClose={onClose} footer={<Button className="flex-1" onClick={onClose}>{t("common.close")}</Button>}>
        <div className="flex flex-col gap-3" data-testid="panel-pin-done">
          <ol className="flex flex-col gap-2">
            {result.created.map((date) => (
              <li key={date.getTime()} className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5">
                <ThemaIcon name="check" size="sm" tone="positive" />
                <Text size="sm" tabular className="first-letter:uppercase">
                  {when(date)}
                </Text>
              </li>
            ))}
          </ol>
          {result.skipped.length > 0 && (
            <Alert variant="warning">
              <ThemaIcon name="warning" />
              <AlertTitle>{t("calendar.panel.pin.skippedTitle")}</AlertTitle>
              <AlertDescription>{t("calendar.panel.pin.skipped", { days: result.skipped.map((date) => format(date, "EEE d 'de' MMM", { locale: calendarLocale(locale) })).join(", "), barber })}</AlertDescription>
            </Alert>
          )}
        </div>
      </InlineList>
    );
  }

  return (
    <InlineList
      title={t("calendar.panel.pin.title")}
      description={t("calendar.panel.pin.lead", { barber, time: formatClock(start, ctx.intl) })}
      onClose={onClose}
      footer={
        <Button className="flex-1" disabled={saving || checking || bookable.length === 0} onClick={() => void pin()} data-testid="panel-pin-confirm">
          <ThemaIcon name="refresh" />
          {checking ? t("calendar.panel.pin.checking") : bookable.length === 0 ? t("calendar.panel.pin.none") : bookable.length === 1 ? t("calendar.panel.pin.ctaOne") : t("calendar.panel.pin.cta", { count: bookable.length })}
        </Button>
      }
    >
      <div className="flex flex-col gap-5" data-testid="panel-pin">
        <Choice label={t("calendar.panel.pin.every")} values={WEEKS} value={weeks} onChange={setWeeks} render={(value) => t("calendar.panel.pin.weeks", { count: value })} hint={usual !== null ? t("calendar.panel.pin.usual", { count: usual }) : undefined} />
        <Choice label={t("calendar.panel.pin.howMany")} values={COUNTS} value={count} onChange={setCount} render={(value) => String(value)} />
        <section aria-label={t("calendar.panel.pin.preview")} className="flex flex-col gap-2">
          <Text size="sm" weight="medium">
            {t("calendar.panel.pin.preview")}
          </Text>
          <ol className="relative flex flex-col">
            <PreviewStop label={t("calendar.panel.pin.thisOne")} when={when(start)} done last={false} />
            {stops.map((stop, index) => (
              <PreviewStop
                key={stop.date.getTime()}
                when={stop.kind === "full" ? when(stop.date).split(" · ")[0] : when(stop.date)}
                label={STOP_LABEL[stop.kind] ? t(STOP_LABEL[stop.kind]!) : "…"}
                hint={stop.kind === "moved" ? t("calendar.panel.pin.movedHint", { time: formatClock(stop.from, ctx.intl) }) : stop.kind === "full" ? t("calendar.panel.pin.fullHint", { barber }) : stop.kind === "taken" ? t("calendar.panel.pin.takenHint") : undefined}
                off={stop.kind === "full"}
                done={stop.kind === "taken"}
                warn={stop.kind === "moved"}
                last={index === stops.length - 1}
              />
            ))}
          </ol>
        </section>
        <Text size="xs" tone="muted" className="flex items-start gap-2">
          <ThemaIcon name="info" size="sm" />
          {t("calendar.panel.pin.note")}
        </Text>
      </div>
    </InlineList>
  );
}

/** Un punto de la vista previa: la fecha y qué pasa con ella. */
function PreviewStop({ when, label, hint, done = false, off = false, warn = false, last }: { when: string; label: string; hint?: string; done?: boolean; off?: boolean; warn?: boolean; last: boolean }) {
  return (
    <li className="relative flex items-start gap-3 py-2 pl-1">
      {!last && <span aria-hidden className="absolute left-[11px] top-7 h-[calc(100%-12px)] w-px bg-border" />}
      <span aria-hidden className={cn("relative z-raised mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border", done ? "border-success bg-success" : off ? "border-dashed border-border bg-surface" : warn ? "border-warning bg-surface" : "border-primary/60 bg-surface")}>
        {done && <ThemaIcon name="check" size="xs" tone="inverse" />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <Text size="sm" tabular tone={off ? "muted" : undefined} className={cn("first-letter:uppercase", off && "line-through")}>
          {when}
        </Text>
        {hint && (
          <Text size="xs" tone={warn ? "warning" : "muted"}>
            {hint}
          </Text>
        )}
      </span>
      <Text size="xs" tone={warn ? "warning" : "muted"} className="mt-0.5 shrink-0">
        {label}
      </Text>
    </li>
  );
}
