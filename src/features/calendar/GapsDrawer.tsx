import * as React from "react";
import { CalendarPlus, ListOrdered, Send } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { PanelFooter, SidePanelShell } from "@/components/overlays";
import { ListItem, ListItemGroup } from "@/components/data-display/ListItem";
import { EmptyState } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SegmentedControl } from "@/components/selection";
import { Text } from "@/components/typography";
import { formatClock, formatClockRange } from "@/components/scheduling";
import { PersonAvatar } from "./calendarShared";
import { durationLabel, findClient, type ModelContext } from "./calendarModel";
import { dayGaps, gapsSummary, type DayGap } from "./gapsModel";
import type { CalendarDay, WaitlistEntry } from "./types";
import { PanelField, PanelQuestion } from "./appointmentPanel/bookingStyle";
import { FieldIcon, SaleCard, SaleCardHead } from "./saleParts";

/**
 * Los huecos del día en un panel junto a la agenda, con la cara de «Crear
 * cita»: la tarjeta teñida con el tiempo libre que queda y cuánto se podría
 * vender todavía; qué huecos ver (desde cuántos minutos, por barbero o por
 * hora); la lista de espera como un campo más (se abre desde aquí: es donde
 * se usa) y, hueco a hueco, qué cabe y a quién ofrecérselo. Cada fila agenda
 * ahí mismo —abre el alta con el barbero y la hora puestos— u ofrece el hueco
 * a quien espera; abajo, un solo botón: agendar en el próximo hueco.
 */

export interface GapsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ctx: ModelContext;
  date: Date;
  day: CalendarDay | undefined;
  waitlist: readonly WaitlistEntry[];
  /** Abre la lista de espera completa (apuntar o quitar a alguien). */
  onOpenWaitlist: () => void;
  onBook: (gap: DayGap) => void;
  onOffer: (gap: DayGap, entry: WaitlistEntry) => void;
}

const MIN_OPTIONS = [15, 30, 45, 60] as const;
type GroupBy = "barber" | "time";

export function GapsDrawer({ open, onOpenChange, ctx, date, day, waitlist, onOpenWaitlist, onBook, onOffer }: GapsDrawerProps) {
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

  const next = [...gaps].sort((x, y) => x.start.getTime() - y.start.getTime())[0];

  return (
    <SidePanelShell open={open} onOpenChange={onOpenChange} size="lg" title={t("calendar.action.gaps")}>
      <div data-testid="calendar-gaps">
        <SaleCard testId="calendar-gaps-cards">
          <div data-testid="calendar-gaps-summary">
            <SaleCardHead
              eyebrow={t("calendar.action.gaps")}
              title={summary.count > 0 ? t("calendar.gaps.free", { time: durationLabel(summary.minutes) }) : t("calendar.gaps.empty")}
              lead={summary.count > 0 ? [t("calendar.gaps.count", { count: summary.count }), showTotals ? t("calendar.gaps.potential", { amount: ctx.formatMoney(summary.potential) }) : null].filter(Boolean).join(" · ") : t("calendar.gaps.emptyHint")}
            />
          </div>

          <PanelQuestion title={t("calendar.gaps.which")}>
            {/* Los dos controles en una línea: desde cuántos minutos cuenta un hueco (un selector, no cuatro chips) y cómo agruparlos. */}
            <div className="flex items-center justify-between gap-2" data-testid="calendar-gaps-controls">
              <Select value={String(min)} onValueChange={(value) => setMin(Number(value))}>
                <SelectTrigger size="sm" className="w-auto gap-1.5" aria-label={t("calendar.gaps.min")} data-testid="calendar-gaps-min">
                  <Text as="span" size="sm" tone="muted">
                    {t("calendar.gaps.min")}
                  </Text>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MIN_OPTIONS.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {t("calendar.gaps.minutes", { minutes: option })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <SegmentedControl
                className="w-auto shrink-0"
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
          </PanelQuestion>

          <PanelQuestion title={t("calendar.gaps.whoWaits")}>
            <PanelField
              eyebrow={t("calendar.action.waitlist")}
              value={waitlist.length > 0 ? t("calendar.gaps.waitlistCount", { count: waitlist.length }) : ""}
              placeholder={t("calendar.gaps.waitlistEmpty")}
              detail={waitlist.length > 0 ? t("calendar.gaps.waitlistHint") : undefined}
              leading={<FieldIcon icon={ListOrdered} filled={waitlist.length > 0} />}
              onOpen={onOpenWaitlist}
              testId="calendar-gaps-waitlist"
            />
          </PanelQuestion>

          {groups.length === 0 ? (
            <EmptyState icon="calendar" title={t("calendar.gaps.empty")} description={t("calendar.gaps.emptyHint")} data-testid="calendar-gaps-empty" />
          ) : (
            groups.map((group) => (
              <PanelQuestion key={group.id} title={group.label ? `${group.label} · ${durationLabel(group.items.reduce((sum, gap) => sum + gap.minutes, 0))}` : t("calendar.gaps.byTime")}>
                <ListItemGroup aria-label={group.label ?? t("calendar.gaps.byTime")}>
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
                            <Button size="xs" variant="outline" onClick={() => onBook(gap)} aria-label={`${t("calendar.gaps.book")}: ${gap.barber.name}, ${formatClockRange(gap.start, gap.end, ctx.intl)}`}>
                              <CalendarPlus /> {t("calendar.gaps.book")}
                            </Button>
                          </span>
                        }
                      />
                    );
                  })}
                </ListItemGroup>
              </PanelQuestion>
            ))
          )}

          {next && (
            <PanelFooter>
              <Button size="lg" className="w-full" onClick={() => onBook(next)} data-testid="calendar-gaps-book-next">
                <CalendarPlus />
                {t("calendar.gaps.bookNext", { time: formatClock(next.start, ctx.intl), name: next.barber.name.split(" ")[0] })}
              </Button>
            </PanelFooter>
          )}
        </SaleCard>
      </div>
    </SidePanelShell>
  );
}
