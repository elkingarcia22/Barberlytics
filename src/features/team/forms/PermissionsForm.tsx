import { RotateCcw } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { PermissionMatrix } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/typography";
import { PERMISSION_BLOCKS, PERMISSION_COLUMN_KEYS, PERMISSION_COLUMNS, ROLE_DEFAULT_PERMISSIONS, permissionSummary } from "../permissionsCatalog";
import type { Permissions, TeamRole } from "../types";

/**
 * La pestaña Permisos: la matriz de esa persona. Nace copiada del rol y se
 * personaliza aquí; «Restablecer» vuelve a los valores de fábrica del rol.
 */

export interface PermissionsFormProps {
  role: TeamRole;
  value: Permissions;
  onChange?: (value: Permissions) => void;
}

export function PermissionsForm({ role, value, onChange }: PermissionsFormProps) {
  const t = useAppT();
  const summary = permissionSummary(value);
  const blocks = PERMISSION_BLOCKS.map((block) => ({
    id: block.id,
    label: t(block.labelKey),
    rows: block.rows.map((row) => ({ id: row.id, label: t(row.labelKey), columns: row.columns })),
  }));
  const columns = PERMISSION_COLUMNS.map((column) => ({ id: column, label: t(PERMISSION_COLUMN_KEYS[column]) }));

  return (
    <div className="space-y-3" data-testid="permissions-form">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <Text variant="muted">{t("teamMember.permissions.hint")}</Text>
        </span>
        <span className="flex items-center gap-2">
          <Badge variant="neutral">{t("teamMember.permissions.summary", { granted: summary.granted, total: summary.total })}</Badge>
          {onChange && (
            <Button type="button" variant="outline" size="sm" onClick={() => onChange(ROLE_DEFAULT_PERMISSIONS[role])}>
              <RotateCcw /> {t("teamMember.permissions.reset")}
            </Button>
          )}
        </span>
      </div>
      <PermissionMatrix blocks={blocks} columns={columns} value={value} onChange={onChange} />
    </div>
  );
}
