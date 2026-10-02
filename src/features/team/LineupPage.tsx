import * as React from "react";
import { useNavigate, useSearchParams } from "react-router";
import { RotateCcw, Save, Users } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { describeError } from "@/lib/api";
import { QueryBoundary } from "@/lib/query";
import { ShellHeaderSlot, ShellRailSlot } from "@/components/app-shell";
import { Breadcrumbs, ThemaTabs } from "@/components/navigation";
import { PageHeader } from "@/components/utility";
import { EmptyState } from "@/components/feedback";
import { Sortable } from "@/components/data-display/Sortable";
import { DataListActionRail } from "@/components/action-rail";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/typography";
import { cn } from "@/lib/utils";
import { orderedBarbers } from "./teamUtils";
import { useMembersQuery, useOrderQuery, useSaveOrder } from "./queries";
import { MemberAvatar } from "./teamShared";
import { memberName, type BranchOrder, type LineupEntry, type TeamMember } from "./types";
import { useBranchId } from "./teamUtils";

/**
 * Ordenamiento para agendamiento sin cita y sin preferencia: dos filas —una
 * por tipo de cliente— donde se enciende a quien puede tomarlos y se
 * arrastra el orden en que les toca. Los encendidos llevan número.
 */

type LineupTab = "walkIn" | "noPreference";
const TAB_PARAM: Record<LineupTab, string> = { walkIn: "sin-cita", noPreference: "sin-preferencia" };

interface LineupItem {
  member: TeamMember;
  enabled: boolean;
}

/** La fila completa: lo guardado primero y, al final, quien no estaba (encendido). */
function buildLineup(members: readonly TeamMember[], branchId: string, entries: readonly LineupEntry[]): LineupItem[] {
  const pool = orderedBarbers(members, branchId, entries.map((entry) => entry.memberId));
  return pool.map((member) => ({ member, enabled: entries.find((entry) => entry.memberId === member.id)?.enabled ?? true }));
}

export function LineupPage() {
  const t = useAppT();
  const navigate = useNavigate();
  const branchId = useBranchId();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: LineupTab = searchParams.get("pestana") === TAB_PARAM.noPreference ? "noPreference" : "walkIn";
  const members = useMembersQuery(branchId);
  const order = useOrderQuery(branchId);
  const save = useSaveOrder();
  const [drafts, setDrafts] = React.useState<Partial<Record<LineupTab, LineupItem[]>>>({});
  const saved = React.useMemo(() => (members.data && order.data ? { walkIn: buildLineup(members.data.items, branchId, order.data.walkIn), noPreference: buildLineup(members.data.items, branchId, order.data.noPreference) } : null), [members.data, order.data, branchId]);
  const list = drafts[tab] ?? saved?.[tab] ?? [];
  const setList = (next: LineupItem[]) => setDrafts((current) => ({ ...current, [tab]: next }));
  const dirty = Object.keys(drafts).length > 0;
  const enabledCount = list.filter((item) => item.enabled).length;

  const persist = () => {
    if (!order.data || !saved) return;
    const toEntries = (items: readonly LineupItem[]): LineupEntry[] => items.map((item) => ({ memberId: item.member.id, enabled: item.enabled }));
    const next: BranchOrder = { ...order.data, walkIn: toEntries(drafts.walkIn ?? saved.walkIn), noPreference: toEntries(drafts.noPreference ?? saved.noPreference) };
    save.mutate(next, {
      onSuccess: () => {
        toast.success(t("teamLineup.saved"), { description: t("teamLineup.savedHint", { tab: t(tab === "walkIn" ? "teamLineup.tab.walkIn" : "teamLineup.tab.noPreference") }) });
        setDrafts({});
      },
      onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
    });
  };

  // El número de la fila cuenta solo a los encendidos: un apagado no ocupa turno.
  let position = 0;

  return (
    <div className="space-y-4">
      <ShellHeaderSlot>
        <Breadcrumbs items={[{ label: t("nav.home"), onClick: () => navigate("/dashboard") }, { label: t("team.title"), onClick: () => navigate("/usuarios") }, t("teamLineup.title")]} />
      </ShellHeaderSlot>
      <PageHeader title={t("teamLineup.title")} description={t("teamLineup.description")} />
      <ThemaTabs
        className="mb-2"
        fitContent
        tabs={[
          { id: "walkIn", label: t("teamLineup.tab.walkIn") },
          { id: "noPreference", label: t("teamLineup.tab.noPreference") },
        ]}
        activeTabId={tab}
        onTabChange={(id) =>
          setSearchParams(
            (current) => {
              const params = new URLSearchParams(current);
              params.set("pestana", TAB_PARAM[id as LineupTab]);
              return params;
            },
            { replace: true }
          )
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Text variant="muted">{tab === "walkIn" ? t("teamLineup.walkInHint") : t("teamLineup.noPreferenceHint")}</Text>
        <Badge variant="neutral">{t("teamLineup.enabled", { count: enabledCount })}</Badge>
      </div>

      <QueryBoundary query={order}>
        {() =>
          list.length === 0 ? (
            <EmptyState icon={Users} title={t("teamOrder.empty")} description={t("teamOrder.emptyHint")} />
          ) : (
            <Sortable
              key={tab}
              items={list}
              getId={(item) => item.member.id}
              getLabel={(item) => memberName(item.member)}
              onReorder={setList}
              handle
              className="space-y-2"
              data-testid="lineup-list"
              renderItem={(item) => {
                const number = item.enabled ? ++position : null;
                return (
                  <>
                    <span className={cn("w-6 text-center text-sm font-semibold tabular-nums", item.enabled ? "text-text-secondary" : "text-text-muted")}>{number ?? "–"}</span>
                    <MemberAvatar member={item.member} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className={cn("truncate text-sm font-semibold", item.enabled ? "text-text-primary" : "text-text-muted")}>{memberName(item.member)}</span>
                      <span className="text-xs text-text-muted">{item.enabled ? t("teamLineup.takes") : t("teamLineup.skipped")}</span>
                    </span>
                    <Switch aria-label={memberName(item.member)} checked={item.enabled} onCheckedChange={(enabled) => setList(list.map((entry) => (entry.member.id === item.member.id ? { ...entry, enabled } : entry)))} />
                  </>
                );
              }}
            />
          )
        }
      </QueryBoundary>

      <ShellRailSlot>
        <DataListActionRail
          actions={[
            { id: "reset", label: t("teamOrder.reset"), icon: <RotateCcw className="size-5" strokeWidth={2} />, scope: ["screen"], blockedReason: dirty ? null : t("teamOrder.reset"), onSelect: () => setDrafts({}) },
            { id: "save", label: t("teamLineup.save"), icon: <Save className="size-4" strokeWidth={2.5} />, scope: ["screen"], primary: true, onSelect: persist },
          ]}
          selectedCount={0}
          onClearSelection={() => undefined}
        />
      </ShellRailSlot>
    </div>
  );
}
