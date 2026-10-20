import * as React from "react";
import { ChevronDown, Layers, Loader2, Scissors } from "lucide-react";
import { CatalogPhotoField } from "@/features/catalog/CatalogPhotoField";
import { ServiceGlyph } from "./servicesShared";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";
import { describeError, isApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { DrawerShell } from "@/components/overlays";
import { Field, MultiSelect, NumberField } from "@/components/forms";
import { ThemaTabs } from "@/components/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Text } from "@/components/typography";
import { useMoney } from "@/features/calendar/calendarFormat";
import { useCreateService, useUpdateService } from "./queries";
import { comboTotals, formatDuration, marginOf } from "./servicesUtils";
import { MAX_DURATION_MIN, MAX_PREP_MIN, MIN_DURATION_MIN, UNCATEGORIZED_ID, emptyServiceInput, inputFromService, serviceInputSchema, type CatalogService, type PrepPosition, type ServiceCategory, type ServiceDetail, type ServiceInput, type ServiceKind } from "./types";
import { useCurrencyInput } from "@/features/branches";

export interface ServiceFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Con servicio se edita; sin él se crea uno del tipo `kind`. */
  service?: CatalogService | null;
  kind?: ServiceKind;
  categories: readonly ServiceCategory[];
  /** El catálogo, para elegir lo que agrupa un combo. */
  items: readonly CatalogService[];
  branchId: string;
  /** La categoría con la que arranca un alta —la que se estaba mirando—. */
  defaultCategoryId?: string;
  onCreated?: (service: ServiceDetail) => void;
}

const FORM_ID = "service-form";
const DURATION_STEP = 5;

/**
 * Crear o editar un servicio —o un combo— sin salir de la lista. Lo que
 * define el servicio va arriba: nombre, categoría, precio y duración. Lo que
 * se decide una vez —costo, impuesto, reserva en línea, tiempos— queda
 * plegado. Quién lo ofrece se elige después, en su ficha.
 */
export function ServiceFormDrawer({ open, onOpenChange, service = null, kind = "service", categories, items, branchId, defaultCategoryId, onCreated }: ServiceFormDrawerProps) {
  const t = useAppT();
  const isEdit = service !== null;
  const effectiveKind = service?.kind ?? kind;
  const [submitting, setSubmitting] = React.useState(false);
  const titleKey: AppMessageKey = isEdit ? (effectiveKind === "combo" ? "services.form.editComboTitle" : "services.form.editTitle") : effectiveKind === "combo" ? "services.form.createComboTitle" : "services.form.createTitle";

  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={t(titleKey)}
      description={t(effectiveKind === "combo" ? "services.form.comboHint" : "services.form.hint")}
      actions={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form={FORM_ID} disabled={submitting} data-testid="service-form-submit">
            {submitting && <Loader2 className="animate-spin" />}
            {isEdit ? t("services.form.save") : t(effectiveKind === "combo" ? "services.form.createCombo" : "services.form.create")}
          </Button>
        </>
      }
    >
      {/* El cuerpo se monta al abrir: cada apertura arranca limpia. */}
      {open && <ServiceFormBody service={service} kind={effectiveKind} categories={categories} items={items} branchId={branchId} defaultCategoryId={defaultCategoryId} onSubmittingChange={setSubmitting} onDone={() => onOpenChange(false)} onCreated={onCreated} />}
    </DrawerShell>
  );
}

interface ServiceFormBodyProps {
  service: CatalogService | null;
  kind: ServiceKind;
  categories: readonly ServiceCategory[];
  items: readonly CatalogService[];
  branchId: string;
  defaultCategoryId?: string;
  onSubmittingChange: (submitting: boolean) => void;
  onDone: () => void;
  onCreated?: (service: ServiceDetail) => void;
}

type Errors = Partial<Record<keyof ServiceInput, string>>;

