import * as React from "react";
import {
  Banknote,
  CircleDot,
  Clock,
  Crown,
  Droplet,
  Globe,
  Palette,
  Repeat,
  RotateCcw,
  Rows3,
  Scissors,
  Sparkles,
  Star,
  StickyNote,
  StepForward,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { SegmentedControl } from "@/components/selection";
import { scheduleColorClass, type ScheduleDensity, type ScheduleTone } from "@/components/scheduling";
import { DENSITY_OPTIONS } from "./calendarDensity";
import type { CalendarCardPref, CalendarCardPrefs } from "./calendarCardPrefs";
import { CALENDAR_COLOR_BY, STAGE_FILL, clientTypeTone, type CalendarColorBy } from "./calendarModel";
import { PULSE_FOCUSES, type PulseFocus } from "./pulseModel";
import type { ClientTypeFilterOption, ServiceFilterOption } from "./CalendarFilters";

/**
 * Cómo se ve la agenda, separado de qué se ve (eso es `CalendarFilters`). Es
 * un panel de ajustes agrupados —filas con icono, nombre y control, en
 * bloques redondeados— con tres partes: de qué se tiñen las tarjetas (con su
 * leyenda), qué cuenta cada tarjeta y qué avisos lleva con icono, y la
 * densidad de la rejilla. Nada de esto apaga una cita.
 */

export interface CalendarViewOptionsProps {
  colorBy: CalendarColorBy;
  onColorByChange: (next: CalendarColorBy) => void;
  /** Los servicios del día, para la leyenda de «Servicio». */
  services: readonly ServiceFilterOption[];
  /** Los tipos de cliente, para la leyenda de «Cliente». */
  clientTypes: readonly ClientTypeFilterOption[];
  card: CalendarCardPrefs;
  onCardChange: (key: CalendarCardPref, value: boolean) => void;
  onCardReset: () => void;
  /** La densidad solo aplica a la rejilla del día; sin ella, la sección no sale. */
  density?: ScheduleDensity;
  onDensityChange?: (density: ScheduleDensity) => void;
}

const COLOR_BY_LABEL: Record<CalendarColorBy, AppMessageKey> = {
  neutral: "calendar.view.colorBy.neutral",
  service: "calendar.view.colorBy.service",
  status: "calendar.view.colorBy.status",
  client: "calendar.view.colorBy.client",
};

const DENSITY_LABEL: Record<ScheduleDensity, AppMessageKey> = {
  compact: "calendar.density.compact",
  normal: "calendar.density.normal",
  wide: "calendar.density.wide",
};

const STAGE_LABEL: Record<PulseFocus, AppMessageKey> = {
  late: "calendar.live.late",
  toCollect: "calendar.live.toCollect",
  waiting: "calendar.live.waiting",
  seated: "calendar.live.seated",
  upcoming: "calendar.live.upcoming",
  paid: "calendar.live.paid",
};

interface PrefRow {
  key: CalendarCardPref;
  icon: LucideIcon;
  label: AppMessageKey;
}

/** Lo que dice la tarjeta, en el orden en que se lee: quién, qué, cuánto, cuándo, en qué va y qué sigue. */
const CONTENT_ROWS: readonly PrefRow[] = [
  { key: "clientType", icon: Crown, label: "calendar.view.card.clientType" },
  { key: "service", icon: Scissors, label: "calendar.view.card.service" },
  { key: "price", icon: Banknote, label: "calendar.view.card.price" },
  { key: "time", icon: Clock, label: "calendar.view.card.time" },
  { key: "status", icon: CircleDot, label: "calendar.view.card.status" },
  { key: "nextStep", icon: StepForward, label: "calendar.view.card.nextStep" },
];

/** Los avisos con icono, de lo que más cambia el servicio a lo que solo informa. */
const SIGNAL_ROWS: readonly PrefRow[] = [
  { key: "notes", icon: StickyNote, label: "calendar.view.signal.notes" },
  { key: "requested", icon: Star, label: "calendar.view.signal.requested" },
  { key: "firstVisit", icon: Sparkles, label: "calendar.view.signal.firstVisit" },
  { key: "origin", icon: Globe, label: "calendar.view.signal.origin" },
  { key: "repeat", icon: Repeat, label: "calendar.view.signal.repeat" },
];

export function CalendarViewOptions({ colorBy, onColorByChange, services, clientTypes, card, onCardChange, onCardReset, density, onDensityChange }: CalendarViewOptionsProps) {
  const t = useAppT();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" aria-label={t("calendar.view.title")} title={t("calendar.view.title")} data-testid="calendar-view-options">
          <SlidersHorizontal />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="max-h-[min(80vh,44rem)] w-80 space-y-4 overflow-y-auto overscroll-contain bg-surface-subtle p-3"
        data-testid="calendar-view-panel"
      >
        <SettingsGroup title={t("calendar.view.group.color")}>
          {/* Segmentado y no un desplegable: la lista de un Select se abre fuera del panel, y elegir
              en ella cerraba el panel antes de aplicar el cambio. */}
          <SettingsRow icon={Palette} label={t("calendar.view.colorBy.label")} stacked>
            <SegmentedControl
              size="sm"
              fullWidth
              ariaLabel={t("calendar.view.colorBy.label")}
              options={CALENDAR_COLOR_BY.map((option) => ({ value: option, label: t(COLOR_BY_LABEL[option]) }))}
              value={colorBy}
              onChange={(value) => onColorByChange(value as CalendarColorBy)}
            />
          </SettingsRow>
          {colorBy !== "neutral" && (
            <SettingsRow icon={Droplet} label={t("calendar.view.colorStyle.label")}>
              <SegmentedControl
                size="sm"
                className="w-auto"
                ariaLabel={t("calendar.view.colorStyle.label")}
                options={[
                  { value: "pastel", label: t("calendar.view.colorStyle.pastel") },
                  { value: "vivid", label: t("calendar.view.colorStyle.vivid") },
                ]}
                value={card.vivid ? "vivid" : "pastel"}
                onChange={(value) => onCardChange("vivid", value === "vivid")}
              />
            </SettingsRow>
          )}
          <ColorLegend colorBy={colorBy} services={services} clientTypes={clientTypes} />
        </SettingsGroup>

        <SettingsGroup title={t("calendar.view.group.card")}>
          {CONTENT_ROWS.map((row) => (
            <SwitchSettingsRow key={row.key} row={row} checked={card[row.key]} onChange={onCardChange} />
          ))}
        </SettingsGroup>

        <SettingsGroup title={t("calendar.view.group.signals")} footer={t("calendar.view.group.signalsHint")}>
          {SIGNAL_ROWS.map((row) => (
            <SwitchSettingsRow key={row.key} row={row} checked={card[row.key]} onChange={onCardChange} />
          ))}
        </SettingsGroup>

        {density && onDensityChange && (
          <SettingsGroup title={t("calendar.view.group.grid")}>
            <SettingsRow icon={Rows3} label={t("calendar.filters.density")} stacked>
              <SegmentedControl
                size="sm"
                fullWidth
                ariaLabel={t("calendar.density.label")}
                options={DENSITY_OPTIONS.map((option) => ({ value: option, label: t(DENSITY_LABEL[option]) }))}
                value={density}
                onChange={(value) => onDensityChange(value as ScheduleDensity)}
              />
            </SettingsRow>
          </SettingsGroup>
        )}

        <Button variant="ghost" size="sm" className="w-full text-text-secondary" onClick={onCardReset} data-testid="calendar-view-reset">
          <RotateCcw />
          {t("calendar.view.reset")}
        </Button>
      </PopoverContent>
    </Popover>
  );
}

