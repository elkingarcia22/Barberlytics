import * as React from "react";
import { ListFilter, TriangleAlert } from "lucide-react";
import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";
import { resourceSelected, toggleResource } from "./resourceModel";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Text } from "@/components/typography";
import { MultiSelect, type MultiSelectOption } from "@/components/forms";
import { ScheduleColorDot } from "@/components/scheduling";
import { Switch } from "@/components/ui/switch";
import { PULSE_FOCUSES, type DayPulse, type PulseFocus } from "./pulseModel";
import type { ClientType } from "./types";
import { TIME_OFF_KINDS, type TimeOffKind } from "./useCalendarState";

/**
 * El control de filtros de la agenda: qué citas se miran —en qué estado
 * están, de qué servicio son y qué tipo de cliente las tiene— y si solo se ven los huecos. Cómo se pinta la
 * agenda (color de las tarjetas, densidad) no filtra nada y vive aparte, en
 * `CalendarViewOptions`. Estado, tipo de cliente, recurso especial y
 * servicio son campos de varias opciones —lo marcado sale como chips— y cada
 * opción dice cuántas citas hay; el punto de cada servicio es el color de sus
 * tarjetas, así que la lista hace también de leyenda. Así el panel no crece
 * con el catálogo. Sin nada marcado se ve todo. El botón dice cuántos
 * filtros hay puestos.
 */

export interface ServiceFilterOption {
  id: string;
  name: string;
  /** El color de sus tarjetas en la paleta de la agenda. */
  color: number;
  count: number;
}

/** Un recurso especial (sillón de lavado, vaporizador…): marcarlo filtra por los servicios que lo usan. */
export interface ResourceFilterOption {
  id: string;
  name: string;
  serviceIds: readonly string[];
  /** Los servicios que lo usan, en una línea. */
  servicesLabel: string;
  /** Cuántas citas de hoy lo ocupan. */
  count: number;
  /** Cuántas veces hoy se pide más de lo que hay. */
  clashes: number;
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
  /** Los recursos especiales del local, con lo que los ocupa hoy. */
  resources?: readonly ResourceFilterOption[];
  /** Los tipos de cliente con cuántas citas tiene cada uno hoy. */
  clientTypeOptions?: readonly ClientTypeFilterOption[];
  clientTypes?: readonly ClientType[];
  /** Un solo aviso con todo lo que cambió: estado, servicio y tipo de cliente viajan juntos a la URL. */
  onChange: (next: CalendarFilterSelection) => void;
  /** Ver solo los huecos disponibles; solo en la rejilla del día. */
  freeOnly?: boolean;
  onFreeOnlyChange?: (next: boolean) => void;
  /** Resaltar las citas enlazadas; solo en la rejilla del día. */
  showLinked?: boolean;
  onShowLinkedChange?: (next: boolean) => void;
  /**
   * Ver solo ausencias y/o bloqueos (juntos, como en las acciones), con cuántos hay hoy: lo
   * elegido queda a la vista y las citas se apagan, como con «solo huecos». Solo en la rejilla del día.
   */
  timeOff?: { selected: readonly TimeOffKind[]; counts: Record<TimeOffKind, number> };
  onTimeOffChange?: (next: TimeOffKind[]) => void;
  /** Solo las citas que el cliente no ha confirmado, con cuántas hay en el día. */
  unconfirmed?: boolean;
  onUnconfirmedChange?: (next: boolean) => void;
  unconfirmedCount?: number;
  /** Hoy: ir a mañana con ese filtro puesto («Sin confirmar mañana»), para escribirles a tiempo. */
  onTomorrowUnconfirmed?: () => void;
}

const TIME_OFF_LABEL: Record<TimeOffKind, AppMessageKey> = { absences: "calendar.filters.showAbsences", blocks: "calendar.filters.showBlocks" };

const STATUS_LABEL: Record<PulseFocus, AppMessageKey> = {
  late: "calendar.live.late",
  toCollect: "calendar.live.toCollect",
  waiting: "calendar.live.waiting",
  seated: "calendar.live.seated",
  upcoming: "calendar.live.upcoming",
  paid: "calendar.live.paid",
};



