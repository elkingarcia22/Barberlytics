import * as React from "react";
import { ChevronDown, Loader2, Package } from "lucide-react";
import { CatalogPhotoField } from "@/features/catalog/CatalogPhotoField";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";
import { describeError, isApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { DrawerShell } from "@/components/overlays";
import { Field, NumberField } from "@/components/forms";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Text } from "@/components/typography";
import { useMoney } from "@/features/calendar/calendarFormat";
import { marginOf } from "@/features/services/servicesUtils";
import { profitOf } from "./productsHome";
import { useCreateProduct, useUpdateProduct } from "./queries";
import { UNCATEGORIZED_PRODUCT_ID, emptyProductInput, inputFromProduct, productInputSchema, type CatalogProduct, type ProductCategory, type ProductInput } from "./types";

export interface ProductFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Con producto se edita; sin él se crea. */
  product?: CatalogProduct | null;
  categories: readonly ProductCategory[];
  branchId: string;
  /** La categoría con la que arranca un alta —la que se estaba mirando—. */
  defaultCategoryId?: string;
  onCreated?: (product: CatalogProduct) => void;
}

const FORM_ID = "product-form";

/**
 * Crear o editar un producto sin salir de la lista. Arriba va lo que define
 * la venta: nombre, categoría y los dos precios —el de compra y el de venta
 * juntos, para ver al momento cuánto deja—. La marca, el distribuidor, el
 * impuesto y quién lo puede vender quedan plegados.
 */
export function ProductFormDrawer({ open, onOpenChange, product = null, categories, branchId, defaultCategoryId, onCreated }: ProductFormDrawerProps) {
  const t = useAppT();
  const isEdit = product !== null;
  const [submitting, setSubmitting] = React.useState(false);

  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={t(isEdit ? "products.form.editTitle" : "products.form.createTitle")}
      description={t("products.form.hint")}
      actions={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form={FORM_ID} disabled={submitting} data-testid="product-form-submit">
            {submitting && <Loader2 className="animate-spin" />}
            {t(isEdit ? "products.form.save" : "products.form.create")}
          </Button>
        </>
      }
    >
      {/* El cuerpo se monta al abrir: cada apertura arranca limpia. */}
      {open && <ProductFormBody product={product} categories={categories} branchId={branchId} defaultCategoryId={defaultCategoryId} onSubmittingChange={setSubmitting} onDone={() => onOpenChange(false)} onCreated={onCreated} />}
    </DrawerShell>
  );
}

interface ProductFormBodyProps {
  product: CatalogProduct | null;
  categories: readonly ProductCategory[];
  branchId: string;
  defaultCategoryId?: string;
  onSubmittingChange: (submitting: boolean) => void;
  onDone: () => void;
  onCreated?: (product: CatalogProduct) => void;
}

type Errors = Partial<Record<keyof ProductInput, string>>;
const OPTIONAL_FIELDS: readonly (keyof ProductInput)[] = ["taxRate", "brand", "distributor"];

