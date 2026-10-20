import { Building2 } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { Field, PhoneInput } from "@/components/forms";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { IconTile } from "@/components/utility";
import { Text } from "@/components/typography";
import type { FieldErrors } from "../SettingsFormParts";
import { SettingsList } from "../SettingsListParts";
import { useSettingsList, useSettingsSection } from "../settingsQueries";
import { CURRENCIES, branchSchema, gatewaySchema, pricingSchema, taxGroupSchema, type Branch, type BranchInput, type Gateway, type TaxGroup } from "../settingsTypes";
import { COUNTRY_PACKS, GATEWAY_COUNTRY_OK, findUsualTaxGroup, PACK_COUNTRIES, branchDefaultsFor, isValidTaxId, packCountryOf, packOf, timezonesFor, type PackCountry, type TaxIdKind } from "../countryPack";
import type { AppMessageKey } from "@/app/i18n/types";
const LANGUAGES: readonly { id: string; name: string }[] = [
  { id: "es", name: "Español" },
  { id: "en", name: "English" },
];
const EMPTY: BranchInput = { name: "", legalName: "", taxId: "", country: "", state: "", city: "", address: "", zipcode: "", phone: "", currency: "USD", language: "es", timezone: "America/New_York", taxGroupId: null, gatewayId: null, description: "" };
const COUNTRY_KEYS: Readonly<Record<PackCountry, AppMessageKey>> = { CO: "cfg.country.CO", MX: "cfg.country.MX", US: "cfg.country.US" };
const TAX_ID_KEYS: Readonly<Record<TaxIdKind, { label: AppMessageKey; error: AppMessageKey }>> = {
  nit: { label: "cfg.taxId.nit", error: "cfg.taxId.nitError" },
  rfc: { label: "cfg.taxId.rfc", error: "cfg.taxId.rfcError" },
  ein: { label: "cfg.taxId.ein", error: "cfg.taxId.einError" },
};

/**
 * Elegir el país pone lo suyo: moneda, zona (si la que había no es de allí) e idioma; el impuesto habitual si
 * ya existe con ese nombre, y quita la pasarela si no opera allí.
 */
function applyCountry(draft: BranchInput, country: PackCountry, taxGroups: readonly TaxGroup[], gateways: readonly Gateway[]): BranchInput {
  const pack = COUNTRY_PACKS[country];
  const defaults = branchDefaultsFor(country, draft);
  const usualTax = findUsualTaxGroup(country, taxGroups);
  const gateway = gateways.find((item) => item.id === draft.gatewayId);
  return {
    ...draft,
    country,
    ...defaults,
    taxGroupId: usualTax?.id ?? (pack.taxGroup ? draft.taxGroupId : null),
    gatewayId: gateway && GATEWAY_COUNTRY_OK(gateway.provider, country) ? draft.gatewayId : null,
  };
}

