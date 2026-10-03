import * as React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft, CalendarDays, Check, Pencil, Trash2, UserMinus, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { describeError } from "@/lib/api";
import { QueryBoundary } from "@/lib/query";
import { ShellHeaderSlot, ShellRailSlot } from "@/components/app-shell";
import { Breadcrumbs, ThemaTabs } from "@/components/navigation";
import { PageHeader } from "@/components/utility";
import { ConfirmDialog } from "@/components/overlays";
import { EmptyState } from "@/components/feedback";
import { DataListActionRail, type RailActionSpec } from "@/components/action-rail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCatalogQuery } from "@/features/calendar/queries";
import { useMoney } from "@/features/calendar/calendarFormat";
import { MemberTabForm, MemberTabView } from "./MemberTabEditor";
import { draftFromMember, patchForTab, serverFieldErrors, validateTab } from "./memberDraft";
import { useLevelsQuery, useMemberQuery, useRemoveMember, useUpdateMember } from "./queries";
import { MemberAvatar, MemberStatusBadge } from "./teamShared";
import { MEMBER_TAB_KEYS, TEAM_ROLE_KEYS, attendsChair, memberName, memberTabs, type Level, type MemberDraft, type MemberTab, type TeamMember } from "./types";
import { useBranchId, branchName } from "./teamUtils";

/**
 * La ficha de una persona del equipo: la cabecera con quién es, y sus
 * pestañas —Perfil, Servicios, Compensación o Pagos, Calendario, Permisos,
 * Opciones—. Cada pestaña se lee y, al editar, se guarda por separado. Un
 * gerente solo tiene Perfil y Permisos.
 */

const TAB_PARAM: Record<MemberTab, string> = { profile: "perfil", services: "servicios", compensation: "compensacion", payments: "pagos", schedule: "calendario", permissions: "permisos", options: "opciones" };

export function MemberProfilePage() {
  const t = useAppT();
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const branchId = useBranchId();
  const member = useMemberQuery(id);
  const levels = useLevelsQuery();
  const catalog = useCatalogQuery(branchId);
  const formatMoney = useMoney();
  const update = useUpdateMember();
  const remove = useRemoveMember();
  const [confirm, setConfirm] = React.useState<"deactivate" | "delete" | null>(null);

  const editing = searchParams.get("editar") === "1";
  const setEditing = (on: boolean) =>
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (on) next.set("editar", "1");
        else next.delete("editar");
        return next;
      },
      { replace: true }
    );

  return (
    <div className="space-y-4">
      <ShellHeaderSlot>
        <Breadcrumbs items={[{ label: t("nav.home"), onClick: () => navigate("/metricas") }, { label: t("team.title"), onClick: () => navigate("/usuarios") }, member.data ? memberName(member.data) : t("teamMember.title")]} />
      </ShellHeaderSlot>

      <QueryBoundary
        query={member}
        loading={
          <div className="space-y-4">
            <Skeleton className="h-20 w-2/3" />
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-72 w-full" />
          </div>
        }
        error={(error, retry) => (
          <EmptyState
            title={t("teamMember.notFound")}
            description={`${t("teamMember.notFoundHint")} ${describeError(error).description}`}
            action={
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate("/usuarios")}>
                  <ArrowLeft /> {t("teamMember.back")}
                </Button>
                <Button onClick={retry}>{t("common.retry")}</Button>
              </div>
            }
          />
        )}
      >
        {(person) => (
          <MemberProfile
            member={person}
            levels={levels.data?.items ?? []}
            services={catalog.data?.services ?? []}
            formatMoney={formatMoney}
            editing={editing}
            onEditingChange={setEditing}
            tabParam={searchParams.get("pestana")}
            onTabChange={(tab) =>
              setSearchParams(
                (current) => {
                  const next = new URLSearchParams(current);
                  next.set("pestana", TAB_PARAM[tab]);
                  return next;
                },
                { replace: true }
              )
            }
            saving={update.isPending}
            onSave={(tab, draft) =>
              new Promise<Record<string, string>>((resolve) => {
                update.mutate(
                  { id: person.id, patch: patchForTab(tab, draft) },
                  {
                    onSuccess: (updated) => {
                      toast.success(t("teamMember.saved"), { description: t("teamMember.savedHint", { tab: t(MEMBER_TAB_KEYS[tab]), name: memberName(updated) }) });
                      resolve({});
                    },
                    onError: (error) => {
                      toast.error(describeError(error).title, { description: describeError(error).description });
                      resolve(serverFieldErrors(error));
                    },
                  }
                );
              })
            }
            onStatus={(status) => {
              if (status === "inactive") {
                setConfirm("deactivate");
                return;
              }
              update.mutate({ id: person.id, patch: { status: "active" } }, { onSuccess: () => toast.success(t("teamMember.activated")) });
            }}
            onDelete={() => setConfirm("delete")}
          />
        )}
      </QueryBoundary>

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        variant={confirm === "delete" ? "destructive" : "warning"}
        title={confirm === "delete" ? t("teamMember.delete.title", { name: member.data ? memberName(member.data) : "" }) : t("teamMember.deactivate.title", { name: member.data ? memberName(member.data) : "" })}
        description={confirm === "delete" ? t("teamMember.delete.hint") : t("teamMember.deactivate.hint")}
        confirmLabel={confirm === "delete" ? t("teamMember.delete.confirm") : t("teamMember.deactivate.confirm")}
        loading={update.isPending || remove.isPending}
        onConfirm={() => {
          if (!member.data) return;
          if (confirm === "delete") {
            remove.mutate(member.data.id, {
              onSuccess: () => {
                toast.success(t("teamMember.deleted"));
                navigate("/usuarios");
              },
              onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
            });
            return;
          }
          update.mutate(
            { id: member.data.id, patch: { status: "inactive" } },
            {
              onSuccess: () => {
                toast.success(t("teamMember.deactivated"));
                setConfirm(null);
              },
              onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
            }
          );
        }}
      />
    </div>
  );
}

