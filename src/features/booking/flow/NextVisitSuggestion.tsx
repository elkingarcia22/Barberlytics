import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Chip } from "@/components/ai-interaction";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { ThemaIcon } from "@/icons";
import { isSameDayAs, parseStart } from "../bookingFormat";
import type { BookingCatalog, VisitSuggestion } from "../types";
import { useBookingFlow } from "./BookingContext";

const WEEK_DAYS = 7;

interface NextVisitSuggestionProps {
  suggestion: VisitSuggestion;
  catalog: BookingCatalog | undefined;
  /** Elegir otra fecha u hora: la misma visita, pero a la tira de días. */
  onPickOther: () => void;
}

/**
 * Lo que le toca según su frecuencia de visita: el día (su última visita más
 * su ritmo) y la hora a la que suele venir, ya con un hueco libre de su
 * barbero. Compacto para que el botón de reservar se vea sin desplazarse: una
 * línea con el día y el ritmo, una fila de horas y el botón.
 */
export function NextVisitSuggestion({ suggestion, catalog, onPickOther }: NextVisitSuggestionProps) {
  const t = useAppT();
  const { dispatch, fmt } = useBookingFlow();
  const [picked, setPicked] = React.useState(0);
  const option = suggestion.options[picked] ?? suggestion.options[0];
  const when = parseStart(option.start);
  const firstDay = parseStart(suggestion.options[0].start);
  const otherBarber = option.sameBarber ? null : catalog?.barbers.find((barber) => barber.id === option.barberId);
  const rhythm =
    suggestion.everyDays % WEEK_DAYS === 0
      ? t("booking.suggest.everyWeeks", { count: suggestion.everyDays / WEEK_DAYS })
      : t("booking.suggest.everyDays", { count: suggestion.everyDays });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <Text size="sm" weight="semibold" tone="primary" className="flex items-center gap-1.5 first-letter:uppercase">
          <ThemaIcon name="sparkles" size="xs" tone="primary" />
          {suggestion.isOverdue ? t("booking.suggest.overdue") : t("booking.suggest.due", { date: fmt.dayShort(firstDay) })}
        </Text>
        <Text size="xs" tone="muted" className="shrink-0">
          {rhythm}
        </Text>
      </div>

      <div role="radiogroup" aria-label={t("booking.suggest.options")} className="flex flex-wrap gap-1.5">
        {suggestion.options.map((item, index) => {
          const date = parseStart(item.start);
          // Del mismo día que la primera solo la hora; de otro día, «jue 29 · 9:00».
          const label = isSameDayAs(date, firstDay) ? fmt.time(date) : `${fmt.dayShort(date)} · ${fmt.time(date)}`;
          return <Chip key={item.start + item.barberId} size="sm" label={label} selected={index === picked} onClick={() => setPicked(index)} />;
        })}
        <Chip size="sm" icon="calendar" label={t("booking.suggest.other")} tone="muted" onClick={onPickOther} />
      </div>

      {otherBarber && (
        <Text size="xs" tone="secondary">
          {t("booking.suggest.withOther", { name: otherBarber.name })}
        </Text>
      )}

      <Button
        type="button"
        size="lg"
        className="w-full"
        onClick={() => dispatch({ type: "acceptSuggestion", branchId: suggestion.branchId, serviceIds: suggestion.serviceIds, barberId: option.barberId, start: option.start })}
      >
        {t("booking.suggest.book", { when: `${fmt.dayShort(when)} · ${fmt.time(when)}` })}
        <ThemaIcon name="arrowRight" />
      </Button>
    </div>
  );
}
