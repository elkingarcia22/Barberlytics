import * as React from "react";
import { useNavigate } from "react-router";
import { Armchair, ConciergeBell, Crown, Scissors, ShieldCheck } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { DrawerShell } from "@/components/overlays";
import { CardSelection } from "@/components/selection";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/typography";
import { useAccess } from "@/features/access";
import { creatableRoles } from "./teamAccess";
import { ROLE_PITCH_KEYS, TEAM_ROLE_KEYS, type TeamRole } from "./types";

/**
 * Crear miembro del equipo: una tarjeta por rol con lo que implica. Al
 * elegir y tocar «Crear» se abre el alta paso a paso con ese rol. Solo se
 * ofrecen los roles que quien crea gestiona: dueños y administradores, el dueño.
 */

const ROLE_ICONS: Record<TeamRole, React.ComponentType<{ className?: string }>> = { owner: Crown, admin: ShieldCheck, recepcion: ConciergeBell, "barbero-comision": Scissors, "barbero-renta": Armchair };

export function CreateMemberDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useAppT();
  const navigate = useNavigate();
  const roles = creatableRoles(useAccess());
  const [role, setRole] = React.useState<TeamRole>(roles.includes("barbero-comision") ? "barbero-comision" : (roles[0] ?? "barbero-comision"));

  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      title={t("teamCreate.title")}
      description={t("teamCreate.pickRoleHint")}
      actions={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              navigate(`/usuarios/nuevo?rol=${role}`);
            }}
            data-testid="create-member-continue"
          >
            {t("teamCreate.create")}
          </Button>
        </>
      }
    >
      <div className="space-y-3" data-testid="create-member-drawer">
        <Text variant="label">{t("teamCreate.pickRole")}</Text>
        <CardSelection
          columns={1}
          value={role}
          onChange={(value) => setRole(value as TeamRole)}
          options={roles.map((option) => ({ value: option, label: t(TEAM_ROLE_KEYS[option]), description: t(ROLE_PITCH_KEYS[option]), icon: ROLE_ICONS[option] }))}
        />
      </div>
    </DrawerShell>
  );
}