/** Un bloque de ajustes: título pequeño encima, filas separadas por un filo y una nota opcional debajo. */
function SettingsGroup({ title, footer, children }: { title: string; footer?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1.5" aria-label={title}>
      <h3 className="px-1 text-xs font-semibold text-text-secondary">{title}</h3>
      <div className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border/70 bg-surface">{children}</div>
      {footer && <p className="px-1 text-xs leading-snug text-text-muted">{footer}</p>}
    </section>
  );
}

/** Una fila: icono, nombre y su control a la derecha (o debajo, si es ancho). */
function SettingsRow({ icon: Icon, label, htmlFor, stacked = false, children }: { icon: LucideIcon; label: string; htmlFor?: string; stacked?: boolean; children: React.ReactNode }) {
  const name = (
    <span className="flex min-w-0 flex-1 items-center gap-2.5">
      <Icon className="size-4 shrink-0 text-text-muted" aria-hidden="true" />
      {htmlFor ? (
        <label htmlFor={htmlFor} className="min-w-0 flex-1 cursor-pointer truncate text-sm text-text-primary">
          {label}
        </label>
      ) : (
        <span className="min-w-0 flex-1 truncate text-sm text-text-primary">{label}</span>
      )}
    </span>
  );
  if (stacked) {
    return (
      <div className="space-y-2 px-3 py-2.5">
        {name}
        {children}
      </div>
    );
  }
  return (
    <div className="flex min-h-10 items-center gap-3 px-3 py-1.5">
      {name}
      {children}
    </div>
  );
}

function SwitchSettingsRow({ row, checked, onChange }: { row: PrefRow; checked: boolean; onChange: (key: CalendarCardPref, value: boolean) => void }) {
  const t = useAppT();
  const id = React.useId();
  return (
    <SettingsRow icon={row.icon} label={t(row.label)} htmlFor={id}>
      <Switch id={id} checked={checked} onCheckedChange={(next) => onChange(row.key, next)} data-testid={`calendar-card-${row.key}`} />
    </SettingsRow>
  );
}

/** La leyenda del color elegido: cada muestra es el mismo pastel que pinta las tarjetas. */
function ColorLegend({ colorBy, services, clientTypes }: { colorBy: CalendarColorBy; services: readonly ServiceFilterOption[]; clientTypes: readonly ClientTypeFilterOption[] }) {
  const t = useAppT();
  if (colorBy === "neutral") {
    return <p className="px-3 py-2.5 text-xs leading-snug text-text-muted">{t("calendar.view.colorBy.neutralHint")}</p>;
  }
  const items =
    colorBy === "service"
      ? services.map((service) => ({ id: service.id, label: service.name, swatch: scheduleColorClass(service.color) }))
      : colorBy === "client"
        ? clientTypes.map((type) => ({ id: type.id, label: type.label, swatch: toneClass(clientTypeTone(type.id)) }))
        : PULSE_FOCUSES.map((stage) => ({ id: stage, label: t(STAGE_LABEL[stage]), swatch: toneClass(STAGE_FILL[stage]) }));
  return (
    <ul className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto overscroll-contain px-3 py-2.5" data-testid={`calendar-view-legend-${colorBy}`}>
      {items.map((item) => (
        <li key={item.id} className={cn("schedule-pastel rounded-md border border-transparent px-2 py-0.5 text-xs text-text-primary", item.swatch)}>
          {item.label}
        </li>
      ))}
    </ul>
  );
}

const toneClass = (tone: ScheduleTone): string => `schedule-tone-${tone}`;
