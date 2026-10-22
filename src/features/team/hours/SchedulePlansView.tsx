import * as React from "react";
import { format } from "date-fns";
import { Bell, CalendarPlus, Repeat, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { calendarLocale } from "@/components/date/calendarLocale";
import { ListItem, ListItemGroup } from "@/components/data-display/ListItem";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PersonAvatar } from "@/features/calendar/calendarShared";
import { InfoCard } from "../teamShared";
import { useRemovePlan, useRemoveTemplate, usePlansQuery, useScheduleLogQuery, useTemplatesQuery } from "../queries";
import type { ScheduleTemplate, WeekRow, WeekSchedule } from "../types";
import { WEEKDAYS } from "../teamUtils";
import type { HoursAccess } from "./shiftEditing";
import { PlanDrawer, type PlanMember } from "./PlanDrawer";

/**
 * La pestaña «Horarios» de Horas de trabajo (docs/WORK_HOURS_RESEARCH.md, P1): qué horario rige a
 * cada barbero (el de su ficha o uno con vigencia y ciclo) y los que vienen, las plantillas para
 * aplicar a varios de una vez y los últimos cambios (quién cambió qué y si se le avisó).
 */

export interface SchedulePlansViewProps {
  branchId: string;
  rows: readonly WeekRow[];
  access: HoursAccess;
  /** Dueño o administrador: borra plantillas. */
  manages: boolean;
  today: Date;
}

interface DrawerState {
  memberIds: string[];
  weeks: WeekSchedule[];
  templateName: string | null;
}

/** El horario fijo de la semana que se está viendo, de una fila: el punto de partida de un horario nuevo. */
function weekOf(row: WeekRow): WeekSchedule {
  const week: WeekSchedule = Object.fromEntries(WEEKDAYS.map((day) => [day, null]));
  for (const day of row.days) week[String(new Date(`${day.date}T00:00:00`).getDay())] = day.fixed ?? null;
  return week;
}

