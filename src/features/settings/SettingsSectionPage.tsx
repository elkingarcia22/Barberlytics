import * as React from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { Eye } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { ShellHeaderSlot } from "@/components/app-shell";
import { Breadcrumbs } from "@/components/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ROLE_HOME, useAccess } from "@/features/access";
import { EmptyState } from "@/components/feedback";
import { PageHeader } from "@/components/utility";
import { buildSettingsGroups, findSettingsItem, settingsLevel } from "./settingsCatalog";
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
import { LoginSettings } from "./sections/LoginSettings";
import { NotificationSettings } from "./sections/NotificationSettings";
import { PaymentsSettings } from "./sections/PaymentsSettings";
import { PersonalSettings } from "./sections/PersonalSettings";
import { RolePermissionsSettings } from "./sections/RolePermissionsSettings";
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
  preferencias: PersonalSettings,
  "inicio-sesion": LoginSettings,
  permisos: RolePermissionsSettings,
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
 *
 * Uno que existe pero que el rol no ve lleva a «Sin permiso» (también al
 * llegar por URL). Uno que solo puede consultar se pinta entero pero
 * deshabilitado, con un aviso: se ve cómo está, no se cambia.
 */
export function SettingsSectionPage() {
  const t = useAppT();
  const navigate = useNavigate();
  const { seccion } = useParams();
  const access = useAccess();
  const groups = React.useMemo(() => buildSettingsGroups(t, access), [t, access]);
  const found = findSettingsItem(groups, seccion);
  const known = findSettingsItem(buildSettingsGroups(t), seccion) !== undefined;
  const level = settingsLevel(seccion, access);

  if (known && level === null) return <Navigate to="/403" replace />;

  if (!found) {
    return (
      <>
        <ShellHeaderSlot>
          <Breadcrumbs items={[{ label: t("nav.home"), onClick: () => navigate(ROLE_HOME[access.role]) }, t("settings.title")]} />
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

      {!Body ? (
        <EmptyState icon="rocket" title={t("soon.title")} description={t("soon.hint")} />
      ) : level === "view" ? (
        <div className="space-y-4">
          <Alert data-testid="settings-read-only">
            <Eye />
            <AlertTitle>{t("cfg.readOnly.title")}</AlertTitle>
            <AlertDescription>{t("cfg.readOnly.hint")}</AlertDescription>
          </Alert>
          {/* Un `fieldset` deshabilitado apaga de una vez cada campo y cada botón del formulario. */}
          <fieldset disabled className="min-w-0">
            <Body />
          </fieldset>
        </div>
      ) : (
        <Body />
      )}
    </>
  );
}
