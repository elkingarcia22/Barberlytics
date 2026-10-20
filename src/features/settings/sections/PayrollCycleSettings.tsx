import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";
import { Field } from "@/components/forms";
import { CardSelection } from "@/components/selection";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SettingsCard, SettingsDocument, SwitchRow } from "../SettingsFormParts";
import { payrollCycleSchema, type PayrollCycleSettings as PayrollCycle } from "../settingsTypes";

const CYCLES: readonly { id: PayrollCycle["cycle"]; label: AppMessageKey; hint: AppMessageKey }[] = [
  { id: "weekly", label: "cfg.payroll.weekly", hint: "cfg.payroll.weeklyHint" },
  { id: "biweekly", label: "cfg.payroll.biweekly", hint: "cfg.payroll.biweeklyHint" },
  { id: "monthly", label: "cfg.payroll.monthly", hint: "cfg.payroll.monthlyHint" },
];

const WEEKDAYS: readonly AppMessageKey[] = ["cfg.weekday.1", "cfg.weekday.2", "cfg.weekday.3", "cfg.weekday.4", "cfg.weekday.5", "cfg.weekday.6", "cfg.weekday.7"];
const WEEK_DAYS = 7;
const MONTH_DAYS = 28;

/**
 * Ciclo de nómina: cada cuánto se le liquida al equipo y qué día arranca el
 * ciclo. En un ciclo semanal el día es de la semana; en los demás, del mes.
 */
export function PayrollCycleSettings() {
  const t = useAppT();
  return (
    <SettingsDocument section="payrollCycle" schema={payrollCycleSchema}>
      {({ draft, set }) => {
        const weekly = draft.cycle === "weekly";
        const days = Array.from({ length: weekly ? WEEK_DAYS : MONTH_DAYS }, (_, index) => index + 1);
        /* Al pasar a semanal, un día 15 deja de existir: cae al primero. */
        const startDay = days.includes(draft.startDay) ? draft.startDay : 1;
        return (
          <SettingsCard title={t("cfg.payroll.title")} description={t("cfg.payroll.hint")}>
            <CardSelection columns={3} value={draft.cycle} onChange={(value) => set("cycle", value as PayrollCycle["cycle"])} options={CYCLES.map((cycle) => ({ value: cycle.id, label: t(cycle.label), description: t(cycle.hint) }))} />
            <Field label={t("cfg.payroll.startDay")} description={t(weekly ? "cfg.payroll.startDayWeekHint" : "cfg.payroll.startDayMonthHint")} className="sm:max-w-xs">
              <Select value={String(startDay)} onValueChange={(value) => set("startDay", Number(value))}>
                <SelectTrigger data-testid="payroll-start-day">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {days.map((day) => (
                    <SelectItem key={day} value={String(day)}>
                      {weekly ? t(WEEKDAYS[day - 1]) : t("cfg.payroll.dayOfMonth", { day })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <SwitchRow label={t("cfg.payroll.cashTips")} hint={t("cfg.payroll.cashTipsHint")} checked={draft.cashTipsPaidOut} onCheckedChange={(checked) => set("cashTipsPaidOut", checked)} testId="payroll-cash-tips" />
          </SettingsCard>
        );
      }}
    </SettingsDocument>
  );
}
