import * as React from "react";
import { Armchair, ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";
import { describeError, isApiError } from "@/lib/api";
import { QueryBoundary } from "@/lib/query";
import { ListItem } from "@/components/data-display/ListItem";
import { EmptyState } from "@/components/feedback";
import { Field, MultiSelect, NumberField } from "@/components/forms";
import { ConfirmDialog, DrawerShell } from "@/components/overlays";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { IconTile } from "@/components/utility/IconTile";
import { ServiceGlyph } from "./servicesShared";
import { useRemoveResource, useResourcesQuery, useSaveResource } from "./queries";
import { MAX_RESOURCE_UNITS, resourceInputSchema, type CatalogService, type ResourceInput, type ServiceResource } from "./types";

/**
 * Los recursos especiales del local —un sillón de lavado, el vaporizador de
 * toallas, una silla de color—: lo que no es un barbero pero limita la agenda.
 * Cada uno dice cuántos hay y qué servicios lo ocupan; la agenda filtra por
 * ellos y avisa cuando a la misma hora se piden más de los que hay.
 */

export interface ResourcesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: readonly CatalogService[];
  /** Crear, editar y borrar; sin ello el panel es de consulta. */
  canEdit?: boolean;
}

const FORM_ID = "resource-form";
const EMPTY: ResourceInput = { name: "", description: "", units: 1, serviceIds: [] };
type Errors = Partial<Record<keyof ResourceInput, string>>;

