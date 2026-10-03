import * as React from "react";
import { useNavigate } from "react-router";
import { RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { describeError } from "@/lib/api";
import { QueryBoundary } from "@/lib/query";
import { ShellHeaderSlot, ShellRailSlot } from "@/components/app-shell";
import { Breadcrumbs, ThemaTabs } from "@/components/navigation";
import { PageHeader } from "@/components/utility";
import { EmptyState } from "@/components/feedback";
import { Sortable } from "@/components/data-display/Sortable";
import { ListItem, ListItemGroup } from "@/components/data-display/ListItem";
import { DataListActionRail } from "@/components/action-rail";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/typography";
import { useLevelsQuery, useMembersQuery, useOrderQuery, useSaveOrder } from "./queries";
import { MemberAvatar } from "./teamShared";
import { memberName, type TeamMember } from "./types";
import { orderedBarbers, useBranchId } from "./teamUtils";

/**
 * Ordenar barberos: el orden de las columnas del calendario, arrastrando
 * desde el asa o con las flechas del teclado. La pestaña Nivel enseña el
 * mismo orden agrupado por nivel.
 */

export function BarberOrderPage() {
  const t = useAppT();
  const navigate = useNavigate();
  const branchId = useBranchId();
  const members = useMembersQuery(branchId);
  const order = useOrderQuery(branchId);
  const levels = useLevelsQuery();
  const save = useSaveOrder();
  const [tab, setTab] = React.useState<"barber" | "level">("barber");
  const [draft, setDraft] = React.useState<TeamMember[] | null>(null);
  const saved = React.useMemo(() => (members.data && order.data ? orderedBarbers(members.data.items, branchId, order.data.calendar) : null), [members.data, order.data, branchId]);
  const list = draft ?? saved ?? [];
  const dirty = draft !== null && saved !== null && draft.map((item) => item.id).join() !== saved.map((item) => item.id).join();

  const persist = () => {
    if (!order.data) return;
    save.mutate(
      { ...order.data, calendar: list.map((item) => item.id) },
      {
        onSuccess: () => {
          toast.success(t("teamOrder.saved"), { description: t("teamOrder.savedHint") });
          setDraft(null);
        },
        onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
      }
    );
  };

  return (
    <div className="space-y-4">
      <ShellHeaderSlot>
        <Breadcrumbs items={[{ label: t("nav.home"), onClick: () => navigate("/metricas") }, { label: t("team.title"), onClick: () => navigate("/usuarios") }, t("teamOrder.title")]} />
      </ShellHeaderSlot>
      <PageHeader title={t("teamOrder.title")} description={t("teamOrder.description")} />
      <ThemaTabs className="mb-2" fitContent tabs={[{ id: "barber", label: t("teamOrder.tab.barber") }, { id: "level", label: t("teamOrder.tab.level") }]} activeTabId={tab} onTabChange={(id) => setTab(id as "barber" | "level")} />

      <QueryBoundary query={order}>
        {() =>
          list.length === 0 ? (
            <EmptyState icon="users" title={t("teamOrder.empty")} description={t("teamOrder.emptyHint")} />
          ) : tab === "barber" ? (
            <Sortable
              items={list}
              getId={(item) => item.id}
              getLabel={memberName}
              onReorder={setDraft}
              handle
              className="space-y-2"
              data-testid="barber-order"
              renderItem={(item, state) => (
                <>
                  <span className="w-6 text-center text-sm font-semibold tabular-nums text-text-secondary">{state.index + 1}</span>
                  <MemberAvatar member={item} />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-semibold text-text-primary">{memberName(item)}</span>
                    <span className="text-xs text-text-muted">{levels.data?.items.find((level) => level.id === item.levelId)?.name ?? t("teamMember.noLevel")}</span>
                  </span>
                </>
              )}
            />
          ) : (
            <div className="space-y-4">
              <Text variant="muted">{t("teamOrder.levelHint")}</Text>
              {[...(levels.data?.items ?? []), { id: "", name: t("teamMember.noLevel") }].map((level) => {
                const group = list.filter((item) => (item.levelId ?? "") === level.id);
                if (group.length === 0) return null;
                return (
                  <section key={level.id} className="space-y-2">
                    <Text variant="label">
                      {level.name} <Badge variant="neutral">{group.length}</Badge>
                    </Text>
                    <ListItemGroup>
                      {group.map((item) => (
                        <ListItem key={item.id} size="sm" leading={<MemberAvatar member={item} size="sm" />} title={memberName(item)} meta={t("teamOrder.position", { position: list.indexOf(item) + 1 })} />
                      ))}
                    </ListItemGroup>
                  </section>
                );
              })}
            </div>
          )
        }
      </QueryBoundary>

      <ShellRailSlot>
        <DataListActionRail
          actions={[
            { id: "reset", label: t("teamOrder.reset"), icon: <RotateCcw className="size-5" strokeWidth={2} />, scope: ["screen"], blockedReason: dirty ? null : t("teamOrder.reset"), onSelect: () => setDraft(null) },
            { id: "save", label: t("teamOrder.save"), icon: <Save className="size-4" strokeWidth={2.5} />, scope: ["screen"], primary: true, onSelect: persist },
          ]}
          selectedCount={0}
          onClearSelection={() => undefined}
        />
      </ShellRailSlot>
    </div>
  );
}
