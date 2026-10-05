import { Users } from "lucide-react";
import { PeriodNavigator, type PeriodGranularity } from "@/components/date";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocale } from "@/i18n";
import { useAppT } from "@/app/i18n";
import { ALL_BARBERS } from "./types";

interface MetricsFiltersProps {
  granularity: PeriodGranularity;
  onGranularityChange: (value: PeriodGranularity) => void;
  date: Date;
  onDateChange: (date: Date) => void;
  barberId: string;
  onBarberChange: (id: string) => void;
  /** Quién atiende; llega con la primera respuesta, así que puede faltar. */
  barbers: readonly { id: string; name: string }[];
  /** Un barbero solo ve sus cifras: sin selector. */
  showBarber?: boolean;
}

/**
 * La fila de filtros del tablero: el periodo y el barbero. La sucursal no
 * está aquí a propósito: es el espacio de trabajo y se cambia desde la
 * cabecera, como en el resto de la aplicación.
 */
export function MetricsFilters({ granularity, onGranularityChange, date, onDateChange, barberId, onBarberChange, barbers, showBarber = true }: MetricsFiltersProps) {
  const t = useAppT();
  const { current } = useLocale();

  return (
    <div className="flex flex-wrap items-center justify-between gap-stack" role="group" aria-label={t("metrics.filters")}>
      <PeriodNavigator
        granularity={granularity}
        onGranularityChange={onGranularityChange}
        date={date}
        onDateChange={onDateChange}
        locale={current.intl}
        labels={{
          day: t("metrics.period.day"),
          week: t("metrics.period.week"),
          month: t("metrics.period.month"),
          today: t("metrics.period.today"),
          previous: t("metrics.period.previous"),
          next: t("metrics.period.next"),
          aria: t("metrics.period.aria"),
        }}
      />

      {showBarber && (
        <Select value={barberId} onValueChange={onBarberChange}>
          <SelectTrigger className="w-[200px]" aria-label={t("metrics.barber")} data-testid="metrics-barber">
            <Users className="size-4 text-text-muted" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_BARBERS}>{t("metrics.allBarbers")}</SelectItem>
            {barbers.map((barber) => (
              <SelectItem key={barber.id} value={barber.id}>
                {barber.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
