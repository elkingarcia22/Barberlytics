import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale, useT } from "@/i18n";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { ScheduleDrop, ScheduleEvent, ScheduleResource, ScheduleResourceAction, ScheduleSlot } from "./scheduleTypes";
import { ScheduleEventCard } from "./ScheduleEventCard";
import { useScheduleDrag, type DragPreview } from "./useScheduleDrag";
import {
  atMinutes,
  earliestWorkingMinute,
  eventMinutes,
  eventsForResource,
  formatClock,
  formatClockRange,
  initialsOf,
  isWorkingAt,
  layoutEvents,
  minutesOfDay,
  nowPercent,
  SLOT_HEIGHT_PX,
  slotMinutes,
} from "./scheduleUtils";

/**
 * RESOURCE DAY GRID
 *
 * El día de una barbería: una columna por barbero, las horas hacia abajo y
 * cada cita como tarjeta dentro de la columna de quien la atiende. Las horas
 * en las que alguien no trabaja salen sombreadas, una línea marca «ahora» y
 * cada hueco libre es un botón para agendar ahí mismo.
 *
 * La rejilla es su propia región de scroll: así la fila de barberos y la
 * columna de horas se quedan fijas mientras se recorre la jornada, y al
 * abrir el día se coloca sola en la hora actual (o en la primera hora en
 * que alguien trabaja).
 *
 * Las tarjetas se arrastran a otra hora o a otra columna y se estiran desde
 * abajo. El componente no guarda nada: avisa por `onEventMove` y
 * `onEventResize` y quien lo monta decide si acepta el cambio.
 */

export interface ResourceDayGridProps {
  date: Date;
  resources: readonly ScheduleResource[];
  events: readonly ScheduleEvent[];
  /** Primera y última hora visibles (la última exclusiva): de 6 a 24 por defecto. */
  startHour?: number;
  endHour?: number;
  /** Minutos por franja de la rejilla. */
  slotMinutes?: number;
  /** El «ahora» de la línea roja. Inyectable para que la doc y las pruebas no cambien cada día. */
  now?: Date;
  onSlotClick?: (slot: ScheduleSlot) => void;
  onEventClick?: (event: ScheduleEvent) => void;
  onEventMove?: (event: ScheduleEvent, drop: ScheduleDrop) => void;
  onEventResize?: (event: ScheduleEvent, drop: ScheduleDrop) => void;
  /** Lo que se puede hacer desde el nombre de un recurso (ver perfil, bloquear…). */
  resourceActions?: (resource: ScheduleResource) => readonly ScheduleResourceAction[];
  /** Alto de la región con scroll. Por defecto, lo que queda de pantalla. */
  height?: string;
  className?: string;
}

const DEFAULT_START_HOUR = 6;
const DEFAULT_END_HOUR = 24;
const DEFAULT_SLOT_MINUTES = 30;
const DEFAULT_HEIGHT = "max(28rem, calc(100dvh - 17rem))";
/** Ancho de la columna de horas y mínimo de cada columna de recurso. */
const GUTTER = "4.5rem";
const COLUMN_MIN = "12.5rem";