export function SchedulePlansView({ branchId, rows, access, manages, today }: SchedulePlansViewProps) {
  const t = useAppT();
  const { locale, formatDate } = useLocale();
  const dateLocale = calendarLocale(locale);
  const plans = usePlansQuery(branchId);
  const templates = useTemplatesQuery(branchId);
  const log = useScheduleLogQuery(branchId);
  const removePlan = useRemovePlan();
  const removeTemplate = useRemoveTemplate();
  const [drawer, setDrawer] = React.useState<DrawerState | null>(null);
  const todayKey = format(today, "yyyy-MM-dd");
  const long = (date: string) => format(new Date(`${date}T00:00:00`), "d 'de' MMM", { locale: dateLocale });
  const fail = (error: unknown) => toast.error(describeError(error).title, { description: describeError(error).description });
  const editable: PlanMember[] = rows.filter((row) => access.canEditPattern(row.memberId)).map((row) => ({ id: row.memberId, name: row.name, avatarUrl: row.avatarUrl }));
  const templateList = templates.data?.items ?? [];

  const openFor = (row: WeekRow) => setDrawer({ memberIds: [row.memberId], weeks: [weekOf(row)], templateName: null });
  const apply = (template: ScheduleTemplate) => setDrawer({ memberIds: [], weeks: template.weeks.map((week) => ({ ...week })), templateName: template.name });

  return (
    <div className="flex flex-col gap-section" data-testid="schedule-plans">
      <InfoCard
        title={t("hours.plans.title")}
        description={t("hours.plans.hint")}
        actions={
          editable.length > 0 && (
            <Button size="sm" onClick={() => setDrawer({ memberIds: [], weeks: [], templateName: null })} data-testid="plans-new">
              <CalendarPlus /> {t("hours.plans.new")}
            </Button>
          )
        }
      >
        <ListItemGroup>
          {rows.map((row) => {
            const plan = row.plan ?? null;
            const upcoming = (plans.data?.items ?? []).filter((item) => item.memberId === row.memberId && item.from > todayKey);
            const current = plan
              ? [plan.to ? t("hours.plans.range", { from: long(plan.from), to: long(plan.to) }) : t("hours.plans.since", { date: long(plan.from) }), plan.cycleWeeks > 1 ? t("hours.plans.cycle", { count: plan.cycleWeeks, week: plan.cycleWeek }) : t("hours.plans.weekly"), plan.templateName ? t("hours.plans.template", { name: plan.templateName }) : null]
              : [t("hours.plans.profile")];
            return (
              <ListItem
                key={row.memberId}
                leading={<PersonAvatar name={row.name} avatarUrl={row.avatarUrl} size="sm" />}
                title={row.name}
                description={
                  <span className="flex flex-col gap-1">
                    <span>{current.filter(Boolean).join(" · ")}</span>
                    {upcoming.map((item) => (
                      <span key={item.id} className="flex items-center gap-1.5 text-primary">
                        <Repeat className="size-3.5" aria-hidden />
                        {t("hours.plans.upcoming", { date: long(item.from) })}
                        {access.canEditPattern(row.memberId) && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label={t("hours.plans.remove", { date: long(item.from) })}
                            title={t("hours.plans.remove", { date: long(item.from) })}
                            onClick={() => removePlan.mutate(item.id, { onSuccess: () => toast.success(t("hours.plans.removed")), onError: fail })}
                          >
                            <Trash2 />
                          </Button>
                        )}
                      </span>
                    ))}
                  </span>
                }
                actions={
                  access.canEditPattern(row.memberId) && (
                    <Button variant="outline" size="xs" onClick={() => openFor(row)} aria-label={t("hours.plans.newFor", { name: row.name })}>
                      {t("hours.plans.new")}
                    </Button>
                  )
                }
              />
            );
          })}
        </ListItemGroup>
      </InfoCard>

      <InfoCard title={t("hours.templates.title")} description={t("hours.templates.hint")}>
        {templates.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : templateList.length === 0 ? (
          <Text size="sm" tone="muted">
            {t("hours.templates.empty")}
          </Text>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2" data-testid="schedule-templates">
            {templateList.map((template) => (
              <li key={template.id} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
                <span className="flex min-w-0 flex-col">
                  <Text as="span" size="sm" weight="semibold">
                    {template.name}
                  </Text>
                  <Text as="span" size="xs" tone="muted">
                    {t("hours.templates.weeks", { count: template.cycleWeeks })}
                  </Text>
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  {editable.length > 0 && (
                    <Button variant="outline" size="xs" onClick={() => apply(template)}>
                      {t("hours.templates.apply")}
                    </Button>
                  )}
                  {manages && (
                    <Button variant="ghost" size="icon-xs" aria-label={t("hours.templates.remove", { name: template.name })} onClick={() => removeTemplate.mutate(template.id, { onSuccess: () => toast.success(t("hours.templates.removed")), onError: fail })}>
                      <Trash2 />
                    </Button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </InfoCard>

      <InfoCard title={t("hours.log.title")}>
        {(log.data?.items ?? []).length === 0 ? (
          <Text size="sm" tone="muted">
            {t("hours.log.empty")}
          </Text>
        ) : (
          <ul className="flex flex-col divide-y divide-border" data-testid="schedule-log">
            {(log.data?.items ?? []).slice(0, 12).map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-2">
                <span className="flex min-w-0 flex-col">
                  <Text as="span" size="sm" weight="medium" truncate>
                    {`${item.memberName} · ${t(`notifications.scheduleChanged.kind.${item.kind}`)}`}
                  </Text>
                  <Text as="span" size="xs" tone="muted">
                    {`${item.by} · ${formatDate(new Date(item.at), { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })} · ${long(item.date)}`}
                  </Text>
                </span>
                {item.notify && (
                  <span className="flex shrink-0 items-center gap-1 text-xs text-text-muted">
                    <Bell className="size-3.5" aria-hidden /> {t("hours.log.notified")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </InfoCard>

      <PlanDrawer
        open={drawer !== null}
        onOpenChange={(open) => !open && setDrawer(null)}
        branchId={branchId}
        members={editable}
        memberIds={drawer?.memberIds ?? []}
        initialWeeks={drawer?.weeks ?? []}
        initialTemplateName={drawer?.templateName ?? null}
        templates={templateList}
        today={today}
      />
    </div>
  );
}
