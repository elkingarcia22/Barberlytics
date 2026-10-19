import { useNavigate } from "react-router";
import { CalendarClock } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/typography";
import { InfoCard } from "@/features/team/teamShared";
import { useNextVisit } from "./rhythm";

const DAY: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "short" };
const SLOT: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" };

/**
 * Cuándo le toca volver según su frecuencia, y los huecos reales con su barbero (a su hora de
 * siempre) para agendarle en un toque cuando llama o pasa por la caja.
 */
export function CustomerNextVisit({ customerId }: { customerId: string }) {
  const t = useAppT();
  const navigate = useNavigate();
  const { formatDate } = useLocale();
  const query = useNextVisit(customerId);
  if (query.isPending) return <Skeleton className="h-32 w-full" />;
  const suggestion = query.data?.suggestion;
  if (!suggestion) return null;
  const due = formatDate(new Date(`${suggestion.dueDate}T12:00:00`), DAY);

  return (
    <InfoCard title={t("customers.rhythm.title")} description={t("customers.rhythm.hint", { days: suggestion.everyDays })}>
      <div className="space-y-3" data-testid="customer-next-visit">
        <Text weight="semibold" className={suggestion.isOverdue ? "text-status-warning" : undefined}>
          {t(suggestion.isOverdue ? "customers.rhythm.overdue" : "customers.rhythm.due", { date: due })}
        </Text>
        <div className="flex flex-col gap-2">
          {suggestion.options.map((option) => (
            <Button key={option.start} variant="outline" size="sm" className="justify-start" onClick={() => navigate(`/calendario?cliente=${customerId}&fecha=${option.start.slice(0, 10)}`)}>
              <CalendarClock /> {t("customers.rhythm.book", { when: formatDate(new Date(option.start), SLOT), barber: option.barberName })}
            </Button>
          ))}
        </div>
      </div>
    </InfoCard>
  );
}
