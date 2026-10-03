import * as React from "react";
import { useNavigate, useParams } from "react-router";
import { useAppT } from "@/app/i18n";
import { ShellHeaderSlot } from "@/components/app-shell";
import { Breadcrumbs } from "@/components/navigation";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/feedback";
import { PageHeader } from "@/components/utility";
import { buildSettingsGroups, findSettingsItem } from "./settingsCatalog";
import { BrandIdentitySettings } from "@/features/branding";
import { BillingSettings } from "./sections/BillingSettings";
import { BookingSettings } from "./sections/BookingSettings";
import { BranchesSettings } from "./sections/BranchesSettings";
import { BusinessSettings } from "./sections/BusinessSettings";
import { CardFeeSettings } from "./sections/CardFeeSettings";
import { ClosuresSettings } from "./sections/ClosuresSettings";
import { CommissionSettings } from "./sections/CommissionSettings";
import { CompanySettings } from "./sections/CompanySettings";
import { DeleteAccountSettings } from "./sections/DeleteAccountSettings";
import { DevicesSettings } from "./sections/DevicesSettings";
import { NotificationSettings } from "./sections/NotificationSettings";
import { PaymentsSettings } from "./sections/PaymentsSettings";
import { PayrollCycleSettings } from "./sections/PayrollCycleSettings";
import { PricingSettings } from "./sections/PricingSettings";
import { TaxesSettings } from "./sections/TaxesSettings";
import { TipsSettings } from "./sections/TipsSettings";

/**
 * El formulario de cada ajuste, por su id del catálogo. Uno que entre al
 * catálogo sin cuerpo cae en «Próximamente» hasta que tenga el suyo.
 */
const SETTINGS_BODIES: Record<string, React.ComponentType | undefined> = {
  negocio: BusinessSettings,
  identidad: BrandIdentitySettings,
  sucursales: BranchesSettings,
  cierres: ClosuresSettings,
  agendamiento: BookingSettings,
  "centro-notificaciones": NotificationSettings,
  empresa: CompanySettings,
  precios: PricingSettings,
  impuestos: TaxesSettings,
  propinas: TipsSettings,
  "tarifa-tarjeta": CardFeeSettings,
  dispositivos: DevicesSettings,
  pagos: PaymentsSettings,
  comisiones: CommissionSettings,
  nomina: PayrollCycleSettings,
  facturacion: BillingSettings,
  "eliminar-cuenta": DeleteAccountSettings,
};

/**
 * Un ajuste concreto.
 *
 * El marco es común —migas hasta su grupo, título y descripción del
 * catálogo— y el cuerpo es el formulario de ese ajuste. Un id que no
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
          <Breadcrumbs items={[{ label: t("nav.home"), onClick: () => navigate("/metricas") }, t("settings.title")]} />
        </ShellHeaderSlot>
        <PageHeader title={t("settings.title")} description={t("settings.description")} />
        <EmptyState icon="settings" title={t("soon.title")} description={t("soon.hint")} />
      </>
    );
  }

  const { group, item } = found;
  const Body = SETTINGS_BODIES[item.id];

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
          Body ? (
            item.label
          ) : (
            <span className="flex items-center gap-2">
              {item.label}
              <Badge variant="neutral">{t("soon.badge")}</Badge>
            </span>
          )
        }
        description={item.description}
      />

      {Body ? <Body /> : <EmptyState icon="rocket" title={t("soon.title")} description={t("soon.hint")} />}
    </>
  );
}
