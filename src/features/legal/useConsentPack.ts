import * as React from "react";
import { useLocale } from "@/i18n";
import { useSettingsList, useSettingsSection } from "@/features/settings/settingsQueries";
import { branchSchema, companySchema } from "@/features/settings/settingsTypes";
import { consentPack, healthConsentTexts, type ConsentPack, type HealthConsentTexts } from "./consent";

/** El texto del consentimiento para una sucursal de la barbería (su país), en el idioma de la app. */
export function useBranchConsentPack(branchId: string | null | undefined): ConsentPack {
  const { locale } = useLocale();
  const branches = useSettingsList("branches", branchSchema);
  const company = useSettingsSection("company", companySchema);
  const branch = branches.data?.items.find((item) => item.id === branchId) ?? branches.data?.items[0];
  const country = branch?.country ?? company.data?.country;
  const shop = company.data?.name ?? branch?.name ?? "";
  return React.useMemo(() => consentPack(country, locale === "en" ? "en" : "es", shop), [country, locale, shop]);
}

/** El permiso aparte para datos de salud, con el nombre de la barbería y en el idioma de la app. */
export function useHealthConsentTexts(): HealthConsentTexts {
  const { locale } = useLocale();
  const company = useSettingsSection("company", companySchema);
  const shop = company.data?.name ?? "";
  return React.useMemo(() => healthConsentTexts(locale === "en" ? "en" : "es", shop), [locale, shop]);
}
