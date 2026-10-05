import * as React from "react";
import { CalendarPlus, Send } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { SidePanelShell } from "@/components/overlays";
import { ListItem, ListItemGroup } from "@/components/data-display/ListItem";
import { EmptyState } from "@/components/feedback";
import { Chip } from "@/components/ai-interaction";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/selection";
import { Text } from "@/components/typography";
import { formatClockRange } from "@/components/scheduling";
import { PersonAvatar } from "./calendarShared";
import { durationLabel, findClient, type ModelContext } from "./calendarModel";
import { dayGaps, gapsSummary, type DayGap } from "./gapsModel";
import type { CalendarDay, WaitlistEntry } from "./types";

/**
 * Los huecos del día en un panel junto a la agenda: cuánto tiempo libre
 * queda, cuánto se podría vender todavía y, hueco a hueco, qué cabe y a quién
 * de la lista de espera ofrecérselo. Cada fila agenda ahí mismo —abre el alta
 * con el barbero y la hora puestos— u ofrece el hueco a quien espera.
 */

export interface GapsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ctx: ModelContext;
  date: Date;
  day: CalendarDay | undefined;
  waitlist: readonly WaitlistEntry[];
  onBook: (gap: DayGap) => void;
  onOffer: (gap: DayGap, entry: WaitlistEntry) => void;
}

const MIN_OPTIONS = [15, 30, 45, 60] as const;
type GroupBy = "barber" | "time";

export function GapsDrawer({ open, onOpenChange, ctx, date, day, waitlist, onBook, onOffer }: GapsDrawerProps) {
  const t = useAppT();
  const [min, setMin] = React.useState<number>(30);
  const [groupBy, setGroupBy] = React.useState<GroupBy>("barber");

  const gaps = React.useMemo(
    () => (open && day ? dayGaps({ day, catalog: ctx.catalog, barbers: ctx.catalog.barbers, date, now: ctx.now, waitlist, minMinutes: min }) : []),
    [open, day, ctx.catalog, ctx.now, date, waitlist, min]
  );
  const summary = gapsSummary(gaps);
  const showTotals = ctx.access?.showTotals ?? true;

  const groups = React.useMemo(() => {
    if (groupBy === "time") return gaps.length > 0 ? [{ id: "all", label: null as string | null, items: gaps }] : [];
    const byBarber = new Map<string, DayGap[]>();
    for (const gap of gaps) byBarber.set(gap.barber.id, [...(byBarber.get(gap.barber.id) ?? []), gap]);
    return [...byBarber.values()].map((items) => ({ id: items[0].barber.id, label: items[0].barber.name as string | null, items }));
  }, [gaps, groupBy]);

  return (
    <SidePanelShell open={open} onOpenChange={onOpenChange} size="lg" title={t("calendar.gaps.title")} description={t("calendar.gaps.hint")}>
      <div className="space-y-4" data-testid="calendar-gaps">
        <dl className={`grid gap-3 ${showTotals ? "grid-cols-3" : "grid-cols-2"}`} data-testid="calendar-gaps-summary">
          <Stat label={t("calendar.gaps.stat.count")} value={String(summary.count)} />
          <Stat label={t("calendar.gaps.stat.free")} value={durationLabel(summary.minutes)} />
          {/* «Por vender» es una cifra del negocio: recepción se queda con las horas libres. */}
          {showTotals && <Stat label={t("calendar.gaps.stat.potential")} value={ctx.formatMoney(summary.potential)} />}
        </dl>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div role="group" aria-label={t("calendar.gaps.min")} className="flex flex-wrap items-center gap-1.5">
            <Text as="span" variant="caption">
              {t("calendar.gaps.min")}
            </Text>
            {MIN_OPTIONS.map((option) => (
              <Chip key={option} size="sm" label={t("calendar.gaps.minutes", { minutes: option })} selected={min === option} tone={min === option ? "primary" : "default"} onClick={() => setMin(option)} />
            ))}
          </div>
          <SegmentedControl
            className="w-auto"
            size="sm"
            ariaLabel={t("calendar.gaps.byBarber")}
            options={[
              { value: "barber", label: t("calendar.gaps.byBarber") },
              { value: "time", label: t("calendar.gaps.byTime") },
            ]}
            value={groupBy}
            onChange={(value) => setGroupBy(value as GroupBy)}
          />
        </div>

        {groups.length === 0 ? (
          <EmptyState icon="calendar" title={t("calendar.gaps.empty")} description={t("calendar.gaps.emptyHint")} data-testid="calendar-gaps-empty" />
        ) : (
          groups.map((group) => (
            <section key={group.id} className="space-y-2" aria-label={group.label ?? t("calendar.gaps.byTime")}>
              {group.label && (
                <Text variant="label" tone="muted" className="uppercase tracking-wide">
                  {group.label} · {durationLabel(group.items.reduce((sum, gap) => sum + gap.minutes, 0))}
                </Text>
              )}
              <ListItemGroup>
                {group.items.map((gap) => {
                  const best = gap.fits[0];
                  const entry = gap.waitlist[0];
                  const client = entry ? findClient(ctx.catalog, entry.clientId) : undefined;
                  const fits = !best ? t("calendar.gaps.fitsNone") : gap.fits.length > 1 ? t("calendar.gaps.fitsMore", { name: best.name, count: gap.fits.length - 1 }) : t("calendar.gaps.fits", { name: best.name });
                  return (
                    <ListItem
                      key={gap.id}
                      size="sm"
                      data-testid={`calendar-gap-${gap.id}`}
                      leading={groupBy === "time" ? <PersonAvatar name={gap.barber.name} avatarUrl={gap.barber.avatarUrl} size="sm" /> : undefined}
                      title={
                        <span className="flex flex-wrap items-center gap-2 tabular-nums">
                          {formatClockRange(gap.start, gap.end, ctx.intl)}
                          <span className="rounded-sm bg-muted px-1 text-xs font-semibold text-text-secondary">{durationLabel(gap.minutes)}</span>
                          {gap.waitlist.length > 0 && <span className="rounded-sm bg-warning/20 px-1 text-xs font-semibold text-warning">{t("calendar.gaps.waiting", { count: gap.waitlist.length })}</span>}
                        </span>
                      }
                      description={groupBy === "time" ? `${gap.barber.name} · ${fits}` : fits}
                      actions={
                        <span className="flex flex-wrap justify-end gap-1.5">
                          {entry && client && (
                            <Button size="xs" variant="outline" onClick={() => onOffer(gap, entry)}>
                              <Send /> {t("calendar.gaps.offer", { name: client.name.split(" ")[0] })}
                            </Button>
                          )}
                          <Button size="xs" onClick={() => onBook(gap)} aria-label={`${t("calendar.gaps.book")}: ${gap.barber.name}, ${formatClockRange(gap.start, gap.end, ctx.intl)}`}>
                            <CalendarPlus /> {t("calendar.gaps.book")}
                          </Button>
                        </span>
                      }
                    />
                  );
                })}
              </ListItemGroup>
            </section>
          ))
        )}
      </div>
    </SidePanelShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-surface px-3 py-2">
      <dd className="text-base font-semibold tabular-nums text-text-primary">{value}</dd>
      <dt className="text-xs text-text-muted">{label}</dt>
    </div>
  );
}