function ServiceFormBody({ service, kind, categories, items, branchId, defaultCategoryId, onSubmittingChange, onDone, onCreated }: ServiceFormBodyProps) {
  const { symbol: currencySymbol } = useCurrencyInput();
  const t = useAppT();
  const formatMoney = useMoney();
  const create = useCreateService(branchId);
  const update = useUpdateService(branchId);
  const isCombo = kind === "combo";

  const [draft, setDraft] = React.useState<ServiceInput>(() => {
    if (service) return inputFromService(service);
    const fallback = categories.find((category) => category.id !== UNCATEGORIZED_ID)?.id ?? UNCATEGORIZED_ID;
    return emptyServiceInput(kind, categories.some((category) => category.id === defaultCategoryId) ? (defaultCategoryId as string) : fallback);
  });
  const [errors, setErrors] = React.useState<Errors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  /* Al editar, lo opcional se abre si ya tiene algo fuera de lo habitual. */
  const [showMore, setShowMore] = React.useState(() => Boolean(service && (service.cost !== null || service.taxRate !== null || service.visibility === "private" || service.multiservice || service.prep.enabled)));
  /* En un combo la duración sigue a la suma de lo elegido hasta que alguien la escribe a mano. */
  const [durationTouched, setDurationTouched] = React.useState(service !== null);

  const set = <K extends keyof ServiceInput>(key: K, value: ServiceInput[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };
  const message = (value?: string) => (value?.startsWith("services.") ? t(value as AppMessageKey, { min: MIN_DURATION_MIN, max: MAX_DURATION_MIN, maxPrep: MAX_PREP_MIN }) : value);

  const single = items.filter((item) => item.kind === "service");
  const totals = comboTotals(draft.includes, single);
  const saving = isCombo && Number.isFinite(draft.price) && totals.price > 0 ? totals.price - draft.price : 0;
  const margin = Number.isFinite(draft.price) ? marginOf({ price: draft.price, cost: draft.cost }) : null;

  const pickIncludes = (includes: string[]) => {
    set("includes", includes);
    if (!durationTouched) {
      const next = comboTotals(includes, single).durationMin;
      if (next >= MIN_DURATION_MIN) setDraft((current) => ({ ...current, includes, durationMin: Math.min(MAX_DURATION_MIN, next) }));
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const parsed = serviceInputSchema.safeParse(draft);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof ServiceInput;
        next[field] ??= issue.message;
      }
      setErrors(next);
      if (next.cost || next.taxRate || next.prep) setShowMore(true);
      return;
    }
    onSubmittingChange(true);
    try {
      if (service) {
        const updated = await update.mutateAsync({ id: service.id, input: parsed.data });
        toast.success(t("services.form.saved"), { description: updated.name });
      } else {
        const created = await create.mutateAsync(parsed.data);
        toast.success(t(isCombo ? "services.form.comboCreated" : "services.form.created"), { description: created.name });
        onCreated?.(created);
      }
      onDone();
    } catch (error) {
      const fields = isApiError(error) ? error.fieldErrors : undefined;
      if (fields) {
        setErrors(Object.fromEntries(Object.entries(fields).map(([name, messages]) => [name, messages[0]])) as Errors);
        if (fields.cost || fields.taxRate || fields.prep) setShowMore(true);
      } else {
        setFormError(describeError(error).description);
      }
    } finally {
      onSubmittingChange(false);
    }
  };

  return (
    <form id={FORM_ID} onSubmit={(event) => void submit(event)} noValidate className="space-y-5" data-testid="service-form">
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <Field label={t("services.form.name")} required error={message(errors.name)}>
        <Input value={draft.name} onChange={(event) => set("name", event.target.value)} autoComplete="off" aria-invalid={!!errors.name} data-testid="service-form-name" />
      </Field>

      <CatalogPhotoField value={draft.imageUrl} onChange={(value) => set("imageUrl", value)} icon={isCombo ? <Layers /> : <Scissors />} error={message(errors.imageUrl)} testId="service-form-photo" />

      {isCombo && (
        <Field label={t("services.form.includes")} required error={message(errors.includes)} description={draft.includes.length > 0 ? t("services.form.includesSum", { price: formatMoney(totals.price), duration: formatDuration(totals.durationMin) }) : t("services.form.includesHint")}>
          <MultiSelect
            options={single.map((item) => ({ value: item.id, label: `${item.name} · ${formatMoney(item.price)}`, leading: <ServiceGlyph kind="service" size="sm" imageUrl={item.imageUrl} /> }))}
            value={draft.includes}
            onValueChange={pickIncludes}
            placeholder={t("services.form.includesPlaceholder")}
            searchPlaceholder={t("services.form.includesSearch")}
            emptyMessage={t("services.form.includesEmpty")}
          />
        </Field>
      )}

      <Field label={t("services.form.category")} required error={message(errors.categoryId)}>
        <Select value={draft.categoryId} onValueChange={(value) => set("categoryId", value)}>
          <SelectTrigger aria-invalid={!!errors.categoryId} data-testid="service-form-category">
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t(isCombo ? "services.form.comboPrice" : "services.form.price")} required error={message(errors.price)} description={saving > 0 ? t("services.form.comboSaving", { amount: formatMoney(saving) }) : saving < 0 ? t("services.form.comboMoreExpensive") : undefined}>
          <NumberField value={Number.isFinite(draft.price) ? draft.price : null} onValueChange={(value) => set("price", value ?? Number.NaN)} min={0} precision={2} prefix={currencySymbol} aria-invalid={!!errors.price} data-testid="service-form-price" />
        </Field>
        <Field label={t("catalog.branchPrice")} error={message(errors.branchPrice)} description={t("catalog.branchPriceHint")}>
          <NumberField value={draft.branchPrice} onValueChange={(value) => set("branchPrice", value)} min={0} precision={2} prefix={currencySymbol} data-testid="service-form-branch-price" />
        </Field>
        <Field label={t("services.form.duration")} required error={message(errors.durationMin)}>
          <NumberField
            value={draft.durationMin}
            onValueChange={(value) => {
              setDurationTouched(true);
              set("durationMin", value ?? Number.NaN);
            }}
            min={MIN_DURATION_MIN}
            max={MAX_DURATION_MIN}
            step={DURATION_STEP}
            suffix="min"
            aria-invalid={!!errors.durationMin}
            data-testid="service-form-duration"
          />
        </Field>
      </div>

      <Field label={t("services.form.description")} description={t("services.form.descriptionHint")}>
        <Textarea value={draft.description} onChange={(event) => set("description", event.target.value)} rows={3} />
      </Field>

      <Collapsible open={showMore} onOpenChange={setShowMore} className="rounded-xl border border-border/60">
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50" data-testid="service-form-more">
          <span className="flex flex-col gap-0.5">
            <Text as="span" variant="label">
              {t("services.form.more")}
            </Text>
            <Text as="span" variant="muted" className="text-xs">
              {t("services.form.moreHint")}
            </Text>
          </span>
          <ChevronDown className={cn("size-4 shrink-0 text-text-muted transition-transform duration-200 motion-reduce:transition-none", showMore && "rotate-180")} aria-hidden />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 border-t border-border/60 px-4 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("services.form.cost")} error={message(errors.cost)} description={margin === null ? t("services.form.costHint") : t("services.form.marginLeft", { margin: `${margin}%` })}>
              <NumberField value={draft.cost} onValueChange={(value) => set("cost", value)} min={0} precision={2} prefix={currencySymbol} />
            </Field>
            <Field label={t("services.form.tax")} error={message(errors.taxRate)} description={t("services.form.taxHint")}>
              <NumberField value={draft.taxRate} onValueChange={(value) => set("taxRate", value)} min={0} max={100} precision={2} suffix="%" />
            </Field>
          </div>

          <SwitchRow label={t("services.form.public")} hint={t("services.form.publicHint")} checked={draft.visibility === "public"} onCheckedChange={(checked) => set("visibility", checked ? "public" : "private")} testId="service-form-public" />
          <SwitchRow label={t("services.form.multiservice")} hint={t("services.form.multiserviceHint")} checked={draft.multiservice} onCheckedChange={(checked) => set("multiservice", checked)} />
          {isCombo && <SwitchRow label={t("services.form.giftCards")} hint={t("services.form.giftCardsHint")} checked={draft.giftCards} onCheckedChange={(checked) => set("giftCards", checked)} />}
          <SwitchRow label={t("services.form.prep")} hint={t("services.form.prepHint")} checked={draft.prep.enabled} onCheckedChange={(checked) => set("prep", { ...draft.prep, enabled: checked })}>
            {draft.prep.enabled && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label={t("services.form.prepMinutes")} error={message(errors.prep)}>
                  <NumberField value={draft.prep.minutes} onValueChange={(value) => set("prep", { ...draft.prep, minutes: value ?? 0 })} min={1} max={MAX_PREP_MIN} suffix="min" size="sm" />
                </Field>
                <Field label={t("services.form.prepPosition")}>
                  <ThemaTabs
                    className="mb-0"
                    fitContent
                    tabs={[
                      { id: "start", label: t("services.form.prepStart") },
                      { id: "end", label: t("services.form.prepEnd") },
                    ]}
                    activeTabId={draft.prep.position}
                    onTabChange={(id) => set("prep", { ...draft.prep, position: id as PrepPosition })}
                  />
                </Field>
              </div>
            )}
          </SwitchRow>
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
  children?: React.ReactNode;
}

function SwitchRow({ label, hint, checked, onCheckedChange, testId, children }: SwitchRowProps) {
  const id = React.useId();
  return (
    <div className="rounded-lg bg-surface-subtle p-3">
      <div className="flex items-start justify-between gap-4">
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
      {children}
    </div>
  );
}
