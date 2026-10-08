import * as React from "react";
import { BadgeCheck, Ban, Check, Footprints, Globe, Link2, Repeat, Star, StickyNote, TriangleAlert, UserRoundPlus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ScheduleEvent, ScheduleMarkerIcon, ScheduleTone } from "./scheduleTypes";
import { scheduleColorClass } from "./scheduleUtils";
import "./schedule.css";

/**
 * La tarjeta de una cita dentro de la rejilla y la franja tachada de un
 * bloqueo.
 *
 * Dice tres cosas, en este orden: **quién** (el nombre y su etiqueta —el
 * tipo de cliente—), **en qué va** (la píldora de estado: «Ya ingresó», «En
 * silla», «Cobrada») y **qué se hace ahora** (el botón del siguiente
 * paso). Con `color` todas las tarjetas van sin borde y con el mismo relleno sólido
 * (tono suave de la marca en claro, gris en oscuro); el servicio se identifica por un círculo de color junto al nombre.
 * Con `fill: "category"` o `fill: "tone"` la tarjeta se tiñe del pastel de su color o de su tono,
 * mezclado con la superficie del tema (`.schedule-pastel` en schedule.css).
 *
 * Cuánto cuenta depende de su alto: en una línea, el nombre y el estado; con
 * dos, también el siguiente paso; con más sitio, el servicio y la hora. Lo
 * que no cabe vive en el tooltip.
 *
 * Una propuesta (`ghost`) se dibuja translúcida y con borde discontinuo: un
 * hueco sugerido o a dónde iría una cita si se reacomoda. Tocarla es aceptar.
 *
 * Las citas de un grupo (`group`: varios servicios de un mismo cliente, o su
 * familia) van rodeadas por un borde discontinuo de la marca y llevan la
 * píldora «2/3»; las que se pegan a otra de su columna pierden ese lado del
 * borde y el radio, así el contorno envuelve la visita entera y la costura
 * entre servicios queda como una línea tenue.
 *
 * Para no anidar un botón dentro de otro, abrirla es un botón estirado
 * detrás del contenido y la acción es otro botón por encima: el lector de
 * pantalla encuentra los dos y el ratón también.
 */

/** El color de la tarjeta: fondo teñido y un borde del mismo tono, sin filete lateral. */
const TONE_CARD: Record<ScheduleTone, string> = {
  primary: "border-primary/35 bg-primary/10",
  positive: "border-success/35 bg-success/10",
  warning: "border-warning/40 bg-warning/15",
  negative: "border-destructive/35 bg-destructive/10",
  info: "border-info/35 bg-info/10",
  neutral: "border-border bg-surface-muted",
  accent: "border-[color-mix(in_srgb,var(--color-indigo)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-indigo)_10%,transparent)]",
};

const TONE_BADGE: Record<ScheduleTone, string> = {
  primary: "bg-primary text-primary-foreground",
  positive: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning",
  negative: "bg-destructive/10 text-destructive",
  info: "bg-info/15 text-info",
  neutral: "bg-muted text-text-secondary",
  accent: "bg-[color-mix(in_srgb,var(--color-indigo)_15%,transparent)] text-[var(--color-indigo)]",
};

/** El punto de la píldora de estado. */
const TONE_DOT: Record<ScheduleTone, string> = {
  primary: "bg-primary",
  positive: "bg-success",
  warning: "bg-warning",
  negative: "bg-destructive",
  info: "bg-info",
  neutral: "bg-text-muted",
  accent: "bg-[var(--color-indigo)]",
};

const MARKER_ICON: Record<ScheduleMarkerIcon, LucideIcon> = {
  online: Globe,
  walkIn: Footprints,
  new: UserRoundPlus,
  note: StickyNote,
  paid: BadgeCheck,
  repeat: Repeat,
  requested: Star,
};

