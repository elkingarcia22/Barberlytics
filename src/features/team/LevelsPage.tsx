import * as React from "react";
import { useNavigate } from "react-router";
import { Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { describeError } from "@/lib/api";
import { QueryBoundary } from "@/lib/query";
import { ShellHeaderSlot, ShellRailSlot } from "@/components/app-shell";
import { Breadcrumbs } from "@/components/navigation";
import { PageHeader, IconTile } from "@/components/utility";
import { ConfirmDialog, ModalShell } from "@/components/overlays";
import { EmptyState } from "@/components/feedback";
import { Field } from "@/components/forms";
import { ListItem, ListItemGroup } from "@/components/data-display/ListItem";
import { RowActionsMenu } from "@/components/data-display";
import { DataListActionRail } from "@/components/action-rail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { useAccess } from "@/features/access";
import { useOpenKey } from "@/features/calendar/calendarFormat";
import { useCreateLevel, useLevelsQuery, useMembersQuery, useRemoveLevel, useUpdateLevel } from "./queries";
import { MemberAvatar } from "./teamShared";
import { isBarberRole, type Level, type TeamMember } from "./types";
import { useBranchId } from "./teamUtils";

/**
 * Niveles: la lista con cuántos barberos tiene cada uno, y crear, editar o
 * borrar un nivel. Un nivel con barberos no se borra.
 */

const MAX_FACES = 4;

export function LevelsPage() {
  const t = useAppT();
  const navigate = useNavigate();
  const branchId = useBranchId();
  const levels = useLevelsQuery();
  const members = useMembersQuery(branchId, true);
  const create = useCreateLevel();
  const update = useUpdateLevel();
  const remove = useRemoveLevel();
  // Ver niveles no es gestionarlos: crear, renombrar y borrar van por su casilla.
  const access = useAccess();
  const canCreate = access.can("levels", "create");
  const canEdit = access.can("levels", "edit");
  const canDelete = access.can("levels", "delete");
  const [dialog, setDialog] = React.useState<{ mode: "create" } | { mode: "edit"; level: Level } | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<Level | null>(null);
  const barbers = (members.data?.items ?? []).filter((member) => isBarberRole(member.role) && member.status !== "inactive");
  const byLevel = (id: string | null) => barbers.filter((member) => member.levelId === id);

  return (
    <div className="space-y-4">
      <ShellHeaderSlot>
        <Breadcrumbs items={[{ label: t("nav.home"), onClick: () => navigate("/metricas") }, { label: t("team.title"), onClick: () => navigate("/usuarios") }, t("teamLevels.title")]} />
      </ShellHeaderSlot>
      <PageHeader title={t("teamLevels.title")} description={t("teamLevels.description")} meta={levels.data ? <span>{t("teamLevels.total", { count: levels.data.items.length })}</span> : undefined} />

      <QueryBoundary
        query={levels}
        empty={{
          when: (data) => data.items.length === 0,
          render: (
            <EmptyState
              icon="layers"
              title={t("teamLevels.empty")}
              description={t("teamLevels.emptyHint")}
              action={
                canCreate ? (
                  <Button onClick={() => setDialog({ mode: "create" })}>
                    <Plus /> {t("teamLevels.create")}
                  </Button>
                ) : undefined
              }
            />
          ),
        }}
      >
        {(data) => (
          <ListItemGroup data-testid="levels-list">
            {data.items.map((level) => (
              <LevelRow key={level.id} level={level} barbers={byLevel(level.id)} onEdit={canEdit ? () => setDialog({ mode: "edit", level }) : undefined} onDelete={canDelete ? () => setPendingDelete(level) : undefined} onOpen={(id) => navigate(`/usuarios/miembros/${id}`)} />
            ))}
            {byLevel(null).length > 0 && (
              <ListItem leading={<IconTile icon={<Layers />} tone="neutral" />} title={t("teamLevels.unassigned")} description={t("teamLevels.unassignedHint")} meta={<Faces members={byLevel(null)} onOpen={(id) => navigate(`/usuarios/miembros/${id}`)} />} />
            )}
          </ListItemGroup>
        )}
      </QueryBoundary>

      <LevelDialog
        key={`${useOpenKey(dialog !== null)}-${dialog?.mode === "edit" ? dialog.level.id : "new"}`}
        state={dialog}
        onClose={() => setDialog(null)}
        saving={create.isPending || update.isPending}
        onSubmit={(name) => {
          if (!dialog) return;
          const done = (message: string) => {
            toast.success(message);
            setDialog(null);
          };
          const fail = (error: unknown) => toast.error(describeError(error).title, { description: describeError(error).description });
          if (dialog.mode === "create") create.mutate(name, { onSuccess: () => done(t("teamLevels.created")), onError: fail });
          else update.mutate({ id: dialog.level.id, name }, { onSuccess: () => done(t("teamLevels.updated")), onError: fail });
        }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        variant="destructive"
        title={t("teamLevels.deleteTitle", { name: pendingDelete?.name ?? "" })}
        description={t("teamLevels.deleteHint")}
        confirmLabel={t("teamLevels.delete")}
        loading={remove.isPending}
        onConfirm={() => {
          if (!pendingDelete) return;
          remove.mutate(pendingDelete.id, {
            onSuccess: () => {
              toast.success(t("teamLevels.deleted"));
              setPendingDelete(null);
            },
            onError: (error) => {
              toast.error(describeError(error).title, { description: describeError(error).description });
              setPendingDelete(null);
            },
          });
        }}
      />

      {canCreate && (
      <ShellRailSlot>
        <DataListActionRail
          actions={[{ id: "create-level", label: t("teamLevels.create"), icon: <Plus className="size-4" strokeWidth={2.5} />, scope: ["screen"], primary: true, onSelect: () => setDialog({ mode: "create" }) }]}
          selectedCount={0}
          onClearSelection={() => undefined}
          isBlocked={dialog !== null || pendingDelete !== null}
        />
      </ShellRailSlot>
      )}
    </div>
  );
}

function Faces({ members, onOpen }: { members: readonly TeamMember[]; onOpen: (id: string) => void }) {
  if (members.length === 0) return null;
  return (
    <AvatarGroup>
      {members.slice(0, MAX_FACES).map((member) => (
        <button key={member.id} type="button" onClick={() => onOpen(member.id)} className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50" aria-label={`${member.firstName} ${member.lastName}`}>
          <MemberAvatar member={member} size="sm" />
        </button>
      ))}
      {members.length > MAX_FACES && <AvatarGroupCount>+{members.length - MAX_FACES}</AvatarGroupCount>}
    </AvatarGroup>
  );
}

function LevelRow({ level, barbers, onEdit, onDelete, onOpen }: { level: Level; barbers: readonly TeamMember[]; onEdit?: () => void; onDelete?: () => void; onOpen: (id: string) => void }) {
  const t = useAppT();
  const count = barbers.length;
  const rowActions = [
    ...(onEdit ? [{ id: "edit", label: t("teamLevels.edit"), icon: <Pencil />, onSelect: onEdit }] : []),
    ...(onDelete ? [{ id: "delete", label: t("teamLevels.delete"), icon: <Trash2 />, tone: "danger" as const, blockedReason: count > 0 ? t("teamLevels.deleteHint") : null, onSelect: onDelete }] : []),
  ];
  return (
    <ListItem
      leading={<IconTile icon={<Layers />} tone={count > 0 ? "primary" : "neutral"} />}
      title={level.name}
      description={count === 0 ? t("teamLevels.noBarbers") : count === 1 ? t("teamLevels.barbersOne") : t("teamLevels.barbers", { count })}
      meta={
        <span className="flex items-center gap-3">
          <Faces members={barbers} onOpen={onOpen} />
          <Badge variant="neutral">{count}</Badge>
        </span>
      }
      actions={rowActions.length > 0 ? <RowActionsMenu rowLabel={level.name} actions={rowActions} /> : undefined}
    />
  );
}

function LevelDialog({ state, onClose, saving, onSubmit }: { state: { mode: "create" } | { mode: "edit"; level: Level } | null; onClose: () => void; saving: boolean; onSubmit: (name: string) => void }) {
  const t = useAppT();
  const [name, setName] = React.useState(state?.mode === "edit" ? state.level.name : "");
  return (
    <ModalShell
      open={state !== null}
      onOpenChange={(open) => !open && onClose()}
      title={state?.mode === "edit" ? t("teamLevels.edit") : t("teamLevels.create")}
      actions={
        <>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button disabled={name.trim().length < 2 || saving} onClick={() => onSubmit(name.trim())} data-testid="level-submit">
            {state?.mode === "edit" ? t("common.save") : t("teamLevels.create")}
          </Button>
        </>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim().length >= 2) onSubmit(name.trim());
        }}
      >
        <Field label={t("teamLevels.name")} required>
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder={t("teamLevels.namePlaceholder")} autoFocus data-testid="level-name" />
        </Field>
      </form>
    </ModalShell>
  );
}