interface MemberProfileProps {
  member: TeamMember;
  levels: readonly Level[];
  services: React.ComponentProps<typeof MemberTabView>["services"];
  formatMoney: (value: number) => string;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
  tabParam: string | null;
  onTabChange: (tab: MemberTab) => void;
  saving: boolean;
  onSave: (tab: MemberTab, draft: MemberDraft) => Promise<Record<string, string>>;
  onStatus: (status: "active" | "inactive") => void;
  onDelete: () => void;
}

function MemberProfile({ member, levels, services, formatMoney, editing, onEditingChange, tabParam, onTabChange, saving, onSave, onStatus, onDelete }: MemberProfileProps) {
  const t = useAppT();
  const navigate = useNavigate();
  const tabs = memberTabs(member.role, member.isAlsoBarber);
  const tab = tabs.find((item) => TAB_PARAM[item] === tabParam) ?? tabs[0];
  const level = levels.find((item) => item.id === member.levelId);
  const subtitle = [t(TEAM_ROLE_KEYS[member.role]), attendsChair(member) ? (level?.name ?? t("teamMember.noLevel")) : null, member.branchIds.map(branchName).join(", ")].filter(Boolean).join(" · ");

  const actions = React.useMemo<readonly RailActionSpec[]>(
    () =>
      editing
        ? []
        : [
            ...(attendsChair(member) ? [{ id: "schedule", label: t("teamMember.action.schedule"), icon: <CalendarDays className="size-5" strokeWidth={2} />, scope: ["screen"] as const, onSelect: () => navigate(`/calendario?equipo=${member.id}`) }] : []),
            member.status === "inactive"
              ? { id: "activate", label: t("teamMember.action.activate"), icon: <UserPlus className="size-5" strokeWidth={2} />, scope: ["screen"] as const, onSelect: () => onStatus("active") }
              : { id: "deactivate", label: t("teamMember.action.deactivate"), icon: <UserMinus className="size-5" strokeWidth={2} />, scope: ["screen"] as const, onSelect: () => onStatus("inactive") },
            { id: "delete", label: t("teamMember.action.delete"), icon: <Trash2 className="size-5" strokeWidth={2} />, scope: ["screen"] as const, tone: "danger" as const, overflow: true, blockedReason: member.role === "owner" ? t("teamMember.deactivate.hint") : null, onSelect: onDelete },
            { id: "edit", label: t("teamMember.action.edit"), icon: <Pencil className="size-4" strokeWidth={2.5} />, scope: ["screen"] as const, primary: true, onSelect: () => onEditingChange(true) },
          ],
    [editing, member, navigate, onDelete, onEditingChange, onStatus, t]
  );

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <MemberAvatar member={member} size="lg" />
            <span className="flex flex-wrap items-center gap-2">
              {memberName(member)}
              <MemberStatusBadge status={member.status} />
              {member.isAlsoBarber && <Badge variant="outline">{t("teamMember.alsoBarber")}</Badge>}
              {editing && <Badge>{t("teamMember.editing")}</Badge>}
            </span>
          </span>
        }
        description={subtitle}
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate("/usuarios")}>
            <ArrowLeft /> {t("teamMember.back")}
          </Button>
        }
      />

      <ThemaTabs className="mb-4" variant="page" fitContent tabs={tabs.map((item) => ({ id: item, label: t(MEMBER_TAB_KEYS[item]) }))} activeTabId={tab} onTabChange={(id) => onTabChange(id as MemberTab)} />

      {editing ? (
        <TabEditor key={`${member.id}-${tab}`} tab={tab} member={member} levels={levels} services={services} formatMoney={formatMoney} saving={saving} onSave={onSave} onCancel={() => onEditingChange(false)} />
      ) : (
        <MemberTabView tab={tab} member={member} levels={levels} services={services} formatMoney={formatMoney} />
      )}

      {!editing && (
        <ShellRailSlot>
          <DataListActionRail actions={actions} selectedCount={0} onClearSelection={() => undefined} />
        </ShellRailSlot>
      )}
    </>
  );
}

function TabEditor({ tab, member, levels, services, formatMoney, saving, onSave, onCancel }: { tab: MemberTab; member: TeamMember; levels: readonly Level[]; services: MemberProfileProps["services"]; formatMoney: (value: number) => string; saving: boolean; onSave: MemberProfileProps["onSave"]; onCancel: () => void }) {
  const t = useAppT();
  const [draft, setDraft] = React.useState<MemberDraft>(() => draftFromMember(member));
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const save = async () => {
    const clientErrors = validateTab(tab, draft);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;
    const serverErrors = await onSave(tab, draft);
    setErrors(serverErrors);
    if (Object.keys(serverErrors).length === 0) onCancel();
  };

  return (
    <div className="space-y-4" data-testid="member-editor">
      <MemberTabForm tab={tab} draft={draft} onChange={setDraft} levels={levels} services={services} errors={errors} formatMoney={formatMoney} />
      <div className="sticky bottom-4 z-sticky flex justify-end gap-2 rounded-xl border border-border bg-surface/95 p-3 shadow-card backdrop-blur">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          <X /> {t("teamMember.action.cancel")}
        </Button>
        <Button onClick={() => void save()} disabled={saving} data-testid="member-save">
          <Check /> {t("teamMember.action.save")}
        </Button>
      </div>
    </div>
  );
}