export function ResourcesDrawer({ open, onOpenChange, items, canEdit = true }: ResourcesDrawerProps) {
  const t = useAppT();
  const query = useResourcesQuery(open);
  const save = useSaveResource();
  const remove = useRemoveResource();
  /* `null` = la lista; `"new"` = alta; un recurso = edición. */
  const [editing, setEditing] = React.useState<ServiceResource | "new" | null>(null);
  const [draft, setDraft] = React.useState<ResourceInput>(EMPTY);
  const [errors, setErrors] = React.useState<Errors>({});
  const [removing, setRemoving] = React.useState<ServiceResource | null>(null);

  const nameOf = (id: string) => items.find((item) => item.id === id)?.name;
  const startEdit = (resource: ServiceResource | "new") => {
    setEditing(resource);
    setDraft(resource === "new" ? EMPTY : { name: resource.name, description: resource.description, units: resource.units, serviceIds: [...resource.serviceIds] });
    setErrors({});
  };
  const backToList = () => setEditing(null);
  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) backToList();
  };
  const set = <K extends keyof ResourceInput>(key: K, value: ResourceInput[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = resourceInputSchema.safeParse(draft);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) next[issue.path[0] as keyof ResourceInput] ??= t(issue.message as AppMessageKey);
      setErrors(next);
      return;
    }
    const isNew = editing === "new";
    try {
      const saved = await save.mutateAsync({ id: isNew || editing === null ? null : editing.id, input: parsed.data });
      toast.success(t(isNew ? "services.resource.created" : "services.resource.saved"), { description: saved.name });
      backToList();
    } catch (error) {
      const fields = isApiError(error) ? error.fieldErrors : undefined;
      if (fields) setErrors({ name: fields.name?.[0], units: fields.units?.[0], serviceIds: fields.serviceIds?.[0] });
      else toast.error(describeError(error).title, { description: describeError(error).description });
    }
  };

  const isForm = editing !== null;
  const single = items.filter((item) => item.kind === "service" || item.kind === "combo");

  return (
    <>
      <DrawerShell
        open={open}
        onOpenChange={close}
        size="md"
        title={isForm ? t(editing === "new" ? "services.resource.createTitle" : "services.resource.editTitle") : t("services.resource.title")}
        description={isForm ? t("services.resource.formHint") : t("services.resource.hint")}
        actions={
          isForm ? (
            <>
              <Button type="button" variant="outline" onClick={backToList} disabled={save.isPending}>
                <ArrowLeft /> {t("services.category.back")}
              </Button>
              <Button type="submit" form={FORM_ID} disabled={save.isPending} data-testid="resource-form-submit">
                {t(editing === "new" ? "services.resource.create" : "services.form.save")}
              </Button>
            </>
          ) : canEdit ? (
            <Button onClick={() => startEdit("new")} data-testid="resource-new">
              <Plus /> {t("services.resource.new")}
            </Button>
          ) : undefined
        }
      >
        {isForm ? (
          <form id={FORM_ID} onSubmit={(event) => void submit(event)} noValidate className="space-y-5">
            <Field label={t("services.form.name")} required error={errors.name}>
              <Input value={draft.name} onChange={(event) => set("name", event.target.value)} placeholder={t("services.resource.namePlaceholder")} autoComplete="off" aria-invalid={!!errors.name} data-testid="resource-form-name" />
            </Field>
            <Field label={t("services.form.description")}>
              <Textarea value={draft.description} onChange={(event) => set("description", event.target.value)} rows={2} />
            </Field>
            <Field label={t("services.resource.units")} required error={errors.units} description={t("services.resource.unitsHint")}>
              <NumberField value={draft.units} onValueChange={(value) => set("units", value ?? Number.NaN)} min={1} max={MAX_RESOURCE_UNITS} step={1} aria-invalid={!!errors.units} data-testid="resource-form-units" />
            </Field>
            <Field label={t("services.resource.services")} required error={errors.serviceIds} description={t("services.resource.servicesHint")}>
              <MultiSelect
                options={single.map((item) => ({ value: item.id, label: item.name, leading: <ServiceGlyph kind={item.kind} size="sm" imageUrl={item.imageUrl} /> }))}
                value={draft.serviceIds}
                onValueChange={(value) => set("serviceIds", value)}
                placeholder={t("services.resource.servicesPlaceholder")}
                searchPlaceholder={t("services.form.includesSearch")}
                emptyMessage={t("services.form.includesEmpty")}
              />
            </Field>
          </form>
        ) : (
          <QueryBoundary
            query={query}
            loading={<Skeleton className="h-40 w-full" />}
            empty={{ when: (data) => data.items.length === 0, render: <EmptyState icon="settings" title={t("services.resource.empty")} description={t("services.resource.emptyHint")} /> }}
          >
            {(data) => (
              <div className="space-y-2" data-testid="resources-list">
                {data.items.map((resource) => {
                  const services = resource.serviceIds.map(nameOf).filter(Boolean).join(", ");
                  return (
                    <ListItem
                      key={resource.id}
                      data-testid={`resource-${resource.id}`}
                      leading={<IconTile size="sm" shape="circle" tone="neutral" icon={<Armchair />} />}
                      title={resource.name}
                      description={services || t("services.resource.noServices")}
                      meta={<span className="whitespace-nowrap tabular-nums">{t("services.resource.unitsCount", { count: resource.units })}</span>}
                      actions={
                        canEdit ? (
                          <>
                            <Button variant="ghost" size="icon-sm" aria-label={t("services.resource.editAria", { name: resource.name })} onClick={() => startEdit(resource)}>
                              <Pencil />
                            </Button>
                            <Button variant="ghost" size="icon-sm" aria-label={t("services.resource.removeAria", { name: resource.name })} onClick={() => setRemoving(resource)}>
                              <Trash2 />
                            </Button>
                          </>
                        ) : undefined
                      }
                    />
                  );
                })}
              </div>
            )}
          </QueryBoundary>
        )}
      </DrawerShell>

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(next) => !next && setRemoving(null)}
        variant="destructive"
        title={t("services.resource.removeTitle", { name: removing?.name ?? "" })}
        description={t("services.resource.removeHint")}
        confirmLabel={t("action.delete")}
        loading={remove.isPending}
        onConfirm={() => {
          if (!removing) return;
          remove
            .mutateAsync(removing.id)
            .then(() => {
              toast.success(t("services.resource.removed"), { description: removing.name });
              setRemoving(null);
            })
            .catch((error: unknown) => toast.error(describeError(error).title, { description: describeError(error).description }));
        }}
      />
    </>
  );
}
