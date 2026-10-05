import * as React from "react";
import { useAppT } from "@/app/i18n";
import { ThemaTabs } from "@/components/navigation";
import { PermissionsForm } from "@/features/team/forms/PermissionsForm";
import { ROLE_DEFAULT_PERMISSIONS } from "@/features/team/permissionsCatalog";
import { TEAM_ROLE_KEYS, teamRoleSchema, type TeamRole } from "@/features/team/types";
import { SettingsCard } from "../SettingsFormParts";

/**
 * Permisos por rol: la matriz de fábrica con la que nace cada persona, una
 * pestaña por rol, como en producción. Es de consulta: los permisos se
 * personalizan en la ficha de cada persona (Equipo › Permisos). Solo la ve
 * quien tiene la casilla «Permisos».
 */
export function RolePermissionsSettings() {
  const t = useAppT();
  const [role, setRole] = React.useState<TeamRole>("barbero-comision");

  return (
    <SettingsCard title={t("settings.permissions")} description={t("cfg.permissions.hint")}>
      <ThemaTabs
        className="mb-0"
        fitContent
        tabs={teamRoleSchema.options.map((option) => ({ id: option, label: t(TEAM_ROLE_KEYS[option]) }))}
        activeTabId={role}
        onTabChange={(id) => setRole(id as TeamRole)}
      />
      <PermissionsForm role={role} value={ROLE_DEFAULT_PERMISSIONS[role]} />
    </SettingsCard>
  );
}
