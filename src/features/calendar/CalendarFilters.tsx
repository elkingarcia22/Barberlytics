import * as React from "react";
import { ListFilter } from "lucide-react";
import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Text } from "@/components/typography";
import { ScheduleColorDot } from "@/components/scheduling";
import { Switch } from "@/components/ui/switch";
import { PULSE_FOCUSES, type DayPulse, type PulseFocus } from "./pulseModel";
import type { ClientType } from "./types";

/**
 * El control de filtros de la agenda: qué citas se miran —en qué estado
 * están, de qué servicio son y qué tipo de cliente las tiene— y si solo se ven los huecos. Cómo se pinta la
 * agenda (color de las tarjetas, densidad) no filtra nada y vive aparte, en
 * `CalendarViewOptions`. Estado y
 * servicio son listas de casillas —se marcan varias a la vez— con cuántas
 * citas hay en cada una; el punto de cada servicio es el color de sus
 * tarjetas, así que la lista hace también de leyenda. Sin nada marcado se ve
 * todo. El botón dice cuántos filtros hay puestos.
 */

export interface ServiceFilterOption {
  id: string;
  name: string;
  /** El color de sus tarjetas en la paleta de la agenda. */
  color: number;
  count: number;
}

export interface ClientTypeFilterOption {
  id: ClientType;
  label: string;
  count: number;
}

/** Lo que el control avisa al cambiar: los tres filtros viajan juntos a la URL. */
export interface CalendarFilterSelection {
  focuses: PulseFocus[];
  serviceIds: string[];
  clientTypes: ClientType[];
}

export interface CalendarFiltersProps {
  pulse: DayPulse;
  focuses: readonly PulseFocus[];
  services: readonly ServiceFilterOption[];
  serviceIds: readonly string[];
  /** Los tipos de cliente con cuántas citas tiene cada uno hoy. */
  clientTypeOptions?: readonly ClientTypeFilterOption[];
  clientTypes?: readonly ClientType[];
  /** Un solo aviso con todo lo que cambió: estado, servicio y tipo de cliente viajan juntos a la URL. */
  onChange: (next: CalendarFilterSelection) => void;
  /** Ver solo los huecos disponibles; solo en la rejilla del día. */
  freeOnly?: boolean;
  onFreeOnlyChange?: (next: boolean) => void;
}

const STATUS_LABEL: Record<PulseFocus, AppMessageKey> = {
  late: "calendar.live.late",
  toCollect: "calendar.live.toCollect",
  waiting: "calendar.live.waiting",
  seated: "calendar.live.seated",
  upcoming: "calendar.live.upcoming",
  paid: "calendar.live.paid",
};


const toggle = <T,>(list: readonly T[], value: T): T[] => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);

export function CalendarFilters({ pulse, focuses, services, serviceIds, clientTypeOptions = [], clientTypes = [], onChange, freeOnly = false, onFreeOnlyChange }: CalendarFiltersProps) {
  const t = useAppT();
  const freeId = React.useId();
  const active = focuses.length + serviceIds.length + clientTypes.length + (freeOnly ? 1 : 0);
  const emit = (next: Partial<CalendarFilterSelection>) =>
    onChange({ focuses: [...focuses], serviceIds: [...serviceIds], clientTypes: [...clientTypes], ...next });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" aria-label={t("calendar.filters.title")} data-testid="calendar-filters">
          <ListFilter className="text-text-muted" />
          {t("calendar.filters.button")}
          {active > 0 ? (
            <span className="rounded-full bg-primary px-1.5 text-xs font-semibold tabular-nums text-primary-foreground" data-testid="calendar-filters-count">
              {active}
            </span>
          ) : (
            <span className="tabular-nums text-text-muted">{pulse.total}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 space-y-4 p-3" data-testid="calendar-filters-panel">
        {onFreeOnlyChange && (
          <div className="flex items-start justify-between gap-3">
            <label htmlFor={freeId} className="min-w-0 space-y-0.5">
              <Text as="span" variant="label" className="block">
                {t("calendar.filters.freeOnly")}
              </Text>
              <Text as="span" variant="caption" className="block">
                {t("calendar.filters.freeOnlyHint")}
              </Text>
            </label>
            <Switch id={freeId} checked={freeOnly} onCheckedChange={onFreeOnlyChange} data-testid="calendar-filter-free" />
          </div>
        )}

        <FilterList label={t("calendar.filters.status")}>
          {PULSE_FOCUSES.map((id) => (
            <FilterRow
              key={id}
              testId={`calendar-filter-status-${id}`}
              label={t(STATUS_LABEL[id])}
              count={pulse.counts[id]}
              checked={focuses.includes(id)}
              onToggle={() => emit({ focuses: toggle(focuses, id) })}
            />
          ))}
        </FilterList>

        {clientTypeOptions.length > 0 && (
          <FilterList label={t("calendar.filters.clientType")}>
            {clientTypeOptions.map((option) => (
              <FilterRow
                key={option.id}
                testId={`calendar-filter-client-${option.id}`}
                label={option.label}
                count={option.count}
                checked={clientTypes.includes(option.id)}
                onToggle={() => emit({ clientTypes: toggle(clientTypes, option.id) })}
              />
            ))}
          </FilterList>
        )}

        {services.length > 0 && (
          <FilterList label={t("calendar.filters.service")} scroll>
            {services.map((service) => (
              <FilterRow
                key={service.id}
                testId={`calendar-filter-service-${service.id}`}
                label={service.name}
                count={service.count}
                color={service.color}
                checked={serviceIds.includes(service.id)}
                onToggle={() => emit({ serviceIds: toggle(serviceIds, service.id) })}
              />
            ))}
          </FilterList>
        )}

        {active > 0 && (
          <Button variant="ghost" size="sm" onClick={() => {
              onChange({ focuses: [], serviceIds: [], clientTypes: [] });
              if (freeOnly) onFreeOnlyChange?.(false);
            }}
            data-testid="calendar-filters-clear">
            {t("calendar.filters.clear")}
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

function FilterList({ label, scroll = false, children }: { label: string; scroll?: boolean; children: React.ReactNode }) {
  return (
    <section className="space-y-1" aria-label={label}>
      <Text variant="label">{label}</Text>
      <ul className={cn("-mx-1", scroll && "max-h-56 overflow-y-auto overscroll-contain")}>{children}</ul>
    </section>
  );
}

interface FilterRowProps {
  label: string;
  count: number;
  checked: boolean;
  onToggle: () => void;
  /** El color de la paleta de la agenda, cuando la fila es también leyenda. */
  color?: number;
  testId: string;
}

function FilterRow({ label, count, checked, onToggle, color, testId }: FilterRowProps) {
  const id = React.useId();
  return (
    <li data-testid={testId}>
      <label htmlFor={id} className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1.5 text-sm text-text-primary transition-colors duration-fast hover:bg-surface-subtle motion-reduce:transition-none">
        <Checkbox id={id} checked={checked} onCheckedChange={onToggle} />
        {color !== undefined && <ScheduleColorDot color={color} />}
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <span className="tabular-nums text-text-muted" data-count>
          {count}
        </span>
      </label>
    </li>
  );
}
