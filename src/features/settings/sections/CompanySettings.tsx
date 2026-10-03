import { useAppT } from "@/app/i18n";
import { Field, PhoneInput } from "@/components/forms";
import { Input } from "@/components/ui/input";
import { SettingsCard, SettingsDocument, type FieldErrors } from "../SettingsFormParts";
import { companySchema, type CompanySettings as Company } from "../settingsTypes";

const URL_LIKE = /^https?:\/\/\S+\.\S+/;

/** Datos legales: la empresa dueña de las sucursales, tal como sale en facturas y recibos. */
export function CompanySettings() {
  const t = useAppT();
  const validate = (draft: Company): FieldErrors => {
    const errors: FieldErrors = {};
    if (draft.name.trim().length < 2) errors.name = t("cfg.company.error.name");
    if (draft.website.trim() && !URL_LIKE.test(draft.website.trim())) errors.website = t("cfg.business.error.url");
    return errors;
  };
  return (
    <SettingsDocument section="company" schema={companySchema} validate={validate}>
      {({ draft, set, errors }) => (
        <SettingsCard title={t("cfg.company.title")} description={t("cfg.company.hint")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("cfg.company.name")} required error={errors.name}>
              <Input value={draft.name} onChange={(event) => set("name", event.target.value)} aria-invalid={!!errors.name} autoComplete="off" data-testid="company-name" />
            </Field>
            <Field label={t("cfg.company.legalName")}>
              <Input value={draft.legalName} onChange={(event) => set("legalName", event.target.value)} autoComplete="off" />
            </Field>
            <Field label={t("cfg.company.identification")} description={t("cfg.company.identificationHint")}>
              <Input value={draft.identification} onChange={(event) => set("identification", event.target.value)} autoComplete="off" />
            </Field>
            <Field label={t("cfg.company.country")}>
              <Input value={draft.country} onChange={(event) => set("country", event.target.value)} autoComplete="off" />
            </Field>
            <Field label={t("cfg.company.phone")}>
              <PhoneInput value={draft.phone} onValueChange={(value) => set("phone", value)} defaultCountry="US" />
            </Field>
            <Field label={t("cfg.business.website")} error={errors.website}>
              <Input type="url" inputMode="url" placeholder="https://" value={draft.website} onChange={(event) => set("website", event.target.value)} aria-invalid={!!errors.website} autoComplete="off" />
            </Field>
          </div>
        </SettingsCard>
      )}
    </SettingsDocument>
  );
}
