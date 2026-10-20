import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { IconName } from "@/icons";
import { toast } from "sonner";
import type { ZodType } from "zod";
import { useAppT } from "@/app/i18n";
import { describeError, isApiError } from "@/lib/api";
import { QueryBoundary } from "@/lib/query";
import { ListItem } from "@/components/data-display/ListItem";
import { EmptyState } from "@/components/feedback";
import { ConfirmDialog, DrawerShell } from "@/components/overlays";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/typography";
import type { FieldErrors } from "./SettingsFormParts";
import { useSettingsList, useSettingsListMutations } from "./settingsQueries";
import type { SettingsListId } from "./settingsTypes";

/**
 * Un ajuste que es una lista —sucursales, cierres, impuestos, datáfonos—:
 * las filas, el alta y la edición en un panel, y el borrado con
 * confirmación. Cada ajuste declara cómo se lee una fila y qué campos tiene
 * su formulario; el resto es común.
 */

export interface ListFormContext<D> {
  draft: D;
  set: <K extends keyof D>(key: K, value: D[K]) => void;
  /** Cambiar varios campos a la vez (elegir el país pone moneda, zona e idioma). */
  replace: (next: D) => void;
  errors: FieldErrors;
  /** `true` al editar una fila existente. */
  editing: boolean;
}

export interface SettingsListMessages {
  count: (count: number) => string;
  add: string;
  emptyTitle: string;
  emptyHint: string;
  createTitle: string;
  editTitle: string;
  formHint: string;
  created: string;
  saved: string;
  removed: string;
  removeTitle: (label: string) => string;
  removeHint: string;
  editAria: (label: string) => string;
  removeAria: (label: string) => string;
}

export interface SettingsListProps<T extends { id: string }, D> {
  list: SettingsListId;
  schema: ZodType<T>;
  icon: IconName;
  messages: SettingsListMessages;
  labelOf: (item: T) => string;
  renderRow: (item: T) => { description?: React.ReactNode; meta?: React.ReactNode; leading?: React.ReactNode };
  emptyDraft: D;
  toDraft: (item: T) => D;
  validate: (draft: D) => FieldErrors;
  /** Lo que se manda al guardar, si no es el borrador tal cual. */
  toBody?: (draft: D) => unknown;
  renderForm: (context: ListFormContext<D>) => React.ReactNode;
  drawerSize?: "md" | "lg" | "xl";
}

const FORM_ID = "settings-list-form";

export function SettingsList<T extends { id: string }, D extends object>(props: SettingsListProps<T, D>) {
  const query = useSettingsList(props.list, props.schema);
  return (
    <QueryBoundary query={query} loading={<Skeleton className="h-56 w-full rounded-2xl" data-testid="settings-loading" />}>
      {(data) => <ListBody {...props} items={data.items} />}
    </QueryBoundary>
  );
}

function ListBody<T extends { id: string }, D extends object>({ list, schema, icon, messages, labelOf, renderRow, emptyDraft, toDraft, validate, toBody, renderForm, drawerSize = "md", items }: SettingsListProps<T, D> & { items: readonly T[] }) {
  const t = useAppT();
  const { save, remove } = useSettingsListMutations(list, schema);
  /* `null` = cerrado; `"new"` = alta; una fila = edición. */
  const [editing, setEditing] = React.useState<T | "new" | null>(null);
  const [draft, setDraft] = React.useState<D>(emptyDraft);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [removing, setRemoving] = React.useState<T | null>(null);

  const open = (item: T | "new") => {
    setEditing(item);
    setDraft(item === "new" ? emptyDraft : toDraft(item));
    setErrors({});
  };
  const set = <K extends keyof D>(key: K, value: D[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key as string]: undefined }));
  };
  const replace = (next: D) => {
    setDraft(next);
    setErrors({});
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const found = validate(draft);
    if (Object.values(found).some(Boolean)) {
      setErrors(found);
      return;
    }
    const isNew = editing === "new";
    save.mutate(
      { itemId: isNew || editing === null ? null : editing.id, body: toBody ? toBody(draft) : draft },
      {
        onSuccess: () => {
          toast.success(isNew ? messages.created : messages.saved);
          setEditing(null);
        },
        onError: (error) => {
          const fields = isApiError(error) ? error.fieldErrors : undefined;
          if (fields) setErrors(Object.fromEntries(Object.entries(fields).map(([name, list_]) => [name, list_[0]])));
          else toast.error(describeError(error).title, { description: describeError(error).description });
        },
      }
    );
  };

  const addButton = (
    <Button onClick={() => open("new")} data-testid={`${list}-add`}>
      <Plus /> {messages.add}
    </Button>
  );

  return (
    <>
      {items.length === 0 ? (
        <EmptyState icon={icon} title={messages.emptyTitle} description={messages.emptyHint} action={addButton} />
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Text variant="muted">{messages.count(items.length)}</Text>
            {addButton}
          </div>
          <div className="space-y-2" data-testid={`${list}-list`}>
            {items.map((item) => {
              const row = renderRow(item);
              const label = labelOf(item);
              return (
                <ListItem
                  key={item.id}
                  leading={row.leading}
                  title={label}
                  description={row.description}
                  meta={row.meta}
                  actions={
                    <>
                      <Button variant="ghost" size="icon-sm" aria-label={messages.editAria(label)} onClick={() => open(item)}>
                        <Pencil />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label={messages.removeAria(label)} onClick={() => setRemoving(item)}>
                        <Trash2 />
                      </Button>
                    </>
                  }
                />
              );
            })}
          </div>
        </div>
      )}

      <DrawerShell
        open={editing !== null}
        onOpenChange={(next) => !next && setEditing(null)}
        size={drawerSize}
        title={editing === "new" ? messages.createTitle : messages.editTitle}
        description={messages.formHint}
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => setEditing(null)} disabled={save.isPending}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form={FORM_ID} disabled={save.isPending} data-testid={`${list}-submit`}>
              {t("cfg.save")}
            </Button>
          </>
        }
      >
        {editing !== null && (
          <form id={FORM_ID} onSubmit={submit} noValidate className="space-y-5">
            {renderForm({ draft, set, replace, errors, editing: editing !== "new" })}
          </form>
        )}
      </DrawerShell>

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(next) => !next && setRemoving(null)}
        variant="destructive"
        title={messages.removeTitle(removing ? labelOf(removing) : "")}
        description={messages.removeHint}
        confirmLabel={t("action.delete")}
        loading={remove.isPending}
        onConfirm={() => {
          if (!removing) return;
          remove.mutate(removing.id, {
            onSuccess: () => {
              toast.success(messages.removed);
              setRemoving(null);
            },
            onError: (error) => {
              toast.error(describeError(error).title, { description: describeError(error).description });
              setRemoving(null);
            },
          });
        }}
      />
    </>
  );
}
