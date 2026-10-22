import * as React from "react";
import { addDays, format, startOfWeek } from "date-fns";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { DatePicker } from "@/components/date";
import { DrawerShell } from "@/components/overlays";
import { Field } from "@/components/forms";
import { ThemaTabs } from "@/components/navigation";
import { SegmentedControl } from "@/components/selection";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PersonAvatar } from "@/features/calendar/calendarShared";
import { ScheduleForm } from "../forms/ScheduleForm";
import { useCreatePlan } from "../queries";
import type { ScheduleTemplate, WeekSchedule } from "../types";
import { WEEKDAYS } from "../teamUtils";
import { shiftProblem } from "./shiftEditing";

/**
 * Un horario nuevo con vigencia (docs/WORK_HOURS_RESEARCH.md, P1): para quién, desde cuándo y hasta
 * cuándo (opcional), cada cuánto se repite (1 a 4 semanas, cada una con sus días) y, si se quiere,
 * guardarlo como plantilla. Sale de una plantilla o del horario de alguien. Lo anterior no cambia.
 */

export interface PlanMember {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface PlanDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  /** Las personas a las que quien mira puede poner horario. */
  members: readonly PlanMember[];
  /** Quiénes vienen marcados (el barbero de la fila desde la que se abrió). */
  memberIds: readonly string[];
  /** La semana de partida: la de una plantilla o la del horario de quien se abrió. */
  initialWeeks: readonly WeekSchedule[];
  initialTemplateName?: string | null;
  templates: readonly ScheduleTemplate[];
  today: Date;
}

const CYCLES = [1, 2, 3, 4] as const;
const EMPTY_WEEK: WeekSchedule = Object.fromEntries(WEEKDAYS.map((day) => [day, null]));

export function PlanDrawer(props: PlanDrawerProps) {
  const t = useAppT();
  return (
    <DrawerShell open={props.open} onOpenChange={props.onOpenChange} size="lg" title={t("hours.plans.new")} description={t("hours.planDrawer.hint")}>
      {/* Se monta al abrir: cada vez empieza de lo que se le pasa. */}
      {props.open && <PlanForm {...props} />}
    </DrawerShell>
  );
}

