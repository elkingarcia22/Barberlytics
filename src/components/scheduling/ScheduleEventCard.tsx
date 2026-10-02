import * as React from "react";
import { Ban, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ScheduleEvent, ScheduleTone } from "./scheduleTypes";

/**
 * La tarjeta de una cita dentro de la rejilla y la franja tachada de un
 * bloqueo. Con menos de una hora se compacta a una línea; con más, cuenta
 * el servicio, la hora y el siguiente paso.
 *
 * Para no anidar un botón dentro de otro, abrirla es un botón estirado
 * detrás del contenido y la acción de la esquina es otro botón por encima:
 * el lector de pantalla encuentra los dos y el ratón también.
 */

const TONE_CARD: Record<ScheduleTone, string> = {
  primary: "border-l-primary bg-primary/10",
  positive: "border-l-success bg-success/10",
  warning: "border-l-warning bg-warning/15",
  negative: "border-l-destructive bg-destructive/10",
  info: "border-l-info bg-info/10",
  neutral: "border-l-border bg-surface-muted",
};

const TONE_BADGE: Record<ScheduleTone, string> = {
  primary: "bg-primary text-primary-foreground",
  positive: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning",
  negative: "bg-destructive/10 text-destructive",
  info: "bg-info/15 text-info",
  neutral: "bg-muted text-text-secondary",
};

/** Con menos minutos que esto la tarjeta se lee en una línea. */
export const COMPACT_BELOW_MINUTES = 45;
/** A partir de cuántos minutos cabe cada línea extra: el servicio, la hora, el detalle. */
const SUBTITLE_FROM_MINUTES = 45;
const TIME_FROM_MINUTES = 60;
const DETAIL_FROM_MINUTES = 75;

export interface ScheduleEventCardProps {
  event: ScheduleEvent;
  /** «10:30 – 11:00», ya formateado por quien sabe el idioma. */
  timeLabel: string;
  minutes: number;
  onOpen?: (event: ScheduleEvent) => void;
  /** Se está arrastrando: se eleva y deja de responder al ratón. */
  dragging?: boolean;
  /** Etiqueta de la sombra mientras se arrastra: la hora nueva. */
  dragLabel?: string;
  onResizeStart?: (nativeEvent: React.PointerEvent<HTMLElement>) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const ScheduleEventCard = React.forwardRef<HTMLDivElement, ScheduleEventCardProps & Omit<React.HTMLAttributes<HTMLDivElement>, "style" | "className" | "title">>(
  function ScheduleEventCard({ event, timeLabel, minutes, onOpen, dragging, dragLabel, onResizeStart, className, style, ...rest }, ref) {
    const t = useT();
    const tone = event.tone ?? (event.kind === "block" ? "neutral" : "primary");
    const compact = minutes < COMPACT_BELOW_MINUTES;
    const isBlock = event.kind === "block";

    return (
      <div
        ref={ref}
        data-schedule-event={event.id}
        data-kind={event.kind ?? "appointment"}
        style={style}
        className={cn(
          "group/event absolute overflow-hidden rounded-lg border border-border/60 border-l-4 text-left shadow-card",
          "transition-[box-shadow,opacity] duration-fast ease-out-expo motion-reduce:transition-none",
          TONE_CARD[tone],
          event.muted && "opacity-60",
          dragging && "z-raised opacity-90 shadow-lg ring-2 ring-ring/40",
          !event.locked && onOpen && "cursor-grab active:cursor-grabbing",
          className
        )}
        {...rest}
      >
        {isBlock && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: "repeating-linear-gradient(135deg, hsl(var(--foreground) / 0.06) 0 6px, transparent 6px 14px)" }}
          />
        )}

        {onOpen && (
          <button
            type="button"
            aria-label={t("schedule.open", { title: `${event.title}, ${timeLabel}` })}
            onClick={() => onOpen(event)}
            className="absolute inset-0 rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
          />
        )}

        <div className={cn("pointer-events-none relative flex h-full flex-col gap-0.5 px-2 py-1", compact && "flex-row items-center gap-2")}>
          <div className="flex min-w-0 items-center gap-1.5">
            {isBlock && <Ban className="size-3.5 shrink-0 text-text-muted" aria-hidden="true" />}
            <span className={cn("truncate text-xs font-semibold text-text-primary", event.muted && "line-through")}>{event.title}</span>
            {event.badge && (
              <span className={cn("shrink-0 rounded-sm px-1 text-[10px] font-semibold uppercase leading-4 tracking-wide", TONE_BADGE[event.badge.tone ?? tone])}>
                {event.badge.label}
              </span>
            )}
          </div>

          {compact ? (
            <span className="ml-auto shrink-0 text-xs tabular-nums text-text-muted">{timeLabel}</span>
          ) : (
            <>
              {event.subtitle && minutes >= SUBTITLE_FROM_MINUTES && <span className="truncate text-xs text-text-secondary">{event.subtitle}</span>}
              {minutes >= TIME_FROM_MINUTES && <span className="truncate text-xs tabular-nums text-text-muted">{timeLabel}</span>}
              {event.detail && minutes >= DETAIL_FROM_MINUTES && <span className="truncate text-xs text-text-muted">{event.detail}</span>}
            </>
          )}

          {(event.warning || event.action) && (
            <div className={cn("flex items-center gap-1", compact ? "shrink-0" : "mt-auto justify-between pt-1")}>
              {event.warning ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="pointer-events-auto inline-flex size-5 items-center justify-center rounded-full border border-warning/50 text-warning" aria-label={event.warning}>
                      <TriangleAlert className="size-3" aria-hidden="true" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{event.warning}</TooltipContent>
                </Tooltip>
              ) : (
                <span />
              )}
              {event.action && (
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  className="pointer-events-auto"
                  onPointerDown={(nativeEvent) => nativeEvent.stopPropagation()}
                  onClick={(nativeEvent) => {
                    nativeEvent.stopPropagation();
                    event.action?.onClick();
                  }}
                >
                  {event.action.icon}
                  {event.action.label}
                </Button>
              )}
            </div>
          )}
        </div>

        {dragging && dragLabel && (
          <span className="pointer-events-none absolute right-1 top-1 rounded-sm bg-foreground px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-background">
            {dragLabel}
          </span>
        )}

        {onResizeStart && !event.locked && (
          <span
            role="presentation"
            aria-hidden="true"
            title={t("schedule.resize")}
            onPointerDown={(nativeEvent) => {
              nativeEvent.stopPropagation();
              onResizeStart(nativeEvent);
            }}
            className={cn(
              "absolute inset-x-0 bottom-0 flex h-2.5 cursor-ns-resize items-end justify-center opacity-0",
              "transition-opacity duration-fast group-hover/event:opacity-100 motion-reduce:transition-none"
            )}
          >
            <span className="mb-0.5 h-1 w-8 rounded-full bg-text-muted/60" />
          </span>
        )}
      </div>
    );
  }
);