/** El valor de un select que no elige nada (Radix no admite la cadena vacía). */
const NONE = "none";
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
  // Una sucursal nueva nace con la moneda de Precios; después cada una tiene la suya.
  const pricing = useSettingsSection("pricing", pricingSchema);
  const taxGroups = useSettingsList("taxGroups", taxGroupSchema);
  const gateways = useSettingsList("gateways", gatewaySchema);

  const validate = (draft: BranchInput): FieldErrors => {
    const errors: FieldErrors = {};
    if (draft.name.trim().length < 2) errors.name = t("cfg.branches.error.name");
    for (const key of REQUIRED) if (!draft[key].trim()) errors[key] = t("cfg.required");
    if (draft.phone.replace(/\D/g, "").length < 8) errors.phone = t("cfg.branches.error.phone");
    const pack = packOf(draft.country);
    if (pack && !isValidTaxId(pack.country, draft.taxId)) errors.taxId = t(TAX_ID_KEYS[pack.taxIdKind].error);
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
      emptyDraft={{ ...EMPTY, currency: pricing.data?.currency ?? EMPTY.currency }}
      toDraft={({ name, legalName, taxId, country: written, state, city, address, zipcode, phone, currency, language, timezone, taxGroupId, gatewayId, description }) => ({ name, legalName, taxId, country: packCountryOf(written) ?? written, state, city, address, zipcode, phone, currency, language, timezone, taxGroupId, gatewayId, description })}
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
      renderForm={({ draft, set, replace, errors }) => (
        <>
          <Field label={t("cfg.branches.name")} required error={errors.name}>
            <Input value={draft.name} onChange={(event) => set("name", event.target.value)} aria-invalid={!!errors.name} autoComplete="off" data-testid="branches-name" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("cfg.company.country")} required error={errors.country}>
              <Select value={draft.country || undefined} onValueChange={(value) => replace(packCountryOf(value) ? applyCountry(draft, value as PackCountry, taxGroups.data?.items ?? [], gateways.data?.items ?? []) : { ...draft, country: value })}>
                <SelectTrigger aria-invalid={!!errors.country} data-testid="branches-country">
                  <SelectValue placeholder={t("cfg.branches.countryPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {PACK_COUNTRIES.map((code) => (
                    <SelectItem key={code} value={code}>
                      {t(COUNTRY_KEYS[code])}
                    </SelectItem>
                  ))}
                  {draft.country && !packCountryOf(draft.country) && <SelectItem value={draft.country}>{draft.country}</SelectItem>}
                </SelectContent>
              </Select>
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
          {packOf(draft.country)?.taxGroup && !draft.taxGroupId && (
            <Text variant="muted" data-testid="branches-pack-tax">
              {t("cfg.branches.packTax", { tax: packOf(draft.country)?.taxGroup?.name ?? "" })}
            </Text>
          )}
          <Field label={t("cfg.branches.address")}>
            <Input value={draft.address} onChange={(event) => set("address", event.target.value)} autoComplete="off" />
          </Field>
          <Field label={t("cfg.company.phone")} required error={errors.phone}>
            <PhoneInput value={draft.phone} onValueChange={(value) => set("phone", value)} defaultCountry={packCountryOf(draft.country) ?? "US"} aria-invalid={!!errors.phone} data-testid="branches-phone" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("cfg.business.timezone")} required>
              <Select value={draft.timezone} onValueChange={(value) => set("timezone", value)}>
                <SelectTrigger data-testid="branches-timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezonesFor(draft.country, draft.timezone).map((zone) => (
                    <SelectItem key={zone} value={zone}>
                      {zone.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("cfg.pricing.currencyField")} required>
              <Select value={draft.currency} onValueChange={(value) => set("currency", value)}>
                <SelectTrigger data-testid="branches-currency">
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
            <Field label={t("cfg.branches.tax")} description={t("cfg.branches.taxHint")}>
              <Select value={draft.taxGroupId ?? NONE} onValueChange={(value) => set("taxGroupId", value === NONE ? null : value)}>
                <SelectTrigger data-testid="branches-tax">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>{t("cfg.branches.noTax")}</SelectItem>
                  {(taxGroups.data?.items ?? []).map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name} · {group.taxes.reduce((sum, tax) => sum + tax.percent, 0)} %
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("cfg.branches.gateway")} description={t("cfg.branches.gatewayHint")}>
              <Select value={draft.gatewayId ?? NONE} onValueChange={(value) => set("gatewayId", value === NONE ? null : value)}>
                <SelectTrigger data-testid="branches-gateway">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>{t("cfg.branches.noGateway")}</SelectItem>
                  {(gateways.data?.items ?? []).filter((gateway) => gateway.id === draft.gatewayId || !packCountryOf(draft.country) || GATEWAY_COUNTRY_OK(gateway.provider, packCountryOf(draft.country) as PackCountry)).map((gateway) => (
                    <SelectItem key={gateway.id} value={gateway.id}>
                      {gateway.name}
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
            <Field label={packOf(draft.country) ? t(TAX_ID_KEYS[(packOf(draft.country) as NonNullable<ReturnType<typeof packOf>>).taxIdKind].label) : t("cfg.company.identification")} error={errors.taxId}>
              <Input value={draft.taxId} onChange={(event) => set("taxId", event.target.value)} placeholder={packOf(draft.country)?.taxIdExample} aria-invalid={!!errors.taxId} autoComplete="off" data-testid="branches-taxId" />
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