/** Con menos minutos que esto la tarjeta se considera corta (se usa cuando no llega el alto en píxeles). */
export const COMPACT_BELOW_MINUTES = 45;
/** Desde cuántos píxeles de alto cabe cada línea: la del estado, la del servicio, la de la hora y la del detalle. */
const TWO_LINES_FROM_PX = 46;
const SERVICE_FROM_PX = 76;
const TIME_FROM_PX = 100;
const DETAIL_FROM_PX = 124;
/** Píxeles por minuto con la densidad normal, para cuando solo se conocen los minutos. */
const DEFAULT_PX_PER_MINUTE = 56 / 30;

export interface ScheduleEventCardProps {
  event: ScheduleEvent;
  /** «10:30 – 11:00», ya formateado por quien sabe el idioma. */
  timeLabel: string;
  minutes: number;
  /** El alto que tendrá en pantalla: decide cuántas líneas caben. Sin él, se calcula de los minutos. */
  heightPx?: number;
  onOpen?: (event: ScheduleEvent) => void;
  /** Se está arrastrando: se eleva y deja de responder al ratón. */
  dragging?: boolean;
  /** Etiqueta de la sombra mientras se arrastra: la hora nueva. */
  dragLabel?: string;
  /** Mientras se arrastra, por qué ahí no cabe: la tarjeta se pinta en rojo. */
  dragReason?: string | null;
  onResizeStart?: (nativeEvent: React.PointerEvent<HTMLElement>) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const ScheduleEventCard = React.forwardRef<HTMLDivElement, ScheduleEventCardProps & Omit<React.HTMLAttributes<HTMLDivElement>, "style" | "className" | "title">>(
  function ScheduleEventCard({ event, timeLabel, minutes, heightPx, onOpen, dragging, dragLabel, dragReason, onResizeStart, className, style, ...rest }, ref) {
    const t = useT();
    const tone = event.tone ?? (event.kind === "block" ? "neutral" : "primary");
    const height = heightPx ?? minutes * DEFAULT_PX_PER_MINUTE;
    const oneLine = height < TWO_LINES_FROM_PX;
    const isBlock = event.kind === "block";
    const isGhost = Boolean(event.ghost);
    // Con color de la paleta categórica la tarjeta va sobria —superficie y borde neutros— y el color
    // vive solo en un círculo junto al nombre: se identifica el servicio sin teñir la agenda entera.
    const palette = event.color !== undefined && !isGhost && !isBlock;
    // Con `fill` la tarjeta se tiñe del pastel de su servicio o de su estado (lo pide la vista).
    const pastelClass =
      isGhost || isBlock || event.muted
        ? null
        : event.fill === "category" && event.color !== undefined
          ? scheduleColorClass(event.color)
          : event.fill === "tone"
            ? `schedule-tone-${tone}`
            : null;
    // Teñida por servicio, el punto sobra: la tarjeta entera ya es el color.
    const dot = palette && event.fill !== "category" ? <ScheduleColorDot color={event.color ?? 1} className="size-2.5" /> : null;
    const markers = event.markers ?? [];
    const group = event.group;
    const groupPill = group && group.size > 1 && (
      <span
        className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-primary/15 px-1 text-[10px] font-semibold leading-4 tabular-nums text-primary"
        role="img"
        aria-label={t("schedule.group", { index: group.index, total: group.size })}
      >
        <Link2 className="size-2.5" aria-hidden="true" />
        {t("schedule.groupShort", { index: group.index, total: group.size })}
      </span>
    );
    const status = event.urgent ? { label: event.urgent, tone: "negative" as const } : event.status;

    const statusPill = status && (
      <span
        className={cn(
          "inline-flex min-w-0 shrink items-center gap-1 rounded-full px-1.5 text-[10px] font-semibold leading-4",
          // Lo ya cerrado (cobrada) va relleno y con su marca: se distingue de un vistazo de lo que sigue abierto.
          // Lo ya cobrado se distingue con su marca y un verde tenue, sin pesar más que el resto.
          status.tone === "positive" ? "bg-success/15 text-success" : "bg-surface text-text-primary"
        )}
        data-status-tone={status.tone ?? "neutral"}
      >
        {status.tone === "positive" ? <Check className="size-2.5 shrink-0" aria-hidden="true" /> : <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", TONE_DOT[status.tone ?? "neutral"])} />}
        <span className="truncate">{status.label}</span>
      </span>
    );

    const warning = event.warning && (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="pointer-events-auto inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-warning/20 text-warning" role="img" aria-label={event.warning}>
            <TriangleAlert className="size-2.5" aria-hidden="true" />
          </span>
        </TooltipTrigger>
        <TooltipContent>{event.warning}</TooltipContent>
      </Tooltip>
    );

    const action = event.action && (
      <Button
        type="button"
        size="xs"
        variant="outline"
        className="pointer-events-auto ml-auto h-5 shrink-0 bg-surface px-1.5"
        onPointerDown={(nativeEvent) => nativeEvent.stopPropagation()}
        onClick={(nativeEvent) => {
          nativeEvent.stopPropagation();
          event.action?.onClick();
        }}
      >
        {event.action.icon}
        {event.action.label}
      </Button>
    );

    return (
      <div
        ref={ref}
        data-schedule-event={event.id}
        data-kind={event.kind ?? "appointment"}
        data-tone={tone}
        data-ghost={isGhost || undefined}
        data-flexible={event.flexible || undefined}
        data-group={group?.id}
        style={style}
        title={[event.title, group && group.size > 1 ? t("schedule.group", { index: group.index, total: group.size }) : null, event.badge?.label, status?.label, timeLabel, event.subtitle, event.note, event.warning, ...markers.map((marker) => marker.label)].filter(Boolean).join(" · ")}
        className={cn(
          // Las tarjetas de la agenda (neutral, pastel o vivo) van con esquinas rectas: bloques que se
          // apilan en la rejilla. Solo las de tono semántico conservan el radio.
          "group/event absolute overflow-hidden border text-left",
          pastelClass || palette ? "rounded-none" : "rounded-lg",
          "transition-[box-shadow,opacity] duration-fast ease-out-expo motion-reduce:transition-none",
          // Sin borde: el relleno sólido separa la tarjeta del fondo (`.schedule-card-fill` en schedule.css:
          // papel con sombra en claro, gris en oscuro). Al pasar el ratón cambia la sombra o el relleno, nunca un borde.
          pastelClass
            ? cn("schedule-pastel border-transparent", pastelClass)
            : palette
              ? "schedule-card-fill border-transparent bg-surface"
              : TONE_CARD[tone],
          event.flexible && !isGhost && "border-dashed",
          // Un grupo se rodea con un borde discontinuo de la marca; donde se pega a otra de su grupo pierde
          // ese lado del borde y el radio, y entre todas dibujan un solo contorno alrededor de la visita.
          // El color del borde lo pone schedule.css: el papel y el pastel lo vuelven transparente.
          group && !isGhost && "border-dashed",
          group?.joinTop && "rounded-t-none border-t-0",
          group?.joinBottom && "rounded-b-none border-b-0",
          isGhost && "z-raised border-dashed border-primary/70 bg-primary/5 opacity-85",
          event.muted && "opacity-60",
          event.faded && "opacity-30 saturate-50",
          dragging && "z-raised opacity-90 shadow-lg ring-2 ring-ring/40",
          dragging && dragReason && "ring-destructive/60",
          !event.locked && !isGhost && onOpen && "cursor-grab active:cursor-grabbing",
          isGhost && onOpen && "cursor-pointer",
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

        {group?.joinTop && <span aria-hidden="true" className="pointer-events-none absolute inset-x-2 top-0 border-t border-foreground/10" />}

        {onOpen && (
          <button
            type="button"
            aria-label={isGhost ? t("schedule.acceptProposal", { title: `${event.title}, ${timeLabel}` }) : t("schedule.open", { title: `${event.title}, ${timeLabel}` })}
            onClick={() => onOpen(event)}
            className="absolute inset-0 rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
          />
        )}

        {oneLine ? (
          /* Una línea: quién y en qué va. El siguiente paso se da al abrirla. */
          <div className="pointer-events-none relative flex h-full min-w-0 items-center gap-1.5 px-2">
            {isBlock && <Ban className="size-3.5 shrink-0 text-text-muted" aria-hidden="true" />}
            {dot}
            <span data-card-ink className={cn("min-w-[2.5rem] flex-1 truncate text-xs font-semibold text-text-primary", event.muted && "line-through")}>{event.title}</span>
            {groupPill}
            {warning}
            {statusPill ?? (isGhost && event.badge && <CardBadge badge={event.badge} tone={tone} />)}
          </div>
        ) : (
          <div className="pointer-events-none relative flex h-full min-w-0 flex-col gap-0.5 px-2 py-1">
            <div className="flex min-w-0 items-center gap-1.5">
              {isBlock && <Ban className="size-3.5 shrink-0 text-text-muted" aria-hidden="true" />}
              {dot}
              <span data-card-ink className={cn("min-w-0 flex-1 truncate text-xs font-semibold text-text-primary", event.muted && "line-through")}>{event.title}</span>
              {groupPill}
              {markers.length > 0 && <ScheduleMarkers markers={markers} />}
              {event.badge && <CardBadge badge={event.badge} tone={palette ? "neutral" : tone} sober={palette} />}
            </div>

            {event.note && <span className="truncate text-xs italic text-text-secondary">{event.note}</span>}
            {height >= SERVICE_FROM_PX && event.subtitle && <span data-card-ink className="truncate text-xs text-text-secondary">{event.subtitle}</span>}
            {height >= TIME_FROM_PX && !event.hideTime && <span className="truncate text-xs tabular-nums text-text-muted">{timeLabel}</span>}
            {height >= DETAIL_FROM_PX && event.detail && <span className="truncate text-xs text-text-muted">{event.detail}</span>}

            {(statusPill || warning || action) && (
              <div className="mt-auto flex min-w-0 items-center gap-1">
                {statusPill}
                {warning}
                {action}
              </div>
            )}
          </div>
        )}

        {dragging && (dragReason || dragLabel) && (
          <span
            className={cn(
              "pointer-events-none absolute right-1 top-1 max-w-[calc(100%-0.5rem)] truncate rounded-sm px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
              dragReason ? "bg-destructive text-destructive-foreground" : "bg-foreground text-background"
            )}
          >
            {dragReason ?? dragLabel}
          </span>
        )}

        {onResizeStart && !event.locked && !isGhost && (
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

/** La etiqueta junto al nombre: el tipo de cliente. */
function CardBadge({ badge, tone, sober = false }: { badge: NonNullable<ScheduleEvent["badge"]>; tone: ScheduleTone; sober?: boolean }) {
  // En una tarjeta sobria la etiqueta tampoco lleva color: se lee, no compite con el círculo del servicio.
  return <span className={cn("shrink-0 rounded-sm px-1 text-[10px] font-semibold uppercase leading-4 tracking-wide", sober ? TONE_BADGE.neutral : TONE_BADGE[badge.tone ?? tone])}>{badge.label}</span>;
}

/**
 * Los iconos de detalle junto al nombre (desde dos líneas de alto): cada uno con su significado para el
 * lector de pantalla. Pública para que otra vista de las mismas citas (la lista de la agenda) pinte los
 * mismos iconos que la tarjeta.
 */
export function ScheduleMarkers({ markers }: { markers: readonly NonNullable<ScheduleEvent["markers"]>[number][] }) {
  return (
    <span className="flex shrink-0 items-center gap-1 text-text-muted" role="list">
      {markers.map((marker) => {
        const Icon = MARKER_ICON[marker.icon];
        return <Icon key={marker.id} className="size-3" role="listitem" aria-label={marker.label} />;
      })}
    </span>
  );
}

/** El punto de un color de la paleta categórica: la leyenda de una lista (un servicio, una categoría). */
export function ScheduleColorDot({ color, className }: { color: number; className?: string }) {
  return <span aria-hidden="true" className={cn("inline-block size-2 shrink-0 rounded-full", scheduleColorClass(color), className)} style={{ backgroundColor: "hsl(var(--schedule-color))" }} />;
}
