import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Text } from "@/components/typography";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/feedback/Spinner";
import { ThemaIcon } from "@/icons";
import { describeError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { parseStart } from "../bookingFormat";
import { useRepeatMutation, useVisitSuggestionQuery } from "../queries";
import type { Reservation } from "../types";
import { useBookingFlow } from "./BookingContext";
import { BookingSheet } from "./BookingSheet";

const WEEKS = [1, 2, 3, 4] as const;
const COUNTS = [2, 3, 4, 6] as const;
const DEFAULT_WEEKS = 3;
const DEFAULT_COUNT = 3;
const DAYS_PER_WEEK = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

type Weeks = (typeof WEEKS)[number];
type Count = (typeof COUNTS)[number];

/** Opciones que se eligen de a una, en una fila que ocupa todo el ancho. */
function Choice<T extends number>({ label, values, value, onChange, render }: { label: string; values: readonly T[]; value: T; onChange: (value: T) => void; render: (value: T) => string }) {
  return (
    <div className="flex flex-col gap-2">
      <Text size="sm" weight="medium">
        {label}
      </Text>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-4 gap-2">
        {values.map((option) => (
          <Button key={option} type="button" role="radio" aria-checked={value === option} variant={value === option ? "default" : "outline"} className="px-2" onClick={() => onChange(option)}>
            {render(option)}
          </Button>
        ))}
      </div>
    </div>
  );
}

/**
 * «Fijar la cita»: cada cuánto y cuántas más, con las fechas que quedarían a la vista antes de
 * confirmar (mismo barbero, misma hora). Se pagan en la barbería; lo que no tenga hueco se avisa.
 */
export function RepeatSheet({ reservation, open, onOpenChange }: { reservation: Reservation; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useAppT();
  const { state, fmt } = useBookingFlow();
  const suggestion = useVisitSuggestionQuery(state.token);
  const usual = suggestion.data?.suggestion ? (Math.min(4, Math.max(1, Math.round(suggestion.data.suggestion.everyDays / DAYS_PER_WEEK))) as Weeks) : null;
  const [weeks, setWeeks] = React.useState<Weeks | null>(null);
  const [count, setCount] = React.useState<Count>(DEFAULT_COUNT);
  const repeat = useRepeatMutation(state.token);
  const chosenWeeks = weeks ?? usual ?? DEFAULT_WEEKS;
  const first = reservation.appointments[0];
  if (!first) return null;
  const start = parseStart(first.start);
  const upcoming = Array.from({ length: count }, (_, index) => new Date(start.getTime() + (index + 1) * chosenWeeks * DAYS_PER_WEEK * DAY_MS));

  const done = repeat.isSuccess ? repeat.data : null;

  return (
    <BookingSheet
      open={open}
      onOpenChange={onOpenChange}
      title={done ? t("booking.repeat.done", { count: done.created.length }) : t("booking.confirmed.repeatTitle")}
      description={done ? t("booking.confirmed.repeatDoneLead") : t("booking.confirmed.repeatLead", { name: first.barberName.split(" ")[0], time: fmt.time(start) })}
      actions={
        done ? (
          <Button type="button" className="w-full" onClick={() => onOpenChange(false)}>
            {t("booking.confirmed.repeatClose")}
          </Button>
        ) : (
          <Button type="button" className="w-full" disabled={repeat.isPending} onClick={() => repeat.mutate({ ids: reservation.appointments.map((item) => item.id), everyWeeks: chosenWeeks, count })}>
            {repeat.isPending ? <Spinner size="sm" tone="inverse" /> : <ThemaIcon name="refresh" />}
            {t("booking.confirmed.repeatCta", { count })}
          </Button>
        )
      }
    >
      {done ? (
        <div className="flex flex-col gap-4">
          <ol className="flex flex-col gap-2">
            {done.created.map((item) => (
              <li key={item.id} className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5">
                <ThemaIcon name="check" size="sm" tone="positive" />
                <Text size="sm" tabular className="first-letter:uppercase">
                  {fmt.when(parseStart(item.start))}
                </Text>
              </li>
            ))}
          </ol>
          {done.skipped.length > 0 && (
            <Alert variant="warning">
              <ThemaIcon name="warning" />
              <AlertTitle>{t("booking.confirmed.repeatSkippedTitle")}</AlertTitle>
              <AlertDescription>{t("booking.repeat.skipped", { days: done.skipped.map((day) => fmt.dayShort(parseStart(`${day}T00:00`))).join(", ") })}</AlertDescription>
            </Alert>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <Choice label={t("booking.repeat.every")} values={WEEKS} value={chosenWeeks} onChange={setWeeks} render={(value) => t("booking.confirmed.repeatWeeksShort", { count: value })} />
            {usual !== null && (
              <Text size="xs" tone="muted">
                {t("booking.repeat.usual", { count: usual })}
              </Text>
            )}
          </div>
          <Choice label={t("booking.repeat.howMany")} values={COUNTS} value={count} onChange={setCount} render={(value) => String(value)} />

          <section aria-labelledby="repeat-preview" className="flex flex-col gap-2">
            <Text id="repeat-preview" size="sm" weight="medium">
              {t("booking.confirmed.repeatPreview")}
            </Text>
            <ol className="relative flex flex-col">
              {[start, ...upcoming].map((date, index) => (
                <li key={date.getTime()} className="relative flex items-center gap-3 py-2 pl-1">
                  {index < upcoming.length && <span aria-hidden className="absolute left-[11px] top-7 h-[calc(100%-12px)] w-px bg-border" />}
                  <span aria-hidden className={cn("relative z-raised flex size-5 shrink-0 items-center justify-center rounded-full border", index === 0 ? "border-success bg-success text-primary-foreground" : "border-primary/60 bg-surface")}>
                    {index === 0 && <ThemaIcon name="check" size="xs" tone="inverse" />}
                  </span>
                  <Text size="sm" tabular className="min-w-0 flex-1 first-letter:uppercase">
                    {fmt.when(date)}
                  </Text>
                  <Text size="xs" tone="muted">
                    {index === 0 ? t("booking.confirmed.repeatThisOne") : t("booking.confirmed.repeatNew")}
                  </Text>
                </li>
              ))}
            </ol>
          </section>

          <Text size="xs" tone="muted" className="flex items-start gap-2">
            <ThemaIcon name="info" size="sm" />
            {t("booking.confirmed.repeatNote")}
          </Text>
          {repeat.isError && (
            <Text size="sm" tone="negative" role="alert">
              {describeError(repeat.error).description}
            </Text>
          )}
        </div>
      )}
    </BookingSheet>
  );
}
