import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { parseStart } from "../bookingFormat";
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <IconTile size="md" icon={<ThemaIcon name="sparkles" />} />
        <div className="flex min-w-0 flex-col">
          <Text weight="semibold" className="first-letter:uppercase">
            {suggestion.isOverdue ? t("booking.suggest.overdue") : t("booking.suggest.due", { date: fmt.dayShort(firstDay) })}
          </Text>
          <Text size="xs" tone="muted">
            {rhythm}
          </Text>
        </div>
      </div>

      {/* Tres fichas del mismo tamaño: el día pequeño arriba y la hora grande, para escanearlas de un vistazo. */}
      <div role="radiogroup" aria-label={t("booking.suggest.options")} className="grid grid-cols-3 gap-2">
        {suggestion.options.map((item, index) => {
          const date = parseStart(item.start);
          const isPicked = index === picked;
          return (
            <button
              key={item.start + item.barberId}
              type="button"
              role="radio"
              aria-checked={isPicked}
              onClick={() => setPicked(index)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl border px-2 py-2.5",
                "transition-colors duration-fast ease-out-expo motion-reduce:transition-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                isPicked ? "border-primary bg-primary/10" : "border-border bg-surface hover:bg-surface-subtle"
              )}
            >
              <span className={cn("text-xs capitalize", isPicked ? "text-primary" : "text-text-muted")}>{fmt.dayShort(date)}</span>
              <span className={cn("text-sm font-semibold tabular-nums", isPicked ? "text-primary" : "text-text-primary")}>{fmt.time(date)}</span>
            </button>
          );
        })}
      </div>

      {otherBarber && (
        <Text size="xs" tone="secondary">
          {t("booking.suggest.withOther", { name: otherBarber.name })}
        </Text>
      )}

      <div className="flex flex-col items-center gap-3">
        <Button
          type="button"
          size="lg"
          className="w-full"
          onClick={() => dispatch({ type: "acceptSuggestion", branchId: suggestion.branchId, serviceIds: suggestion.serviceIds, barberId: option.barberId, start: option.start })}
        >
          {t("booking.suggest.book", { when: `${fmt.dayShort(when)} · ${fmt.time(when)}` })}
          <ThemaIcon name="arrowRight" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onPickOther}>
          <ThemaIcon name="calendar" />
          {t("booking.suggest.other")}
        </Button>
      </div>
    </div>
  );
}
