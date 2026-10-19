import * as React from "react";
import { addDays, format } from "date-fns";
import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { calendarLocale } from "@/components/date/calendarLocale";
import { RailButton, useRailPopoutSide } from "@/components/action-rail";
import { formatClock } from "@/components/scheduling";
import { Text } from "@/components/typography";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { appointmentStart, findBarber, findClient, servicesOf, type ModelContext } from "./calendarModel";
import { AppointmentStatusBadge, ClientAvatar } from "./calendarShared";
import { buildSearchIndex, searchAppointments } from "./searchModel";
import { useRangeQuery } from "./queries";
import type { Appointment } from "./types";

/**
 * El buscador de la agenda, en la barra flotante junto a «Crear cita»: una
 * lupa (su nombre en el tooltip) que al tocarla se abre hacia la derecha en un
 * campo, y encima, la lista de citas que coinciden. Busca por todo lo que se
 * pregunta en el mostrador —nombre, celular, barbero, servicio, estado, tipo
 * de cliente, en línea o sin cita, notas, día y hora— en el mes pasado y los
 * próximos 45 días. Elegir una lleva a su día y abre su panel.
 */

/** Lo que abarca la búsqueda: un mes hacia atrás y mes y medio hacia delante. */
const DAYS_BACK = 30;
const DAYS_AHEAD = 45;
/** El ancho del campo abierto. */
const OPEN_WIDTH = 288;

export interface CalendarSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  ctx: ModelContext;
  /** El barbero que mira solo su columna: el buscador tampoco le muestra las de los demás. */
  ownBarberId: string | null;
  onSelect: (appointment: Appointment) => void;
}

