import * as React from "react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { describeError } from "@/lib/api";
import { QueryBoundary } from "@/lib/query";
import { DrawerShell } from "@/components/overlays";
import { ThemaTabs } from "@/components/navigation";
import { SegmentedControl } from "@/components/selection";
import { ListItem, ListItemGroup } from "@/components/data-display/ListItem";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/typography";
import { useOpenKey } from "@/features/calendar/calendarFormat";
import { useMembersQuery, useSetActivation } from "./queries";
import { MemberAvatar, RoleBadge } from "./teamShared";
import { isBarberRole, memberName, type TeamMember } from "./types";
import { branchName } from "./teamUtils";

/**
 * Activar equipo dentro de esta sucursal: un interruptor por persona de
 * toda la barbería. Una misma persona puede estar activa en varias.
 */

export interface ActivateTeamDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
}

export function ActivateTeamDrawer(props: ActivateTeamDrawerProps) {
  return <ActivatePanel key={useOpenKey(props.open)} {...props} />;
}

function ActivatePanel({ open, onOpenChange, branchId }: ActivateTeamDrawerProps) {
  const t = useAppT();
  const query = useMembersQuery(branchId, true);
  const save = useSetActivation();
  const [tab, setTab] = React.useState<"barbers" | "managers">("barbers");
  const [kind, setKind] = React.useState<"barbero-comision" | "barbero-renta">("barbero-comision");
  const [selected, setSelected] = React.useState<Set<string> | null>(null);
  const members = query.data?.items ?? [];
  const active = selected ?? new Set(members.filter((member) => member.branchIds.includes(branchId)).map((member) => member.id));
  const toggle = (id: string, on: boolean) => {
    const next = new Set(active);
    if (on) next.add(id);
    else next.delete(id);
    setSelected(next);
  };
  const visible = members.filter((member) => member.status !== "inactive" && (tab === "barbers" ? member.role === kind : !isBarberRole(member.role)));

  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={t("teamActivate.title")}
      description={t("teamActivate.hint", { branch: branchName(branchId) })}
      actions={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            disabled={save.isPending || selected === null}
            onClick={() =>
              save.mutate(
                { branchId, memberIds: [...active] },
                {
                  onSuccess: () => {
                    toast.success(t("teamActivate.saved"), { description: t("teamActivate.savedHint", { count: active.size, branch: branchName(branchId) }) });
                    onOpenChange(false);
                  },
                  onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
                }
              )
            }
            data-testid="activate-save"
          >
            {t("teamActivate.save")}
          </Button>
        </>
      }
    >
      <div className="space-y-3" data-testid="activate-drawer">
        <ThemaTabs className="mb-0" fitContent tabs={[{ id: "barbers", label: t("teamActivate.tab.barbers") }, { id: "managers", label: t("teamActivate.tab.managers") }]} activeTabId={tab} onTabChange={(id) => setTab(id as "barbers" | "managers")} />
        {tab === "barbers" && (
          <SegmentedControl size="sm" variant="outline" ariaLabel={t("teamActivate.tab.barbers")} options={[{ value: "barbero-comision", label: t("teamActivate.commission") }, { value: "barbero-renta", label: t("teamActivate.rent") }]} value={kind} onChange={(value) => setKind(value as typeof kind)} />
        )}
        <Text variant="muted">{t("teamActivate.activeCount", { count: visible.filter((member) => active.has(member.id)).length })}</Text>
        <QueryBoundary query={query}>
          {() => (
            <ListItemGroup>
              {visible.map((member: TeamMember) => {
                const others = member.branchIds.filter((id) => id !== branchId).map(branchName);
                return (
                  <ListItem
                    key={member.id}
                    leading={<MemberAvatar member={member} />}
                    title={memberName(member)}
                    description={others.length > 0 ? t("teamActivate.alsoIn", { branches: others.join(", ") }) : t("teamActivate.onlyHere")}
                    meta={<RoleBadge role={member.role} />}
                    actions={<Switch aria-label={`${memberName(member)} · ${branchName(branchId)}`} checked={active.has(member.id)} onCheckedChange={(checked) => toggle(member.id, checked)} />}
                  />
                );
              })}
            </ListItemGroup>
          )}
        </QueryBoundary>
      </div>
    </DrawerShell>
  );
}