export function ResourceDayGrid({
  date,
  resources,
  events,
  startHour = DEFAULT_START_HOUR,
  endHour = DEFAULT_END_HOUR,
  slotMinutes: step = DEFAULT_SLOT_MINUTES,
  now,
  onSlotClick,
  onEventClick,
  onEventMove,
  onEventResize,
  resourceActions,
  height = DEFAULT_HEIGHT,
  className,
}: ResourceDayGridProps) {
  const t = useT();
  const { current } = useLocale();
  const intl = current.intl;
  const slots = React.useMemo(() => slotMinutes(startHour, endHour, step), [startHour, endHour, step]);
  const dayStart = slots[0];
  const dayEnd = slots[slots.length - 1] + step;
  const nowDate = React.useMemo(() => now ?? new Date(), [now]);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const { preview, bind, wasDragged } = useScheduleDrag({ bodyRef, day: date, dayStart, dayEnd, step, onMove: onEventMove, onResize: onEventResize });

  // Al abrir un día la rejilla se coloca sola: en «ahora» si es hoy, y si no
  // una hora antes de que alguien empiece a trabajar.
  React.useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const pxPerMinute = SLOT_HEIGHT_PX / step;
    const nowPct = nowPercent(nowDate, date, dayStart, dayEnd);
    const target = nowPct !== null ? minutesOfDay(nowDate) - 60 : (earliestWorkingMinute(resources) ?? dayStart) - 60;
    node.scrollTop = Math.max(0, (target - dayStart) * pxPerMinute);
  }, [date, dayEnd, dayStart, nowDate, resources, step]);

  const columns = `${GUTTER} repeat(${Math.max(resources.length, 1)}, minmax(${COLUMN_MIN}, 1fr))`;
  const marker = nowPercent(nowDate, date, dayStart, dayEnd);

  const openEvent = (event: ScheduleEvent) => {
    if (wasDragged()) return;
    onEventClick?.(event);
  };

  return (
    <section aria-label={t("schedule.grid")} className={cn("relative isolate overflow-hidden rounded-xl border border-border bg-surface", className)}>
      {marker !== null && <p className="sr-only">{t("schedule.now", { time: formatClock(nowDate, intl) })}</p>}
      <div ref={scrollRef} className="relative overflow-auto overscroll-contain" style={{ maxHeight: height }}>
        <div className="grid" style={{ gridTemplateColumns: columns, width: `max(100%, calc(${GUTTER} + ${resources.length} * ${COLUMN_MIN}))` }}>
          {/* Cabecera pegajosa: un barbero por columna. La esquina va al final
              del DOM para pintarse encima cuando las dos pegajosas se cruzan. */}
          {resources.map((resource) => (
            <ResourceHeader key={resource.id} resource={resource} actions={resourceActions?.(resource)} />
          ))}
          <div className="sticky left-0 top-0 z-sticky border-b border-r border-border bg-surface" style={{ gridColumn: 1, gridRow: 1 }} aria-hidden="true" />

          {/* Columna de horas; la pastilla de «ahora» vive aquí para quedarse a la vista al desplazar. */}
          <div className="sticky left-0 z-raised border-r border-border bg-surface" style={{ gridColumn: 1, gridRow: 2 }} aria-hidden="true">
            <div className="relative">
              {slots.map((minute) => (
                <div key={minute} className="relative border-b border-border/60 pr-2 text-right" style={{ height: SLOT_HEIGHT_PX }}>
                  <span className="-translate-y-1/2 inline-block text-xs tabular-nums text-text-muted">{formatClock(atMinutes(date, minute), intl)}</span>
                </div>
              ))}
              {marker !== null && (
                <span
                  className="absolute left-1 inline-flex -translate-y-1/2 items-center rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-destructive-foreground shadow-card"
                  style={{ top: `${marker}%` }}
                >
                  {formatClock(nowDate, intl)}
                </span>
              )}
            </div>
          </div>

          {/* Las columnas: comparten cuerpo para que la línea de «ahora» las cruce. */}
          <div ref={bodyRef} className="relative grid" style={{ gridColumn: "2 / -1", gridRow: 2, gridTemplateColumns: `repeat(${Math.max(resources.length, 1)}, minmax(${COLUMN_MIN}, 1fr))` }}>
            {resources.map((resource) => (
              <ResourceColumn
                key={resource.id}
                date={date}
                resource={resource}
                events={eventsForResource(events, date, resource.id)}
                slots={slots}
                dayStart={dayStart}
                dayEnd={dayEnd}
                intl={intl}
                preview={preview}
                bind={bind}
                canResize={Boolean(onEventResize)}
                onSlotClick={onSlotClick}
                onOpen={onEventClick ? openEvent : undefined}
              />
            ))}

            {marker !== null && (
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 z-raised flex items-center" style={{ top: `${marker}%` }}>
                <span className="h-0.5 flex-1 bg-destructive" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- header */

function ResourceHeader({ resource, actions }: { resource: ScheduleResource; actions?: readonly ScheduleResourceAction[] }) {
  const t = useT();
  const identity = (
    <>
      <Avatar size="default">
        {resource.avatarUrl && <AvatarImage src={resource.avatarUrl} alt="" />}
        <AvatarFallback>{initialsOf(resource.name)}</AvatarFallback>
      </Avatar>
      <span className="flex min-w-0 flex-col text-left">
        <span className="truncate text-sm font-semibold text-text-primary">{resource.name}</span>
        {resource.subtitle && <span className="truncate text-xs text-text-muted">{resource.subtitle}</span>}
      </span>
    </>
  );

  return (
    <div className="sticky top-0 z-sticky flex min-w-0 items-center justify-center border-b border-l border-border bg-surface px-2 py-2">
      {actions && actions.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={t("schedule.resourceMenu", { name: resource.name })}
              className={cn(
                "flex min-w-0 max-w-full items-center gap-2 rounded-lg px-2 py-1",
                "transition-colors duration-fast ease-out-expo hover:bg-surface-subtle motion-reduce:transition-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              )}
            >
              {identity}
              <ChevronDown className="size-4 shrink-0 text-text-muted" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            {actions.map((action) => (
              <DropdownMenuItem key={action.id} onSelect={() => action.onSelect()}>
                {action.icon}
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex min-w-0 max-w-full items-center gap-2 px-2 py-1">{identity}</div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- column */

interface ResourceColumnProps {
  date: Date;
  resource: ScheduleResource;
  events: ScheduleEvent[];
  slots: number[];
  dayStart: number;
  dayEnd: number;
  intl: string;
  preview: DragPreview | null;
  bind: ReturnType<typeof useScheduleDrag>["bind"];
  canResize: boolean;
  onSlotClick?: (slot: ScheduleSlot) => void;
  onOpen?: (event: ScheduleEvent) => void;
}

function ResourceColumn({ date, resource, events, slots, dayStart, dayEnd, intl, preview, bind, canResize, onSlotClick, onOpen }: ResourceColumnProps) {
  const t = useT();
  const placed = React.useMemo(() => layoutEvents(events, dayStart, dayEnd), [events, dayStart, dayEnd]);
  const total = dayEnd - dayStart;
  const worksToday = (resource.workingHours?.length ?? 0) > 0;
  // Lo que se arrastra hacia esta columna desde otra se dibuja aquí como sombra.
  const incoming = preview && preview.mode === "move" && preview.resourceId === resource.id && !events.some((event) => event.id === preview.eventId) ? preview : null;

  return (
    <div data-resource-id={resource.id} className="relative border-l border-border">
      {slots.map((minute) => {
        const slotDate = atMinutes(date, minute);
        const time = formatClock(slotDate, intl);
        const working = isWorkingAt(resource.workingHours, minute);
        return (
          <button
            key={minute}
            type="button"
            aria-label={working ? t("schedule.slotCreate", { time, name: resource.name }) : t("schedule.slotOffHours", { time, name: resource.name })}
            onClick={() => onSlotClick?.({ resourceId: resource.id, start: slotDate, isWorking: working })}
            className={cn(
              "block w-full border-b border-border/60",
              "transition-colors duration-fast ease-out-expo motion-reduce:transition-none",
              working ? "bg-surface hover:bg-primary/5" : "bg-surface-muted/70 hover:bg-surface-muted",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
            )}
            style={{ height: SLOT_HEIGHT_PX }}
          />
        );
      })}

      {!worksToday && (
        <span className="pointer-events-none absolute inset-x-0 top-2 text-center text-xs text-text-muted">{t("schedule.notWorking")}</span>
      )}

      <div className="pointer-events-none absolute inset-0 px-1">
        {placed.map(({ event, top, height, column, columns }) => {
          const dragged = preview?.eventId === event.id ? preview : null;
          const start = dragged ? atMinutes(date, dragged.startMin) : event.start;
          const end = dragged ? atMinutes(date, dragged.endMin) : event.end;
          const shownTop = dragged ? ((dragged.startMin - dayStart) / total) * 100 : top;
          const shownHeight = dragged ? ((dragged.endMin - dragged.startMin) / total) * 100 : height;
          const isBlock = event.kind === "block";
          const moveHandlers = onOpen || canResize ? bind(event, "move") : {};
          return (
            <ScheduleEventCard
              key={event.id}
              event={event}
              minutes={eventMinutes({ ...event, start, end })}
              timeLabel={formatClockRange(start, end, intl)}
              onOpen={onOpen}
              dragging={Boolean(dragged) && dragged?.resourceId === resource.id}
              dragLabel={dragged ? formatClockRange(start, end, intl) : undefined}
              onResizeStart={canResize && !isBlock ? bind(event, "resize").onPointerDown : undefined}
              className={cn("pointer-events-auto", isBlock && "z-base", dragged && dragged.resourceId !== resource.id && "opacity-30")}
              style={{
                top: `${shownTop}%`,
                height: `${shownHeight}%`,
                left: `calc(${(column / columns) * 100}% + 2px)`,
                width: `calc(${100 / columns}% - 4px)`,
              }}
              {...moveHandlers}
            />
          );
        })}

        {incoming && (
          <div
            aria-hidden="true"
            className="absolute inset-x-1 rounded-lg border-2 border-dashed border-primary/60 bg-primary/10"
            style={{ top: `${((incoming.startMin - dayStart) / total) * 100}%`, height: `${((incoming.endMin - incoming.startMin) / total) * 100}%` }}
          >
            <span className="absolute right-1 top-1 rounded-sm bg-foreground px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-background">
              {formatClockRange(atMinutes(date, incoming.startMin), atMinutes(date, incoming.endMin), intl)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
