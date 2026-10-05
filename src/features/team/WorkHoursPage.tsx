import * as React from "react";
import { useNavigate, useSearchParams } from "react-router";
import { addDays, addWeeks, format, isValid, parseISO, startOfWeek } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Pencil, RotateCcw, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useAccess } from "@/features/access";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { QueryBoundary } from "@/lib/query";
import { calendarLocale } from "@/components/date/calendarLocale";
import { ShellHeaderSlot } from "@/components/app-shell";
import { Breadcrumbs } from "@/components/navigation";
import { PageHeader } from "@/components/utility";
import { EmptyState } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShiftWeekGrid, type ShiftDay, type ShiftRow } from "@/components/scheduling";
import { EditShiftDrawer } from "./EditShiftDrawer";
import { useClearOverride, useSetOverride, useWeekQuery } from "./queries";
import type { WeekRow } from "./types";
import { useBranchId } from "./teamUtils";

/**
 * Horas de trabajo: el turno de cada barbero, semana por semana. Tocar un
 * turno cambia solo ese día; el horario fijo se edita en la ficha.
 */

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function WorkHoursPage({ now }: { now?: Date } = {}) {
  const t = useAppT();
  const navigate = useNavigate();
  const { locale, formatNumber } = useLocale();
  // Ver la semana del equipo no es cambiarla: los turnos de un día van por «Equipo · Editar».
  const access = useAccess();
  const canEdit = access.can("team", "edit");
  const dateLocale = calendarLocale(locale);
  const branchId = useBranchId();
  const [searchParams, setSearchParams] = useSearchParams();
  const today = React.useMemo(() => now ?? new Date(), [now]);
  const thisWeek = startOfWeek(today, { weekStartsOn: 1 });
  const weekParam = searchParams.get("semana");
  const parsed = weekParam ? parseISO(weekParam) : null;
  const weekStart = parsed && isValid(parsed) ? startOfWeek(parsed, { weekStartsOn: 1 }) : thisWeek;
  const weekKey = format(weekStart, "yyyy-MM-dd");
  const setWeek = (next: Date) =>
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);
        const key = format(next, "yyyy-MM-dd");
        if (key === format(thisWeek, "yyyy-MM-dd")) params.delete("semana");
        else params.set("semana", key);
        return params;
      },
      { replace: true }
    );

  const week = useWeekQuery(branchId, weekKey);
  const setOverride = useSetOverride();
  const clearOverride = useClearOverride();
  const [editing, setEditing] = React.useState<{ row: WeekRow; day: ShiftDay } | null>(null);
  const days = React.useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const rangeLabel = `${format(days[0], "d MMM", { locale: dateLocale })} – ${format(days[6], "d MMM", { locale: dateLocale })}`;
  const fail = (error: unknown) => toast.error(describeError(error).title, { description: describeError(error).description });

  const rows: ShiftRow[] = (week.data?.rows ?? []).map((row) => ({
    id: row.memberId,
    name: row.name,
    avatarUrl: row.avatarUrl,
    days: row.days.map((day) => ({ date: parseISO(day.date), range: day.range, overridden: day.overridden })),
  }));
  const workingToday = (week.data?.rows ?? []).filter((row) => row.days.some((day) => day.date === format(today, "yyyy-MM-dd") && day.range)).length;

  return (
    <div className="space-y-4">
      <ShellHeaderSlot>
        <Breadcrumbs items={[{ label: t("nav.home"), onClick: () => navigate("/metricas") }, { label: t("team.title"), onClick: () => navigate("/usuarios") }, t("teamHours.title")]} />
      </ShellHeaderSlot>
      <PageHeader
        title={t("teamHours.title")}
        description={t("teamHours.description")}
        meta={
          week.data ? (
            <>
              <span>{t("teamHours.barbers", { count: formatNumber(week.data.rows.length) })}</span>
              <span>{t("teamHours.workingToday", { count: formatNumber(workingToday) })}</span>
            </>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-2" data-testid="hours-toolbar">
        <Button variant="outline" size="icon" aria-label={t("teamHours.prevWeek")} onClick={() => setWeek(addWeeks(weekStart, -1))}>
          <ChevronLeft />
        </Button>
        <span className="min-w-[10rem] text-center text-sm font-semibold text-text-primary">{capitalize(rangeLabel)}</span>
        <Button variant="outline" size="icon" aria-label={t("teamHours.nextWeek")} onClick={() => setWeek(addWeeks(weekStart, 1))}>
          <ChevronRight />
        </Button>
        {weekKey !== format(thisWeek, "yyyy-MM-dd") && (
          <Button variant="outline" onClick={() => setWeek(thisWeek)}>
            {t("teamHours.thisWeek")}
          </Button>
        )}
      </div>

      <QueryBoundary query={week} loading={<Skeleton className="h-96 w-full" />} empty={{ when: (data) => data.rows.length === 0, render: <EmptyState icon="users" title={t("teamHours.empty")} description={t("teamHours.emptyHint")} /> }}>
        {(data) => (
          <ShiftWeekGrid
            days={days}
            rows={rows}
            today={today}
            rowActions={(row) => [
              { id: "profile", label: t("teamHours.openProfile"), icon: <UserRound className="size-4" />, onSelect: () => navigate(`/usuarios/miembros/${row.id}?pestana=calendario`) },
              ...(canEdit || row.id === access.member?.id ? [{ id: "calendar", label: t("teamMember.action.schedule"), icon: <CalendarDays className="size-4" />, onSelect: () => navigate(`/calendario?equipo=${row.id}`) }] : []),
            ]}
            shiftActions={(row, day) => {
              const source = data.rows.find((item) => item.memberId === row.id);
              if (!source || !canEdit) return [];
              const key = format(day.date, "yyyy-MM-dd");
              return [
                { id: "edit", label: t("teamHours.editDay"), icon: <Pencil className="size-4" />, onSelect: () => setEditing({ row: source, day }) },
                ...(day.range ? [{ id: "clear", label: t("teamHours.deleteShift"), icon: <Trash2 className="size-4" />, onSelect: () => setOverride.mutate({ memberId: row.id, date: key, range: null }, { onSuccess: () => toast.success(t("teamHours.cleared")), onError: fail }) }] : []),
                ...(day.overridden ? [{ id: "restore", label: t("teamHours.restoreFixed"), icon: <RotateCcw className="size-4" />, onSelect: () => clearOverride.mutate({ memberId: row.id, date: key }, { onSuccess: () => toast.success(t("teamHours.restored")), onError: fail }) }] : []),
              ];
            }}
          />
        )}
      </QueryBoundary>

      <EditShiftDrawer
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        row={editing?.row ?? null}
        day={editing?.day ?? null}
        saving={setOverride.isPending}
        onSave={(range) => {
          if (!editing) return;
          setOverride.mutate(
            { memberId: editing.row.memberId, date: format(editing.day.date, "yyyy-MM-dd"), range },
            {
              onSuccess: () => {
                toast.success(t("teamHours.saved"));
                setEditing(null);
              },
              onError: fail,
            }
          );
        }}
      />
    </div>
  );
}
