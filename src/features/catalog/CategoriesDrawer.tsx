import * as React from "react";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { describeError, isApiError } from "@/lib/api";
import { ListItem } from "@/components/data-display/ListItem";
import { Field } from "@/components/forms";
import { ConfirmDialog, DrawerShell } from "@/components/overlays";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Text } from "@/components/typography";

/**
 * Las categorías de un catálogo —servicios, productos— en un solo panel: la
 * lista con cuántos registros tiene cada una, y el alta o la edición sin
 * salir de él. Es genérico: quien lo usa trae sus textos y sus mutaciones.
 * Borrar una categoría no borra lo que contiene: pasa a la categoría fija.
 */

export type CategoryVisibility = "public" | "private";

export interface CatalogCategory {
  id: string;
  name: string;
  description: string;
  visibility?: CategoryVisibility;
}

export interface CategoryDraft {
  name: string;
  description: string;
  visibility: CategoryVisibility;
}

export interface CategoriesDrawerMessages {
  title: string;
  hint: string;
  formHint: string;
  newLabel: string;
  createTitle: string;
  editTitle: string;
  create: string;
  save: string;
  back: string;
  name: string;
  description: string;
  nameError: string;
  uncategorizedHint: string;
  created: string;
  saved: string;
  removed: string;
  remove: string;
  /** Solo con `withVisibility`. */
  publicLabel?: string;
  publicHint?: string;
  count: (count: number) => string;
  editAria: (name: string) => string;
  removeAria: (name: string) => string;
  removeTitle: (name: string) => string;
  removeHint: (count: number) => string;
}

export interface CategoriesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: readonly CatalogCategory[];
  countOf: (categoryId: string) => number;
  /** La categoría a la que cae lo que se queda sin la suya; ni se edita ni se borra. */
  fixedId: string;
  /** Si la categoría puede ocultarse de la reserva en línea. */
  withVisibility?: boolean;
  messages: CategoriesDrawerMessages;
  saving: boolean;
  removing: boolean;
  /** Resuelve con la categoría guardada; si rechaza con errores de campo, se pintan sobre el nombre. */
  onSave: (id: string | null, draft: CategoryDraft) => Promise<{ name: string }>;
  onRemove: (id: string) => Promise<unknown>;
  /** Una insignia junto a cada categoría —si sale en línea, por ejemplo—. */
  renderBadge?: (category: CatalogCategory) => React.ReactNode;
}

const FORM_ID = "category-form";
const EMPTY: CategoryDraft = { name: "", description: "", visibility: "public" };
const MIN_NAME_LENGTH = 2;

export function CategoriesDrawer({ open, onOpenChange, categories, countOf, fixedId, withVisibility = false, messages, saving, removing: removingBusy, onSave, onRemove, renderBadge }: CategoriesDrawerProps) {
  /* `null` = la lista; `"new"` = alta; una categoría = edición. */
  const [editing, setEditing] = React.useState<CatalogCategory | "new" | null>(null);
  const [draft, setDraft] = React.useState<CategoryDraft>(EMPTY);
  const [nameError, setNameError] = React.useState<string | undefined>();
  const [removing, setRemoving] = React.useState<CatalogCategory | null>(null);

  const startEdit = (category: CatalogCategory | "new") => {
    setEditing(category);
    setDraft(category === "new" ? EMPTY : { name: category.name, description: category.description, visibility: category.visibility ?? "public" });
    setNameError(undefined);
  };
  const backToList = () => setEditing(null);
  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) backToList();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = draft.name.trim();
    if (name.length < MIN_NAME_LENGTH) {
      setNameError(messages.nameError);
      return;
    }
    const isNew = editing === "new";
    try {
      const saved = await onSave(isNew || editing === null ? null : editing.id, { ...draft, name, description: draft.description.trim() });
      toast.success(isNew ? messages.created : messages.saved, { description: saved.name });
      backToList();
    } catch (error) {
      const fields = isApiError(error) ? error.fieldErrors : undefined;
      if (fields?.name) setNameError(fields.name[0]);
      else toast.error(describeError(error).title, { description: describeError(error).description });
    }
  };

  const isForm = editing !== null;

  return (
    <>
      <DrawerShell
        open={open}
        onOpenChange={close}
        size="md"
        title={isForm ? (editing === "new" ? messages.createTitle : messages.editTitle) : messages.title}
        description={isForm ? messages.formHint : messages.hint}
        actions={
          isForm ? (
            <>
              <Button type="button" variant="outline" onClick={backToList} disabled={saving}>
                <ArrowLeft /> {messages.back}
              </Button>
              <Button type="submit" form={FORM_ID} disabled={saving} data-testid="category-form-submit">
                {editing === "new" ? messages.create : messages.save}
              </Button>
            </>
          ) : (
            <Button onClick={() => startEdit("new")} data-testid="category-new">
              <Plus /> {messages.newLabel}
            </Button>
          )
        }
      >
        {isForm ? (
          <form id={FORM_ID} onSubmit={(event) => void submit(event)} noValidate className="space-y-5">
            <Field label={messages.name} required error={nameError}>
              <Input
                value={draft.name}
                onChange={(event) => {
                  setDraft({ ...draft, name: event.target.value });
                  setNameError(undefined);
                }}
                autoComplete="off"
                aria-invalid={!!nameError}
                data-testid="category-form-name"
              />
            </Field>
            <Field label={messages.description}>
              <Textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} rows={3} />
            </Field>
            {withVisibility && (
              <label className="flex items-start justify-between gap-4 rounded-lg bg-surface-subtle p-3">
                <span className="flex flex-col gap-0.5">
                  <Text as="span" variant="label">
                    {messages.publicLabel}
                  </Text>
                  <Text as="span" variant="muted" className="text-xs">
                    {messages.publicHint}
                  </Text>
                </span>
                <Switch checked={draft.visibility === "public"} onCheckedChange={(checked) => setDraft({ ...draft, visibility: checked ? "public" : "private" })} />
              </label>
            )}
          </form>
        ) : (
          <div className="space-y-2" data-testid="categories-list">
            {categories.map((category) => {
              const fixed = category.id === fixedId;
              return (
                <ListItem
                  key={category.id}
                  title={category.name}
                  description={fixed ? messages.uncategorizedHint : category.description || undefined}
                  meta={<span className="whitespace-nowrap tabular-nums">{messages.count(countOf(category.id))}</span>}
                  actions={
                    fixed ? null : (
                      <>
                        {renderBadge?.(category)}
                        <Button variant="ghost" size="icon-sm" aria-label={messages.editAria(category.name)} onClick={() => startEdit(category)}>
                          <Pencil />
                        </Button>
                        <Button variant="ghost" size="icon-sm" aria-label={messages.removeAria(category.name)} onClick={() => setRemoving(category)}>
                          <Trash2 />
                        </Button>
                      </>
                    )
                  }
                />
              );
            })}
          </div>
        )}
      </DrawerShell>

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(next) => !next && setRemoving(null)}
        variant="destructive"
        title={messages.removeTitle(removing?.name ?? "")}
        description={messages.removeHint(removing ? countOf(removing.id) : 0)}
        confirmLabel={messages.remove}
        loading={removingBusy}
        onConfirm={() => {
          if (!removing) return;
          onRemove(removing.id)
            .then(() => {
              toast.success(messages.removed, { description: removing.name });
              setRemoving(null);
            })
            .catch((error: unknown) => toast.error(describeError(error).title, { description: describeError(error).description }));
        }}
      />
    </>
  );
}
