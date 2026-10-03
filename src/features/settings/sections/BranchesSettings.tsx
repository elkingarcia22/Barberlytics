import { Building2 } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { Field, PhoneInput } from "@/components/forms";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { IconTile } from "@/components/utility";
import type { FieldErrors } from "../SettingsFormParts";
import { SettingsList } from "../SettingsListParts";
import { CURRENCIES, branchSchema, type Branch, type BranchInput } from "../settingsTypes";

const TIMEZONES: readonly string[] = ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Bogota", "America/Mexico_City"];
const LANGUAGES: readonly { id: string; name: string }[] = [
  { id: "es", name: "Español" },
  { id: "en", name: "English" },
];
const EMPTY: BranchInput = { name: "", legalName: "", taxId: "", country: "", state: "", city: "", address: "", zipcode: "", phone: "", currency: "USD", language: "es", timezone: "America/New_York", description: "" };
const DATE_OPTIONS: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" };
const REQUIRED = ["country", "state", "city"] as const;

/**
 * Sucursales: los locales del negocio. La lista dice dónde está cada uno y
 * cuánta gente trabaja ahí; crear o editar se hace en un panel, con lo
 * obligatorio arriba —nombre, dónde está y cómo se le llama—.
 */
export function BranchesSettings() {
  const t = useAppT();
  const { formatDate } = useLocale();

  const validate = (draft: BranchInput): FieldErrors => {
    const errors: FieldErrors = {};
    if (draft.name.trim().length < 2) errors.name = t("cfg.branches.error.name");
    for (const key of REQUIRED) if (!draft[key].trim()) errors[key] = t("cfg.required");
    if (draft.phone.replace(/\D/g, "").length < 8) errors.phone = t("cfg.branches.error.phone");
    return errors;
  };

  return (
    <SettingsList<Branch, BranchInput>
      list="branches"
      schema={branchSchema}
      icon="building"
      drawerSize="lg"
      labelOf={(item) => item.name}
      renderRow={(item) => ({
        leading: <IconTile icon={<Building2 />} tone="primary" />,
        description: [item.address, item.city, item.state].filter(Boolean).join(", "),
        meta: (
          <span className="flex items-center gap-3 whitespace-nowrap">
            <span className="text-xs text-text-muted">
              {t("cfg.branches.team", { count: item.teamSize ?? 0 })} · {formatDate(new Date(item.createdAt), DATE_OPTIONS)}
            </span>
            <StatusBadge status={item.status === "active" ? "active" : "inactive"} label={t(item.status === "active" ? "cfg.active" : "cfg.inactive")} />
          </span>
        ),
      })}
      emptyDraft={EMPTY}
      toDraft={({ name, legalName, taxId, country, state, city, address, zipcode, phone, currency, language, timezone, description }) => ({ name, legalName, taxId, country, state, city, address, zipcode, phone, currency, language, timezone, description })}
      validate={validate}
      messages={{
        count: (count) => t("cfg.branches.count", { count }),
        add: t("cfg.branches.add"),
        emptyTitle: t("cfg.branches.emptyTitle"),
        emptyHint: t("cfg.branches.emptyHint"),
        createTitle: t("cfg.branches.add"),
        editTitle: t("cfg.branches.editTitle"),
        formHint: t("cfg.branches.formHint"),
        created: t("cfg.branches.created"),
        saved: t("cfg.saved"),
        removed: t("cfg.branches.removed"),
        removeTitle: (label) => t("cfg.removeTitle", { name: label }),
        removeHint: t("cfg.branches.removeHint"),
        editAria: (label) => t("cfg.editAria", { name: label }),
        removeAria: (label) => t("cfg.removeAria", { name: label }),
      }}
      renderForm={({ draft, set, errors }) => (
        <>
          <Field label={t("cfg.branches.name")} required error={errors.name}>
            <Input value={draft.name} onChange={(event) => set("name", event.target.value)} aria-invalid={!!errors.name} autoComplete="off" data-testid="branches-name" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("cfg.company.country")} required error={errors.country}>
              <Input value={draft.country} onChange={(event) => set("country", event.target.value)} aria-invalid={!!errors.country} autoComplete="off" data-testid="branches-country" />
            </Field>
            <Field label={t("cfg.branches.state")} required error={errors.state}>
              <Input value={draft.state} onChange={(event) => set("state", event.target.value)} aria-invalid={!!errors.state} autoComplete="off" data-testid="branches-state" />
            </Field>
            <Field label={t("cfg.branches.city")} required error={errors.city}>
              <Input value={draft.city} onChange={(event) => set("city", event.target.value)} aria-invalid={!!errors.city} autoComplete="off" data-testid="branches-city" />
            </Field>
            <Field label={t("cfg.branches.zipcode")}>
              <Input value={draft.zipcode} onChange={(event) => set("zipcode", event.target.value)} autoComplete="off" inputMode="numeric" />
            </Field>
          </div>
          <Field label={t("cfg.branches.address")}>
            <Input value={draft.address} onChange={(event) => set("address", event.target.value)} autoComplete="off" />
          </Field>
          <Field label={t("cfg.company.phone")} required error={errors.phone}>
            <PhoneInput value={draft.phone} onValueChange={(value) => set("phone", value)} defaultCountry="US" aria-invalid={!!errors.phone} data-testid="branches-phone" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("cfg.business.timezone")} required>
              <Select value={draft.timezone} onValueChange={(value) => set("timezone", value)}>
                <SelectTrigger>
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
            <Field label={t("cfg.pricing.currencyField")} required>
              <Select value={draft.currency} onValueChange={(value) => set("currency", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("cfg.branches.language")} required>
              <Select value={draft.language} onValueChange={(value) => set("language", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((language) => (
                    <SelectItem key={language.id} value={language.id}>
                      {language.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("cfg.company.legalName")}>
              <Input value={draft.legalName} onChange={(event) => set("legalName", event.target.value)} autoComplete="off" />
            </Field>
            <Field label={t("cfg.company.identification")}>
              <Input value={draft.taxId} onChange={(event) => set("taxId", event.target.value)} autoComplete="off" />
            </Field>
          </div>
          <Field label={t("cfg.description")}>
            <Textarea value={draft.description} onChange={(event) => set("description", event.target.value)} rows={3} />
          </Field>
        </>
      )}
    />
  );
}
