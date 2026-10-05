import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { Field } from "@/components/forms";
import { ThemaTabs } from "@/components/navigation";
import { SettingsCard } from "../SettingsFormParts";
import { usePersonalTimeFormat, type PersonalTimeFormat } from "../personalPreferences";

/**
 * Mis preferencias: lo que cada persona ajusta para sí y no toca a nadie más.
 * Es lo único de Configuración que ve un barbero además de su usuario, así que
 * nunca le queda la pantalla vacía. El cambio se guarda al elegirlo.
 */
export function PersonalSettings() {
  const t = useAppT();
  const [timeFormat, setTimeFormat] = usePersonalTimeFormat();

  const pick = (id: string) => {
    const saved = setTimeFormat(id as PersonalTimeFormat);
    if (saved) toast.success(t("cfg.prefs.saved"));
    else toast.error(t("cfg.prefs.notSaved"));
  };

  return (
    <SettingsCard title={t("cfg.prefs.title")} description={t("cfg.prefs.hint")}>
      <Field label={t("cfg.business.timeFormat")}>
        <ThemaTabs
          className="mb-0"
          fitContent
          tabs={[
            { id: "business", label: t("cfg.prefs.business") },
            { id: "12h", label: t("cfg.business.format12") },
            { id: "24h", label: t("cfg.business.format24") },
          ]}
          activeTabId={timeFormat}
          onTabChange={pick}
        />
      </Field>
    </SettingsCard>
  );
}
