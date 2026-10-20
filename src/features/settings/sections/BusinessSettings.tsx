import * as React from "react";
import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";
import { useLocale } from "@/i18n";
import { Field, MultiSelect } from "@/components/forms";
import { ThemaTabs } from "@/components/navigation";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SettingsCard, SettingsDocument, type FieldErrors } from "../SettingsFormParts";
import { useSettingsList } from "../settingsQueries";
import { branchSchema, businessSchema, type BusinessSettings as Business } from "../settingsTypes";
import { DEFAULT_CLOSED_HOLIDAYS, PACK_COUNTRIES, PACK_TIMEZONES, countryHolidays, packCountryOf, upcomingClosures, type PackCountry } from "../countryPack";

const COUNTRY_KEYS: Readonly<Record<PackCountry, AppMessageKey>> = { CO: "cfg.country.CO", MX: "cfg.country.MX", US: "cfg.country.US" };
const DATE_OPTIONS: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
const NEXT_CLOSURES = 3;

/** «AAAA-MM-DD» de hoy, en la hora del dispositivo. */
const todayKey = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};
const dateOf = (key: string): Date => new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, Number(key.slice(8, 10)));

const LINKS = ["website", "instagram", "facebook", "googleMaps"] as const;
const LINK_KEYS: Record<(typeof LINKS)[number], AppMessageKey> = { website: "cfg.business.website", instagram: "cfg.business.instagram", facebook: "cfg.business.facebook", googleMaps: "cfg.business.googleMaps" };
const URL_LIKE = /^https?:\/\/\S+\.\S+/;

/**
 * Perfil del negocio: cómo se cuenta el tiempo —zona, formato, semana y
 * horario— y dónde encuentra el cliente a la barbería en internet.
 */
export function BusinessSettings() {
  const t = useAppT();
  const { formatDate } = useLocale();
  const branches = useSettingsList("branches", branchSchema);
  const [today] = React.useState(todayKey);
  // Los países de las sucursales activas, en el orden del paquete: sus festivos son las opciones.
  const countries = React.useMemo(() => {
    const present = new Set((branches.data?.items ?? []).filter((branch) => branch.status === "active").map((branch) => packCountryOf(branch.country)));
    return PACK_COUNTRIES.filter((country) => present.has(country));
  }, [branches.data]);
  const year = Number(today.slice(0, 4));
  const holidayOptions = React.useMemo(() => {
    const ids = [...new Set(countries.flatMap((country) => countryHolidays(country, year).map((holiday) => holiday.id)))];
    return ids.map((id) => ({ value: id, label: t(`cfg.holiday.${id}` as AppMessageKey) }));
  }, [countries, year, t]);

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
                    {(PACK_TIMEZONES.includes(draft.timezone) ? PACK_TIMEZONES : [draft.timezone, ...PACK_TIMEZONES]).map((zone) => (
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
            <Text variant="muted">{t("cfg.business.hoursDefault")}</Text>
            <Field label={t("cfg.business.holidays")} description={t("cfg.business.holidaysHint")}>
              <MultiSelect options={holidayOptions} value={draft.holidays} onValueChange={(value) => set("holidays", value)} placeholder={t("cfg.business.holidaysPlaceholder")} searchPlaceholder={t("cfg.search")} emptyMessage={t("cfg.noResults")} data-testid="business-holidays" />
            </Field>
            {countries.length === 0 && branches.data && <Text variant="muted">{t("cfg.business.holidaysNone")}</Text>}
            <ul className="space-y-2" data-testid="business-holidays-next">
              {countries.map((country) => {
                const next = upcomingClosures(country, draft.holidays, today, NEXT_CLOSURES);
                const usual = DEFAULT_CLOSED_HOLIDAYS[country];
                const hasUsual = usual.every((id) => draft.holidays.includes(id));
                return (
                  <li key={country} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-text-secondary">
                      {t("cfg.business.holidaysNext", { country: t(COUNTRY_KEYS[country]), dates: next.length > 0 ? next.map((holiday) => formatDate(dateOf(holiday.observedDate ?? holiday.date), DATE_OPTIONS)).join(" · ") : "—" })}
                    </span>
                    {!hasUsual && (
                      <Button type="button" variant="outline" size="xs" onClick={() => set("holidays", [...new Set([...draft.holidays, ...usual])])} data-testid={`business-holidays-use-${country}`}>
                        {t("cfg.business.holidaysUse", { country: t(COUNTRY_KEYS[country]) })}
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
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
