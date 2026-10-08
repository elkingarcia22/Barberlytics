import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Chip } from "@/components/ai-interaction";
import { Text } from "@/components/typography";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemaIcon } from "@/icons";
import { initialsOf, parseStart } from "../bookingFormat";
import type { BookingCatalog, VisitSuggestion } from "../types";
import { useBookingFlow } from "./BookingContext";

const DAY_MS = 86_400_000;
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
 * barbero. Una hora propuesta y dos alternativas cercanas; reservar es un toque.
 */
export function NextVisitSuggestion({ suggestion, catalog, onPickOther }: NextVisitSuggestionProps) {
  const t = useAppT();
  const { dispatch, fmt } = useBookingFlow();
  const [picked, setPicked] = React.useState(0);
  // «Ahora» se fija al montar: un render no debe leer el reloj.
  const [now] = React.useState(() => Date.now());
  const option = suggestion.options[picked] ?? suggestion.options[0];
  const when = parseStart(option.start);
  const barberOf = (id: string) => catalog?.barbers.find((barber) => barber.id === id);
  const barber = barberOf(option.barberId);
  const rhythm =
    suggestion.everyDays % WEEK_DAYS === 0
      ? t("booking.suggest.everyWeeks", { count: suggestion.everyDays / WEEK_DAYS })
      : t("booking.suggest.everyDays", { count: suggestion.everyDays });
  const daysSince = Math.max(0, Math.round((now - parseStart(suggestion.lastVisitAt).getTime()) / DAY_MS));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 rounded-xl bg-primary/10 p-3">
        <Text size="sm" weight="semibold" tone="primary" className="flex items-center gap-1.5">
          <ThemaIcon name="sparkles" size="sm" tone="primary" />
          {suggestion.isOverdue ? t("booking.suggest.overdue") : t("booking.suggest.due", { date: fmt.dayLong(parseStart(`${suggestion.dueDate}T00:00`)) })}
        </Text>
        <Text size="xs" tone="secondary">
          {rhythm} · {t("booking.suggest.lastVisit", { count: daysSince })}
        </Text>
      </div>

      <div role="radiogroup" aria-label={t("booking.suggest.options")} className="flex flex-wrap gap-2">
        {suggestion.options.map((item, index) => {
          const other = barberOf(item.barberId);
          const date = parseStart(item.start);
          return (
            <Chip
              key={item.start + item.barberId}
              label={`${fmt.day(date)} · ${fmt.time(date)}${item.sameBarber || !other ? "" : ` · ${other.name.split(" ")[0]}`}`}
              selected={index === picked}
              onClick={() => setPicked(index)}
            />
          );
        })}
      </div>

      {barber && (
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            {barber.avatarUrl && <AvatarImage src={barber.avatarUrl} alt="" />}
            <AvatarFallback>{initialsOf(barber.name)}</AvatarFallback>
          </Avatar>
          <Text size="xs" tone="secondary">
            {option.sameBarber ? t("booking.suggest.withUsual", { name: barber.name }) : t("booking.suggest.withOther", { name: barber.name })}
          </Text>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          size="lg"
          className="w-full"
          onClick={() => dispatch({ type: "acceptSuggestion", branchId: suggestion.branchId, serviceIds: suggestion.serviceIds, barberId: option.barberId, start: option.start })}
        >
          {t("booking.suggest.book", { when: `${fmt.day(when)} · ${fmt.time(when)}` })}
          <ThemaIcon name="arrowRight" />
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={onPickOther}>
          <ThemaIcon name="calendar" />
          {t("booking.suggest.other")}
        </Button>
      </div>
    </div>
  );
}