function PlanForm({ onOpenChange, branchId, members, memberIds: initialIds, initialWeeks, initialTemplateName = null, templates, today }: PlanDrawerProps) {
  const t = useAppT();
  const { locale } = useLocale();
  const create = useCreatePlan();
  const [memberIds, setMemberIds] = React.useState<readonly string[]>(initialIds);
  // Por defecto, desde el lunes que viene: la semana en curso ya está armada.
  const [from, setFrom] = React.useState<Date | null>(addDays(startOfWeek(today, { weekStartsOn: 1 }), 7));
  const [to, setTo] = React.useState<Date | null>(null);
  const [weeks, setWeeks] = React.useState<WeekSchedule[]>(initialWeeks.length > 0 ? initialWeeks.map((week) => ({ ...week })) : [{ ...EMPTY_WEEK }]);
  const [activeWeek, setActiveWeek] = React.useState(0);
  const [templateName, setTemplateName] = React.useState<string | null>(initialTemplateName);
  const [saveAs, setSaveAs] = React.useState("");
  const [notify, setNotify] = React.useState(true);
  const [tried, setTried] = React.useState(false);

  const setCycle = (count: number) => {
    // Crecer copia la última semana; achicar quita las de atrás.
    setWeeks((current) => Array.from({ length: count }, (_, index) => ({ ...(current[index] ?? current[current.length - 1] ?? EMPTY_WEEK) })));
    setActiveWeek((current) => Math.min(current, count - 1));
  };
  const applyTemplate = (id: string) => {
    const template = templates.find((item) => item.id === id);
    if (!template) {
      setTemplateName(null);
      return;
    }
    setWeeks(template.weeks.map((week) => ({ ...week })));
    setActiveWeek(0);
    setTemplateName(template.name);
  };
  const toggle = (id: string) => setMemberIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));

  const invalidWeek = weeks.some((week) => Object.values(week).some((range) => shiftProblem(range) !== null));
  const errors = {
    who: memberIds.length === 0 ? t("hours.planDrawer.pickWho") : undefined,
    from: !from ? t("hours.planDrawer.pickFrom") : undefined,
    to: from && to && to < from ? t("hours.planDrawer.toBeforeFrom") : undefined,
    weeks: invalidWeek ? t("hours.planDrawer.invalid") : undefined,
  };
  const valid = !errors.who && !errors.from && !errors.to && !errors.weeks;

  const save = () => {
    setTried(true);
    if (!valid || !from) return;
    create.mutate(
      { branchId, memberIds: [...memberIds], from: format(from, "yyyy-MM-dd"), to: to ? format(to, "yyyy-MM-dd") : null, weeks, templateName, saveAsTemplate: saveAs.trim() || undefined, notify },
      {
        onSuccess: () => {
          toast.success(t("hours.planDrawer.saved", { count: memberIds.length }));
          onOpenChange(false);
        },
        onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
      }
    );
  };

  return (
    <div className="flex flex-col gap-6" data-testid="plan-drawer">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-text-primary">{t("hours.planDrawer.who")}</legend>
        <ul className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface">
          {members.map((member) => (
            <li key={member.id}>
              <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5">
                <Checkbox checked={memberIds.includes(member.id)} onCheckedChange={() => toggle(member.id)} aria-label={member.name} />
                <PersonAvatar name={member.name} avatarUrl={member.avatarUrl} size="sm" />
                <Text as="span" size="sm" weight="medium">
                  {member.name}
                </Text>
              </label>
            </li>
          ))}
        </ul>
        {tried && errors.who && (
          <Text size="xs" tone="negative" role="alert">
            {errors.who}
          </Text>
        )}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <DatePicker label={t("hours.planDrawer.from")} value={from} onChange={(date) => setFrom(date ?? null)} locale={locale} error={tried ? errors.from : undefined} />
        <DatePicker label={t("hours.planDrawer.to")} value={to} onChange={(date) => setTo(date ?? null)} locale={locale} minDate={from ?? undefined} description={t("hours.planDrawer.toHint")} error={errors.to} />
      </div>

      {templates.length > 0 && (
        <Field label={t("hours.planDrawer.useTemplate")}>
          <Select value={templates.find((item) => item.name === templateName)?.id ?? "none"} onValueChange={applyTemplate}>
            <SelectTrigger data-testid="plan-template">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("hours.planDrawer.noTemplate")}</SelectItem>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {`${template.name} · ${t("hours.templates.weeks", { count: template.cycleWeeks })}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}

      <SegmentedControl
        label={t("hours.planDrawer.cycle")}
        size="sm"
        value={String(weeks.length)}
        onChange={(value) => setCycle(Number(value))}
        options={CYCLES.map((count) => ({ value: String(count), label: t("hours.templates.weeks", { count }) }))}
      />

      <div className="flex flex-col gap-3">
        {weeks.length > 1 && (
          <ThemaTabs
            className="mb-0"
            fitContent
            tabs={weeks.map((_, index) => ({ id: String(index), label: t("hours.planDrawer.week", { count: index + 1 }) }))}
            activeTabId={String(activeWeek)}
            onTabChange={(id) => setActiveWeek(Number(id))}
          />
        )}
        <ScheduleForm bare key={activeWeek} value={weeks[activeWeek]} onChange={(week) => setWeeks((current) => current.map((item, index) => (index === activeWeek ? week : item)))} error={tried ? errors.weeks : undefined} />
      </div>

      <Field label={t("hours.planDrawer.saveAsTemplate")}>
        <Input value={saveAs} onChange={(event) => setSaveAs(event.target.value)} placeholder={t("hours.planDrawer.templatePlaceholder")} data-testid="plan-save-as" />
      </Field>

      <label className="flex items-center justify-between gap-3">
        <Text as="span" size="sm">
          {t("hours.planDrawer.notify")}
        </Text>
        <Switch checked={notify} onCheckedChange={setNotify} />
      </label>

      <Button size="lg" className="w-full" disabled={create.isPending} onClick={save} data-testid="plan-save">
        {t("hours.planDrawer.save")}
      </Button>
    </div>
  );
}
