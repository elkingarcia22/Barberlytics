import { CalendarOff } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { Field, MultiSelect } from "@/components/forms";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { IconTile } from "@/components/utility";
import { BRANCHES } from "@/features/branches";
import type { FieldErrors } from "../SettingsFormParts";
import { SettingsList } from "../SettingsListParts";
import { closureSchema, type Closure, type ClosureInput } from "../settingsTypes";
import { closureDays } from "./settingsMath";

const EMPTY: ClosureInput = { startDate: "", endDate: "", branchIds: BRANCHES.map((branch) => branch.id), description: "" };
const DATE_OPTIONS: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };

const asDate = (day: string) => new Date(`${day}T12:00:00`);

/**
 * Horarios y cierres: los días en que la barbería no atiende. Mientras dura
 * un cierre no se puede reservar en línea en las sucursales elegidas.
 */
export function ClosuresSettings() {
  const t = useAppT();
  const { formatDate } = useLocale();
  const today = new Date().toISOString().slice(0, 10);

  const validate = (draft: ClosureInput): FieldErrors => {
    const errors: FieldErrors = {};
    if (!draft.startDate) errors.startDate = t("cfg.closures.error.start");
    if (!draft.endDate) errors.endDate = t("cfg.closures.error.end");
    else if (draft.startDate && draft.endDate < draft.startDate) errors.endDate = t("cfg.closures.error.order");
    if (draft.branchIds.length === 0) errors.branchIds = t("cfg.closures.error.branches");
    return errors;
  };

  return (
    <SettingsList<Closure, ClosureInput>
      list="closures"
      schema={closureSchema}
      icon="calendar"
      labelOf={(item) => (item.startDate === item.endDate ? formatDate(asDate(item.startDate), DATE_OPTIONS) : `${formatDate(asDate(item.startDate), DATE_OPTIONS)} – ${formatDate(asDate(item.endDate), DATE_OPTIONS)}`)}
      renderRow={(item) => ({
        leading: <IconTile icon={<CalendarOff />} tone="warning" />,
        description: [item.description, item.branchIds.length === BRANCHES.length ? t("cfg.closures.allBranches") : item.branchIds.map((id) => BRANCHES.find((branch) => branch.id === id)?.name ?? id).join(", ")].filter(Boolean).join(" · "),
        meta: (
          <span className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-xs text-text-muted">{t("cfg.days", { count: closureDays(item) })}</span>
            {item.endDate < today && <Badge variant="neutral">{t("cfg.closures.past")}</Badge>}
          </span>
        ),
      })}
      emptyDraft={EMPTY}
      toDraft={({ startDate, endDate, branchIds, description }) => ({ startDate, endDate, branchIds, description })}
      validate={validate}
      messages={{
        count: (count) => t("cfg.closures.count", { count }),
        add: t("cfg.closures.add"),
        emptyTitle: t("cfg.closures.emptyTitle"),
        emptyHint: t("cfg.closures.emptyHint"),
        createTitle: t("cfg.closures.add"),
        editTitle: t("cfg.closures.editTitle"),
        formHint: t("cfg.closures.formHint"),
        created: t("cfg.closures.created"),
        saved: t("cfg.saved"),
        removed: t("cfg.closures.removed"),
        removeTitle: (label) => t("cfg.closures.removeTitle", { name: label }),
        removeHint: t("cfg.closures.removeHint"),
        editAria: (label) => t("cfg.editAria", { name: label }),
        removeAria: (label) => t("cfg.removeAria", { name: label }),
      }}
      renderForm={({ draft, set, errors }) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("cfg.closures.start")} required error={errors.startDate}>
              <Input type="date" value={draft.startDate} onChange={(event) => set("startDate", event.target.value)} aria-invalid={!!errors.startDate} data-testid="closures-start" />
            </Field>
            <Field label={t("cfg.closures.end")} required error={errors.endDate}>
              <Input type="date" value={draft.endDate} min={draft.startDate || undefined} onChange={(event) => set("endDate", event.target.value)} aria-invalid={!!errors.endDate} data-testid="closures-end" />
            </Field>
          </div>
          <Field label={t("cfg.closures.branches")} required error={errors.branchIds}>
            <MultiSelect options={BRANCHES.map((branch) => ({ value: branch.id, label: branch.name }))} value={draft.branchIds} onValueChange={(value) => set("branchIds", value)} placeholder={t("cfg.closures.branchesPlaceholder")} searchPlaceholder={t("cfg.search")} emptyMessage={t("cfg.noResults")} />
          </Field>
          <Field label={t("cfg.description")} description={t("cfg.closures.descriptionHint")}>
            <Textarea value={draft.description} onChange={(event) => set("description", event.target.value)} rows={3} />
          </Field>
        </>
      )}
    />
  );
}
