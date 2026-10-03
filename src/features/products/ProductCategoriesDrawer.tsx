import * as React from "react";
import { useAppT } from "@/app/i18n";
import { CategoriesDrawer, type CategoriesDrawerMessages } from "@/features/catalog/CategoriesDrawer";
import { useRemoveProductCategory, useSaveProductCategory } from "./queries";
import { UNCATEGORIZED_PRODUCT_ID, type CatalogProduct, type ProductCategory } from "./types";

export interface ProductCategoriesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: readonly ProductCategory[];
  items: readonly CatalogProduct[];
}

/** Las categorías de productos: el panel compartido del catálogo, con sus textos y sus mutaciones. */
export function ProductCategoriesDrawer({ open, onOpenChange, categories, items }: ProductCategoriesDrawerProps) {
  const t = useAppT();
  const save = useSaveProductCategory();
  const remove = useRemoveProductCategory();

  const messages = React.useMemo<CategoriesDrawerMessages>(
    () => ({
      title: t("products.category.title"),
      hint: t("products.category.hint"),
      formHint: t("products.category.formHint"),
      newLabel: t("products.category.new"),
      createTitle: t("products.category.new"),
      editTitle: t("products.category.editTitle"),
      create: t("products.category.create"),
      save: t("products.form.save"),
      back: t("products.category.back"),
      name: t("products.form.name"),
      description: t("products.form.description"),
      nameError: t("products.category.error.name"),
      uncategorizedHint: t("products.category.uncategorizedHint"),
      created: t("products.category.created"),
      saved: t("products.category.saved"),
      removed: t("products.category.removed"),
      remove: t("action.delete"),
      count: (count) => t("products.category.count", { count }),
      editAria: (name) => t("products.category.editAria", { name }),
      removeAria: (name) => t("products.category.removeAria", { name }),
      removeTitle: (name) => t("products.category.removeTitle", { name }),
      removeHint: (count) => t("products.category.removeHint", { count }),
    }),
    [t]
  );

  return (
    <CategoriesDrawer
      open={open}
      onOpenChange={onOpenChange}
      categories={categories}
      countOf={(id) => items.filter((item) => item.categoryId === id).length}
      fixedId={UNCATEGORIZED_PRODUCT_ID}
      messages={messages}
      saving={save.isPending}
      removing={remove.isPending}
      onSave={(id, input) => save.mutateAsync({ id, input: { name: input.name, description: input.description } })}
      onRemove={(id) => remove.mutateAsync(id)}
    />
  );
}
