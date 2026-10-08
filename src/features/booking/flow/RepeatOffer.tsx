import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Heading, Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon } from "@/icons";
import { describeError } from "@/lib/api";
import { parseStart } from "../bookingFormat";
import { useRepeatMutation, useVisitSuggestionQuery } from "../queries";
import type { Reservation } from "../types";
import { useBookingFlow } from "./BookingContext";

const WEEKS = [1, 2, 3, 4] as const;
const COUNTS = [2, 3, 4, 6] as const;
const DEFAULT_COUNT = 3;
const DAYS_PER_WEEK = 7;

/** Pastillas que se eligen de a una (y bajan de línea si no caben). */
function Pills<T extends number>({ label, values, value, onChange, render }: { label: string; values: readonly T[]; value: T; onChange: (value: T) => void; render: (value: T) => string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Text size="xs" tone="muted">
        {label}
      </Text>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {values.map((option) => (
          <Button key={option} type="button" role="radio" aria-checked={value === option} size="sm" variant={value === option ? "default" : "outline"} className="rounded-full" onClick={() => onChange(option)}>
            {render(option)}
          </Button>
        ))}
      </div>
    </div>
  );
}

/**
 * «¿La dejamos fija?»: tras reservar, las próximas con el mismo barbero y a la misma hora, cada
 * tantas semanas. Propone su ritmo de siempre (la frecuencia de visita) y se pagan en la barbería.
 * Lo que no tuvo hueco se dice, para que lo reserve aparte.
 */
export function RepeatOffer({ reservation }: { reservation: Reservation }) {
  const t = useAppT();
  const { state, fmt } = useBookingFlow();
  const suggestion = useVisitSuggestionQuery(state.token);
  const usual = suggestion.data?.suggestion ? Math.min(4, Math.max(1, Math.round(suggestion.data.suggestion.everyDays / DAYS_PER_WEEK))) : null;
  const [weeks, setWeeks] = React.useState<(typeof WEEKS)[number] | null>(null);
  const [count, setCount] = React.useState<(typeof COUNTS)[number]>(DEFAULT_COUNT);
  const repeat = useRepeatMutation(state.token);
  const chosenWeeks = weeks ?? ((usual as (typeof WEEKS)[number] | null) ?? 3);

  if (!state.token) return null;

  if (repeat.isSuccess) {
    const { created, skipped } = repeat.data;
    return (
      <div role="status" className="flex items-start gap-3 rounded-2xl border border-success/40 bg-success/10 p-4">
        <IconTile size="md" shape="circle" tone="positive" icon={<ThemaIcon name="check" />} />
        <div className="flex min-w-0 flex-col gap-1">
          <Text size="sm" weight="semibold">
            {t("booking.repeat.done", { count: created.length })}
          </Text>
          <Text size="sm" tone="secondary" tabular>
            {created.map((item) => fmt.when(parseStart(item.start))).join(" · ")}
          </Text>
          {skipped.length > 0 && (
            <Text size="xs" tone="warning">
              {t("booking.repeat.skipped", { days: skipped.map((day) => fmt.dayShort(parseStart(`${day}T00:00`))).join(", ") })}
            </Text>
          )}
        </div>
      </div>
    );
  }

  return (
    <section aria-labelledby="repeat-title" className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <IconTile size="md" shape="circle" icon={<ThemaIcon name="calendar" />} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <Heading level={6} id="repeat-title">
            {t("booking.repeat.title")}
          </Heading>
          <Text size="sm" tone="secondary">
            {t("booking.repeat.lead")}
          </Text>
        </div>
      </div>
      <Pills label={t("booking.repeat.every")} values={WEEKS} value={chosenWeeks} onChange={setWeeks} render={(value) => t("booking.repeat.weeks", { count: value })} />
      {usual !== null && (
        <Text size="xs" tone="muted" className="-mt-2">
          {t("booking.repeat.usual", { count: usual })}
        </Text>
      )}
      <Pills label={t("booking.repeat.howMany")} values={COUNTS} value={count} onChange={setCount} render={(value) => t("booking.repeat.count", { count: value })} />
      {repeat.isError && (
        <Text size="sm" tone="negative">
          {describeError(repeat.error).description}
        </Text>
      )}
      <Button type="button" variant="outline" disabled={repeat.isPending} onClick={() => repeat.mutate({ ids: reservation.appointments.map((item) => item.id), everyWeeks: chosenWeeks, count })}>
        <ThemaIcon name="refresh" />
        {t("booking.repeat.cta")}
      </Button>
    </section>
  );
}