function ProductFormBody({ product, categories, branchId, defaultCategoryId, onSubmittingChange, onDone, onCreated }: ProductFormBodyProps) {
  const t = useAppT();
  const formatMoney = useMoney();
  const create = useCreateProduct(branchId);
  const update = useUpdateProduct(branchId);

  const [draft, setDraft] = React.useState<ProductInput>(() => {
    if (product) return inputFromProduct(product);
    const fallback = categories.find((category) => category.id !== UNCATEGORIZED_PRODUCT_ID)?.id ?? UNCATEGORIZED_PRODUCT_ID;
    return emptyProductInput(categories.some((category) => category.id === defaultCategoryId) ? (defaultCategoryId as string) : fallback);
  });
  const [errors, setErrors] = React.useState<Errors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  /* Al editar, lo opcional se abre si ya tiene algo fuera de lo habitual. */
  const [showMore, setShowMore] = React.useState(() => Boolean(product && (product.brand || product.distributor || product.taxRate !== null || !product.sellable || product.visibility === "private")));

  const set = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };
  const message = (value?: string) => (value?.startsWith("products.") ? t(value as AppMessageKey) : value);

  const hasPrice = Number.isFinite(draft.price);
  const margin = hasPrice ? marginOf({ price: draft.price, cost: draft.cost }) : null;
  const profit = hasPrice ? profitOf({ price: draft.price, cost: draft.cost }) : null;
  const costHint = profit === null || margin === null ? t("products.form.costHint") : profit < 0 ? t("products.form.losing", { amount: formatMoney(-profit) }) : t("products.form.profit", { amount: formatMoney(profit), margin: `${margin}%` });

  const showErrors = (next: Errors) => {
    setErrors(next);
    if (OPTIONAL_FIELDS.some((field) => next[field])) setShowMore(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const parsed = productInputSchema.safeParse(draft);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof ProductInput;
        next[field] ??= issue.message;
      }
      showErrors(next);
      return;
    }
    onSubmittingChange(true);
    try {
      if (product) {
        const updated = await update.mutateAsync({ id: product.id, input: parsed.data });
        toast.success(t("products.form.saved"), { description: updated.name });
      } else {
        const created = await create.mutateAsync(parsed.data);
        toast.success(t("products.form.created"), { description: created.name });
        onCreated?.(created);
      }
      onDone();
    } catch (error) {
      const fields = isApiError(error) ? error.fieldErrors : undefined;
      if (fields) showErrors(Object.fromEntries(Object.entries(fields).map(([name, messages]) => [name, messages[0]])) as Errors);
      else setFormError(describeError(error).description);
    } finally {
      onSubmittingChange(false);
    }
  };

  return (
    <form id={FORM_ID} onSubmit={(event) => void submit(event)} noValidate className="space-y-5" data-testid="product-form">
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <Field label={t("products.form.name")} required error={message(errors.name)}>
        <Input value={draft.name} onChange={(event) => set("name", event.target.value)} autoComplete="off" aria-invalid={!!errors.name} data-testid="product-form-name" />
      </Field>

      <CatalogPhotoField value={draft.imageUrl} onChange={(value) => set("imageUrl", value)} icon={<Package />} error={message(errors.imageUrl)} testId="product-form-photo" />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("products.form.category")} required error={message(errors.categoryId)}>
          <Select value={draft.categoryId} onValueChange={(value) => set("categoryId", value)}>
            <SelectTrigger aria-invalid={!!errors.categoryId} data-testid="product-form-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("products.form.sku")} error={message(errors.sku)} description={t("products.form.skuHint")}>
          <Input value={draft.sku} onChange={(event) => set("sku", event.target.value)} autoComplete="off" aria-invalid={!!errors.sku} className="font-mono" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("products.form.price")} required error={message(errors.price)}>
          <NumberField value={hasPrice ? draft.price : null} onValueChange={(value) => set("price", value ?? Number.NaN)} min={0} precision={2} prefix="$" aria-invalid={!!errors.price} data-testid="product-form-price" />
        </Field>
        <Field label={t("catalog.branchPrice")} error={message(errors.branchPrice)} description={t("catalog.branchPriceHint")}>
          <NumberField value={draft.branchPrice} onValueChange={(value) => set("branchPrice", value)} min={0} precision={2} prefix="$" data-testid="product-form-branch-price" />
        </Field>
        <Field label={t("products.form.cost")} error={message(errors.cost)} description={costHint}>
          <NumberField value={draft.cost} onValueChange={(value) => set("cost", value)} min={0} precision={2} prefix="$" data-testid="product-form-cost" />
        </Field>
      </div>

      <Field label={t("products.form.description")} description={t("products.form.descriptionHint")}>
        <Textarea value={draft.description} onChange={(event) => set("description", event.target.value)} rows={3} />
      </Field>

      <Collapsible open={showMore} onOpenChange={setShowMore} className="rounded-xl border border-border/60">
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50" data-testid="product-form-more">
          <span className="flex flex-col gap-0.5">
            <Text as="span" variant="label">
              {t("products.form.more")}
            </Text>
            <Text as="span" variant="muted" className="text-xs">
              {t("products.form.moreHint")}
            </Text>
          </span>
          <ChevronDown className={cn("size-4 shrink-0 text-text-muted transition-transform duration-200 motion-reduce:transition-none", showMore && "rotate-180")} aria-hidden />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 border-t border-border/60 px-4 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("products.form.brand")}>
              <Input value={draft.brand} onChange={(event) => set("brand", event.target.value)} autoComplete="off" />
            </Field>
            <Field label={t("products.form.distributor")}>
              <Input value={draft.distributor} onChange={(event) => set("distributor", event.target.value)} autoComplete="off" />
            </Field>
          </div>
          <Field label={t("products.form.tax")} error={message(errors.taxRate)} description={t("products.form.taxHint")}>
            <NumberField value={draft.taxRate} onValueChange={(value) => set("taxRate", value)} min={0} max={100} precision={2} suffix="%" />
          </Field>
          <SwitchRow label={t("products.form.sellable")} hint={t("products.form.sellableHint")} checked={draft.sellable} onCheckedChange={(checked) => set("sellable", checked)} testId="product-form-sellable" />
          <SwitchRow label={t("products.form.public")} hint={t("products.form.publicHint")} checked={draft.visibility === "public"} onCheckedChange={(checked) => set("visibility", checked ? "public" : "private")} />
        </CollapsibleContent>
      </Collapsible>
    </form>
  );
}

interface SwitchRowProps {
  label: string;
  hint: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  testId?: string;
}

function SwitchRow({ label, hint, checked, onCheckedChange, testId }: SwitchRowProps) {
  const id = React.useId();
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg bg-surface-subtle p-3">
      <label htmlFor={id} className="flex flex-col gap-0.5">
        <Text as="span" variant="label">
          {label}
        </Text>
        <Text as="span" variant="muted" className="text-xs">
          {hint}
        </Text>
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} data-testid={testId} />
    </div>
  );
}