export function CalendarSearch({ open, onOpenChange, branchId, ctx, ownBarberId, onSelect }: CalendarSearchProps) {
  const t = useAppT();
  const { locale } = useLocale();
  const side = useRailPopoutSide();
  const dateLocale = calendarLocale(locale);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const now = React.useMemo(() => ctx.now ?? new Date(), [ctx.now]);
  const from = format(addDays(now, -DAYS_BACK), "yyyy-MM-dd");
  const to = format(addDays(now, DAYS_AHEAD), "yyyy-MM-dd");
  const range = useRangeQuery(branchId, from, to, open);
  const deferred = React.useDeferredValue(query);

  const index = React.useMemo(() => {
    const items = (range.data?.items ?? []).filter((item) => !ownBarberId || item.barberId === ownBarberId);
    return buildSearchIndex({ appointments: items, ctx, t, dateLocale });
  }, [range.data, ownBarberId, ctx, t, dateLocale]);
  const result = React.useMemo(() => searchAppointments(index, deferred, now), [index, deferred, now]);

  const close = () => {
    setQuery("");
    setActive(0);
    onOpenChange(false);
  };
  const pick = (appointment: Appointment) => {
    onSelect(appointment);
    close();
  };

  if (!open) {
    return <RailButton icon={<Search className="size-5" strokeWidth={2} />} label={t("calendar.search.label")} onClick={() => onOpenChange(true)} />;
  }

  const hasQuery = deferred.trim().length > 0;

  return (
    <Popover open onOpenChange={(next) => !next && close()}>
      <PopoverAnchor asChild>
        <motion.div
          ref={anchorRef}
          initial={{ width: 40, opacity: 0.6 }}
          animate={{ width: OPEN_WIDTH, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
          className="relative flex h-10 items-center motion-reduce:transition-none"
          data-testid="calendar-search"
        >
          <Search className="pointer-events-none absolute left-3 size-4 text-nav-foreground/60" strokeWidth={2} aria-hidden />
          <input
            ref={inputRef}
            autoFocus
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                close();
              } else if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive((current) => Math.min(current + 1, Math.max(0, result.items.length - 1)));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((current) => Math.max(0, current - 1));
              } else if (event.key === "Enter" && result.items[active]) {
                event.preventDefault();
                pick(result.items[active]);
              }
            }}
            placeholder={t("calendar.search.placeholder")}
            aria-label={t("calendar.search.label")}
            aria-controls="calendar-search-results"
            className="h-10 w-full min-w-0 rounded-xl bg-nav-foreground/10 pl-9 pr-9 text-sm text-nav-foreground outline-none placeholder:text-nav-foreground/45 focus-visible:ring-2 focus-visible:ring-nav-foreground/30 [&::-webkit-search-cancel-button]:hidden"
          />
          <button type="button" onClick={close} aria-label={t("common.close")} className="absolute right-2 flex size-6 items-center justify-center rounded-lg text-nav-foreground/60 transition-colors hover:bg-nav-foreground/10 hover:text-nav-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-foreground/30">
            <X className="size-4" strokeWidth={2} />
          </button>
        </motion.div>
      </PopoverAnchor>
      <PopoverContent
        side={side}
        align="end"
        sideOffset={14}
        className="w-[26rem] max-w-[calc(100vw-2rem)] gap-0 p-0"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        // Tocar el propio campo no es «fuera»: seguir escribiendo no debe cerrar la lista.
        onInteractOutside={(event) => anchorRef.current?.contains(event.target as Node) && event.preventDefault()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
          <Text size="xs" tone="muted">
            {!hasQuery
              ? t("calendar.search.hint")
              : range.isLoading
                ? t("calendar.search.loading")
                : result.total > result.items.length
                  ? t("calendar.search.countMore", { shown: result.items.length, total: result.total })
                  : t("calendar.search.count", { count: result.total })}
          </Text>
          <Text size="xs" tone="muted" className="shrink-0">
            {t("calendar.search.range", { from: format(addDays(now, -DAYS_BACK), "d MMM", { locale: dateLocale }), to: format(addDays(now, DAYS_AHEAD), "d MMM", { locale: dateLocale }) })}
          </Text>
        </div>
        {hasQuery && !range.isLoading && result.items.length === 0 && (
          <div className="flex flex-col gap-1 px-4 py-6 text-center">
            <Text weight="medium">{t("calendar.search.empty", { query: deferred.trim() })}</Text>
            <Text size="sm" tone="muted">
              {t("calendar.search.emptyHint")}
            </Text>
          </div>
        )}
        {result.items.length > 0 && (
          <ul id="calendar-search-results" role="listbox" aria-label={t("calendar.search.label")} className="max-h-[min(60vh,28rem)] overflow-y-auto p-1.5">
            {result.items.map((appointment, position) => (
              <li key={appointment.id} role="option" aria-selected={position === active}>
                <SearchRow appointment={appointment} ctx={ctx} active={position === active} onPick={() => pick(appointment)} onHover={() => setActive(position)} dateLocale={dateLocale} />
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

function SearchRow({ appointment, ctx, active, onPick, onHover, dateLocale }: { appointment: Appointment; ctx: ModelContext; active: boolean; onPick: () => void; onHover: () => void; dateLocale: ReturnType<typeof calendarLocale> }) {
  const t = useAppT();
  const client = findClient(ctx.catalog, appointment.clientId);
  const barber = findBarber(ctx.catalog, appointment.barberId);
  const start = appointmentStart(appointment);
  const day = format(start, "EEE d MMM", { locale: dateLocale });
  const services = servicesOf(ctx.catalog, appointment)
    .map((service) => service.name)
    .join(" + ");
  return (
    <button
      type="button"
      onClick={onPick}
      onMouseEnter={onHover}
      className={cn("flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left outline-none transition-colors", active ? "bg-surface-subtle" : "hover:bg-surface-subtle")}
      data-testid="calendar-search-result"
    >
      <ClientAvatar client={client} name={client?.name ?? t("calendar.clientType.walkin")} size="sm" />
      <span className="flex min-w-0 flex-1 flex-col">
        <Text as="span" size="sm" weight="medium" truncate>
          {client?.name ?? t("calendar.clientType.walkin")}
          {client?.phone && (
            <Text as="span" size="xs" tone="muted">
              {` · ${client.phone}`}
            </Text>
          )}
        </Text>
        <Text as="span" size="xs" tone="muted" truncate className="first-letter:uppercase">
          {[`${day} · ${formatClock(start, ctx.intl)}`, services, barber?.name.split(" ")[0]].filter(Boolean).join(" · ")}
        </Text>
      </span>
      <AppointmentStatusBadge status={appointment.status} />
    </button>
  );
}
