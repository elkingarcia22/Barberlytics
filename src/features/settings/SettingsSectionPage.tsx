import * as React from "react";
import { Settings } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { useAppT } from "@/app/i18n";
import { ShellHeaderSlot } from "@/components/app-shell";
import { Breadcrumbs } from "@/components/navigation";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/feedback";
import { PageHeader } from "@/components/utility";
import { buildSettingsGroups, findSettingsItem } from "./settingsCatalog";
import { SETTINGS_ICONS } from "./settingsIcons";

/**
 * Un ajuste concreto, todavía sin formulario.
 *
 * El marco ya es el definitivo —migas hasta su grupo, título y descripción del
 * catálogo—, así que construir el ajuste es rellenar el cuerpo. Un id que no
 * está en el catálogo cae en la propia pantalla de configuración en vez de en
 * un 404: el ajuste no existe, pero el sitio donde buscarlo sí.
 */
export function SettingsSectionPage() {
  const t = useAppT();
  const navigate = useNavigate();
  const { seccion } = useParams();
  const groups = React.useMemo(() => buildSettingsGroups(t), [t]);
  const found = findSettingsItem(groups, seccion);

  if (!found) {
    return (
      <>
        <ShellHeaderSlot>
          <Breadcrumbs items={[{ label: t("nav.home"), onClick: () => navigate("/dashboard") }, t("settings.title")]} />
        </ShellHeaderSlot>
        <PageHeader title={t("settings.title")} description={t("settings.description")} />
        <EmptyState icon={Settings} title={t("soon.title")} description={t("soon.hint")} />
      </>
    );
  }

  const { group, item } = found;
  const Icon = SETTINGS_ICONS[item.id] ?? Settings;

  return (
    <>
      <ShellHeaderSlot>
        <Breadcrumbs
          items={[
            { label: t("settings.title"), onClick: () => navigate("/configuracion") },
            // El grupo no tiene pantalla propia —es una sección dentro de
            // Configuración—, así que su tramo vuelve al mismo sitio que
            // "Configuración" en vez de quedarse sin destino.
            { label: group.label, onClick: () => navigate("/configuracion") },
            item.label,
          ]}
        />
      </ShellHeaderSlot>

      <PageHeader
        title={
          <span className="flex items-center gap-2">
            {item.label}
            <Badge variant="neutral">{t("soon.badge")}</Badge>
          </span>
        }
        description={item.description}
      />

      <EmptyState icon={Icon} title={t("soon.title")} description={t("soon.hint")} />
    </>
  );
}
