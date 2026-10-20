import * as React from "react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { describeError } from "@/lib/api";
import { Field } from "@/components/forms";
import { ModalShell } from "@/components/overlays";
import { ThemaTabs } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBulkTags, useTagCatalog } from "./loyalty";

/** Poner o quitar una etiqueta a los clientes marcados, de una vez. */
export function CustomerTagDialog({ ids, onClose }: { ids: readonly string[]; onClose: () => void }) {
  const t = useAppT();
  const bulk = useBulkTags();
  const catalog = useTagCatalog();
  const [mode, setMode] = React.useState<"add" | "remove">("add");
  const [tag, setTag] = React.useState("");
  const listId = React.useId();
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = tag.trim().toLowerCase();
    if (!value) return;
    bulk.mutate(mode === "add" ? { ids, add: [value] } : { ids, remove: [value] }, {
      onSuccess: (result) => {
        toast.success(t(mode === "add" ? "customers.tags.bulkAdded" : "customers.tags.bulkRemoved", { tag: value, count: result.updated }));
        onClose();
      },
      onError: (error) => toast.error(describeError(error).description),
    });
  };
  return (
    <ModalShell
      open
      onOpenChange={(open) => !open && onClose()}
      title={t("customers.tags.bulkTitle", { count: ids.length })}
      description={t("customers.tags.bulkHint")}
      actions={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="customer-tag-form" disabled={!tag.trim() || bulk.isPending} data-testid="customer-tag-bulk-save">
            {t(mode === "add" ? "customers.tags.bulkAdd" : "customers.tags.bulkRemove")}
          </Button>
        </>
      }
    >
      <form id="customer-tag-form" onSubmit={submit} className="space-y-4" data-testid="customer-tag-bulk">
        <ThemaTabs
          className="mb-0"
          fitContent
          tabs={[
            { id: "add", label: t("customers.tags.bulkAdd") },
            { id: "remove", label: t("customers.tags.bulkRemove") },
          ]}
          activeTabId={mode}
          onTabChange={(id) => setMode(id as "add" | "remove")}
        />
        <Field label={t("customers.tags.title")}>
          <Input value={tag} onChange={(event) => setTag(event.target.value)} list={listId} placeholder={t("customers.tags.placeholder")} maxLength={24} autoFocus data-testid="customer-tag-bulk-input" />
        </Field>
        <datalist id={listId}>
          {(catalog.data?.items ?? []).map((item) => (
            <option key={item.name} value={item.name} />
          ))}
        </datalist>
      </form>
    </ModalShell>
  );
}