export function CalendarFilters({ pulse, focuses, services, serviceIds, resources = [], clientTypeOptions = [], clientTypes = [], onChange, freeOnly = false, onFreeOnlyChange, showLinked = false, onShowLinkedChange, timeOff, onTimeOffChange, unconfirmed = false, onUnconfirmedChange, unconfirmedCount, onTomorrowUnconfirmed }: CalendarFiltersProps) {
  const t = useAppT();
  const freeId = React.useId();
  const unconfirmedId = React.useId();
  const linkedId = React.useId();
  const timeOffSelected = timeOff?.selected.length ?? 0;
  const active = focuses.length + serviceIds.length + clientTypes.length + (freeOnly ? 1 : 0) + (showLinked ? 1 : 0) + (unconfirmed ? 1 : 0) + timeOffSelected;
  const emit = (next: Partial<CalendarFilterSelection>) =>
    onChange({ focuses: [...focuses], serviceIds: [...serviceIds], clientTypes: [...clientTypes], ...next });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" aria-label={t("calendar.filters.title")} data-testid="calendar-filters">
          <ListFilter className="text-text-muted" />
          {t("calendar.filters.button")}
          {/* Solo cuántos filtros hay puestos; sin ninguno, nada. */}
          {active > 0 && (
            <span className="rounded-full bg-primary px-1.5 text-xs font-semibold tabular-nums text-primary-foreground" data-testid="calendar-filters-count">
              {active}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 space-y-4 p-3" data-testid="calendar-filters-panel">
        {onUnconfirmedChange && (
          <div className="space-y-1.5" data-testid="calendar-filter-unconfirmed-row">
            <div className="flex items-start justify-between gap-3">
              <label htmlFor={unconfirmedId} className="min-w-0 space-y-0.5">
                <Text as="span" variant="label" className="block">
                  {t("calendar.filters.unconfirmed")}
                  {unconfirmedCount !== undefined && <span className="ml-1.5 tabular-nums text-text-muted">{unconfirmedCount}</span>}
                </Text>
                <Text as="span" variant="caption" className="block">
                  {t("calendar.filters.unconfirmedHint")}
                </Text>
              </label>
              <Switch id={unconfirmedId} checked={unconfirmed} onCheckedChange={onUnconfirmedChange} data-testid="calendar-filter-unconfirmed" />
            </div>
            {onTomorrowUnconfirmed && (
              <Button variant="ghost" size="xs" onClick={onTomorrowUnconfirmed} data-testid="calendar-filter-unconfirmed-tomorrow">
                {t("calendar.filters.unconfirmedTomorrow")}
              </Button>
            )}
          </div>
        )}

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

        {onShowLinkedChange && (
          <div className="flex items-start justify-between gap-3">
            <label htmlFor={linkedId} className="min-w-0 space-y-0.5">
              <Text as="span" variant="label" className="block">
                {t("calendar.filters.linked")}
              </Text>
              <Text as="span" variant="caption" className="block">
                {t("calendar.filters.linkedHint")}
              </Text>
            </label>
            <Switch id={linkedId} checked={showLinked} onCheckedChange={onShowLinkedChange} data-testid="calendar-filter-linked" />
          </div>
        )}

        {timeOff && onTimeOffChange && (
          <FilterSelect
            id="timeoff"
            label={t("calendar.filters.timeOff")}
            placeholder={t("calendar.filters.anyTimeOff")}
            options={TIME_OFF_KINDS.map((kind) => ({ value: kind, label: t(TIME_OFF_LABEL[kind]), meta: timeOff.counts[kind] }))}
            value={timeOff.selected}
            onChange={(next) => onTimeOffChange(next as TimeOffKind[])}
          />
        )}

        <FilterSelect
          id="status"
          label={t("calendar.filters.status")}
          placeholder={t("calendar.filters.anyStatus")}
          options={PULSE_FOCUSES.map((id) => ({ value: id, label: t(STATUS_LABEL[id]), meta: pulse.counts[id] }))}
          value={focuses}
          onChange={(next) => emit({ focuses: next as PulseFocus[] })}
        />

        {clientTypeOptions.length > 0 && (
          <FilterSelect
            id="client"
            label={t("calendar.filters.clientType")}
            placeholder={t("calendar.filters.anyClient")}
            options={clientTypeOptions.map((option) => ({ value: option.id, label: option.label, meta: option.count }))}
            value={clientTypes}
            onChange={(next) => emit({ clientTypes: next as ClientType[] })}
          />
        )}

        {resources.length > 0 && (
          <FilterSelect
            id="resource"
            label={t("calendar.filters.resource")}
            placeholder={t("calendar.filters.anyResource")}
            options={resources.map((resource) => ({
              value: resource.id,
              label: resource.name,
              meta: resource.count,
              description: resource.clashes > 0 ? t("calendar.filters.resourceClashes", { count: resource.clashes }) : resource.servicesLabel,
              leading: resource.clashes > 0 ? <TriangleAlert className="size-3.5 shrink-0 text-status-warning" aria-hidden /> : undefined,
            }))}
            value={resources.filter((resource) => resourceSelected(resource, serviceIds)).map((resource) => resource.id)}
            // Marcar un recurso suma sus servicios al filtro; quitarlo, los quita.
            onChange={(next) => {
              const before = resources.filter((resource) => resourceSelected(resource, serviceIds)).map((resource) => resource.id);
              const changed = resources.filter((resource) => next.includes(resource.id) !== before.includes(resource.id));
              emit({ serviceIds: changed.reduce<string[]>((ids, resource) => toggleResource(resource, ids), [...serviceIds]) });
            }}
          />
        )}

        {services.length > 0 && (
          <FilterSelect
            id="service"
            label={t("calendar.filters.service")}
            placeholder={t("calendar.filters.anyService")}
            options={services.map((service) => ({ value: service.id, label: service.name, meta: service.count, leading: <ScheduleColorDot color={service.color} /> }))}
            value={serviceIds}
            onChange={(next) => emit({ serviceIds: next })}
          />
        )}

        {active > 0 && (
          <Button variant="ghost" size="sm" onClick={() => {
              onChange({ focuses: [], serviceIds: [], clientTypes: [] });
              if (freeOnly) onFreeOnlyChange?.(false);
              if (showLinked) onShowLinkedChange?.(false);
              if (unconfirmed) onUnconfirmedChange?.(false);
              if (timeOffSelected > 0) onTimeOffChange?.([]);
            }}
            data-testid="calendar-filters-clear">
            {t("calendar.filters.clear")}
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Un grupo de filtros como un campo de varias opciones: lo marcado sale como chips, cada opción con su cuenta. */
function FilterSelect({ id, label, placeholder, options, value, onChange }: { id: string; label: string; placeholder: string; options: MultiSelectOption[]; value: readonly string[]; onChange: (next: string[]) => void }) {
  const t = useAppT();
  const fieldId = `calendar-filter-${id}`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="block">
        <Text as="span" variant="label">
          {label}
        </Text>
      </label>
      <MultiSelect
        id={fieldId}
        data-testid={fieldId}
        options={options}
        value={[...value]}
        onValueChange={onChange}
        placeholder={placeholder}
        searchPlaceholder={t("calendar.filters.search")}
        className="min-h-9 px-3 py-1.5"
      />
    </div>
  );
}
