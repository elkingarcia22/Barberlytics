import * as React from "react";
import { useAppT } from "@/app/i18n";
import { CategoriesDrawer as CatalogCategoriesDrawer, type CategoriesDrawerMessages } from "@/features/catalog/CategoriesDrawer";
import { useRemoveCategory, useSaveCategory } from "./queries";
import { VisibilityBadge } from "./servicesShared";
import { UNCATEGORIZED_ID, type CatalogService, type ServiceCategory } from "./types";

export interface CategoriesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: readonly ServiceCategory[];
  items: readonly CatalogService[];
  /** Las casillas de categorías de quien mira; sin ellas el panel es de consulta. */
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

/** Las categorías de servicios: el panel compartido del catálogo, con sus textos y sus mutaciones. */
export function CategoriesDrawer({ open, onOpenChange, categories, items, canCreate, canEdit, canDelete }: CategoriesDrawerProps) {
  const t = useAppT();
  const save = useSaveCategory();
  const remove = useRemoveCategory();

  const messages = React.useMemo<CategoriesDrawerMessages>(
    () => ({
      title: t("services.category.title"),
      hint: t("services.category.hint"),
      formHint: t("services.category.formHint"),
      newLabel: t("services.category.new"),
      createTitle: t("services.category.createTitle"),
      editTitle: t("services.category.editTitle"),
      create: t("services.category.create"),
      save: t("services.form.save"),
      back: t("services.category.back"),
      name: t("services.form.name"),
      description: t("services.form.description"),
      nameError: t("services.category.error.name"),
      uncategorizedHint: t("services.category.uncategorizedHint"),
      created: t("services.category.created"),
      saved: t("services.category.saved"),
      removed: t("services.category.removed"),
      remove: t("action.delete"),
      publicLabel: t("services.category.public"),
      publicHint: t("services.category.publicHint"),
      count: (count) => t("services.category.count", { count }),
      editAria: (name) => t("services.category.editAria", { name }),
      removeAria: (name) => t("services.category.removeAria", { name }),
      removeTitle: (name) => t("services.category.removeTitle", { name }),
      removeHint: (count) => t("services.category.removeHint", { count }),
    }),
    [t]
  );

  return (
    <CatalogCategoriesDrawer
      open={open}
      onOpenChange={onOpenChange}
      categories={categories}
      countOf={(id) => items.filter((item) => item.categoryId === id).length}
      fixedId={UNCATEGORIZED_ID}
      withVisibility
      messages={messages}
      saving={save.isPending}
      removing={remove.isPending}
      onSave={(id, input) => save.mutateAsync({ id, input })}
      onRemove={(id) => remove.mutateAsync(id)}
      renderBadge={(category) => <VisibilityBadge visibility={category.visibility ?? "public"} />}
      canCreate={canCreate}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  );
}
