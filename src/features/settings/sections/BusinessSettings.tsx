import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";
import { Field, MultiSelect } from "@/components/forms";
import { ThemaTabs } from "@/components/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SettingsCard, SettingsDocument, type FieldErrors } from "../SettingsFormParts";
import { businessSchema, type BusinessSettings as Business } from "../settingsTypes";

const TIMEZONES: readonly string[] = ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Bogota", "America/Mexico_City"];

const HOLIDAYS: readonly { id: string; key: AppMessageKey }[] = [
  { id: "new-year", key: "cfg.business.holiday.newYear" },
  { id: "mlk", key: "cfg.business.holiday.mlk" },
  { id: "memorial", key: "cfg.business.holiday.memorial" },
  { id: "independence", key: "cfg.business.holiday.independence" },
  { id: "labor", key: "cfg.business.holiday.labor" },
  { id: "thanksgiving", key: "cfg.business.holiday.thanksgiving" },
  { id: "christmas", key: "cfg.business.holiday.christmas" },
];

const LINKS = ["website", "instagram", "facebook", "googleMaps"] as const;
const LINK_KEYS: Record<(typeof LINKS)[number], AppMessageKey> = { website: "cfg.business.website", instagram: "cfg.business.instagram", facebook: "cfg.business.facebook", googleMaps: "cfg.business.googleMaps" };
const URL_LIKE = /^https?:\/\/\S+\.\S+/;

/**
 * Perfil del negocio: cómo se cuenta el tiempo —zona, formato, semana y
 * horario— y dónde encuentra el cliente a la barbería en internet.
 */
export function BusinessSettings() {
  const t = useAppT();

  const validate = (draft: Business): FieldErrors => {
    const errors: FieldErrors = {};
    if (draft.openTime >= draft.closeTime) errors.closeTime = t("cfg.business.error.hours");
    for (const key of LINKS) if (draft[key].trim() && !URL_LIKE.test(draft[key].trim())) errors[key] = t("cfg.business.error.url");
    return errors;
  };

  return (
    <SettingsDocument section="business" schema={businessSchema} validate={validate}>
      {({ draft, set, errors }) => (
        <>
          <SettingsCard title={t("cfg.business.time")} description={t("cfg.business.timeHint")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("cfg.business.timezone")} required>
                <Select value={draft.timezone} onValueChange={(value) => set("timezone", value)}>
                  <SelectTrigger data-testid="business-timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((zone) => (
                      <SelectItem key={zone} value={zone}>
                        {zone.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("cfg.business.weekStart")} required>
                <ThemaTabs
                  className="mb-0"
                  fitContent
                  tabs={[
                    { id: "monday", label: t("cfg.business.monday") },
                    { id: "sunday", label: t("cfg.business.sunday") },
                  ]}
                  activeTabId={draft.weekStart}
                  onTabChange={(id) => set("weekStart", id as Business["weekStart"])}
                />
              </Field>
              <Field label={t("cfg.business.timeFormat")} required>
                <ThemaTabs
                  className="mb-0"
                  fitContent
                  tabs={[
                    { id: "12h", label: t("cfg.business.format12") },
                    { id: "24h", label: t("cfg.business.format24") },
                  ]}
                  activeTabId={draft.timeFormat}
                  onTabChange={(id) => set("timeFormat", id as Business["timeFormat"])}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label={t("cfg.business.openTime")}>
                  <Input type="time" value={draft.openTime} onChange={(event) => set("openTime", event.target.value)} />
                </Field>
                <Field label={t("cfg.business.closeTime")} error={errors.closeTime}>
                  <Input type="time" value={draft.closeTime} onChange={(event) => set("closeTime", event.target.value)} aria-invalid={!!errors.closeTime} data-testid="business-close" />
                </Field>
              </div>
            </div>
            <Field label={t("cfg.business.holidays")} description={t("cfg.business.holidaysHint")}>
              <MultiSelect options={HOLIDAYS.map((holiday) => ({ value: holiday.id, label: t(holiday.key) }))} value={draft.holidays} onValueChange={(value) => set("holidays", value)} placeholder={t("cfg.business.holidaysPlaceholder")} searchPlaceholder={t("cfg.search")} emptyMessage={t("cfg.noResults")} />
            </Field>
          </SettingsCard>

          <SettingsCard title={t("cfg.business.links")} description={t("cfg.business.linksHint")}>
            <div className="grid gap-4 sm:grid-cols-2">
              {LINKS.map((key) => (
                <Field key={key} label={t(LINK_KEYS[key])} error={errors[key]}>
                  <Input type="url" inputMode="url" placeholder="https://" value={draft[key]} onChange={(event) => set(key, event.target.value)} aria-invalid={!!errors[key]} autoComplete="off" data-testid={`business-${key}`} />
                </Field>
              ))}
            </div>
          </SettingsCard>
        </>
      )}
    </SettingsDocument>
  );
}
