import * as React from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";
import { describeError, isApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { DrawerShell } from "@/components/overlays";
import { Field, PhoneInput } from "@/components/forms";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/typography";
import { useCreateCustomer, useUpdateCustomer } from "./queries";
import { EMPTY_CUSTOMER_INPUT, customerInputSchema, inputFromDetail, type CustomerDetail, type CustomerInput } from "./types";

export interface CustomerFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Con cliente se edita; sin él se crea. */
  customer?: CustomerDetail | null;
  /** La sucursal en la que se da de alta. */
  branchId: string;
  onCreated?: (customer: CustomerDetail) => void;
}

const FORM_ID = "customer-form";

/**
 * Crear o editar un cliente sin salir de donde se está. Arriba va lo que
 * hace falta para agendarle —nombre, celular y correo—; la dirección y el
 * resto, que casi nunca se piden en el mostrador, quedan plegados.
 */
export function CustomerFormDrawer({ open, onOpenChange, customer = null, branchId, onCreated }: CustomerFormDrawerProps) {
  const t = useAppT();
  const isEdit = customer !== null;
  const [submitting, setSubmitting] = React.useState(false);

  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      title={isEdit ? t("customers.form.editTitle") : t("customers.form.createTitle")}
      description={isEdit ? t("customers.form.editHint") : t("customers.form.createHint")}
      actions={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form={FORM_ID} disabled={submitting} data-testid="customer-form-submit">
            {submitting && <Loader2 className="animate-spin" />}
            {isEdit ? t("customers.form.save") : t("customers.form.create")}
          </Button>
        </>
      }
    >
      {/* El cuerpo se monta al abrir: cada apertura arranca limpia. */}
      {open && <CustomerFormBody customer={customer} branchId={branchId} onSubmittingChange={setSubmitting} onDone={() => onOpenChange(false)} onCreated={onCreated} />}
    </DrawerShell>
  );
}

interface CustomerFormBodyProps {
  customer: CustomerDetail | null;
  branchId: string;
  onSubmittingChange: (submitting: boolean) => void;
  onDone: () => void;
  onCreated?: (customer: CustomerDetail) => void;
}

function CustomerFormBody({ customer, branchId, onSubmittingChange, onDone, onCreated }: CustomerFormBodyProps) {
  const t = useAppT();
  const create = useCreateCustomer();
  const update = useUpdateCustomer();
  const [formError, setFormError] = React.useState<string | null>(null);
  const defaults = React.useMemo(() => (customer ? inputFromDetail(customer) : EMPTY_CUSTOMER_INPUT), [customer]);
  /* Al editar, lo opcional se abre si ya tiene algo escrito. */
  const [showMore, setShowMore] = React.useState(() => Boolean(defaults.address || defaults.city || defaults.birthDate || defaults.onlineOnly));

  const form = useForm<CustomerInput>({ resolver: zodResolver(customerInputSchema), defaultValues: defaults });
  const { errors } = form.formState;
  const phone = useWatch({ control: form.control, name: "phone" });
  /* El esquema guarda claves; un error del servidor ya viene escrito. */
  const message = (value?: string) => (value?.startsWith("customers.") ? t(value as AppMessageKey) : value);

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    onSubmittingChange(true);
    try {
      if (customer) {
        const updated = await update.mutateAsync({ id: customer.id, input: values });
        toast.success(t("customers.form.saved"), { description: updated.name });
      } else {
        const created = await create.mutateAsync({ input: values, branchId });
        toast.success(t("customers.form.created"), { description: created.name });
        onCreated?.(created);
      }
      onDone();
    } catch (error) {
      const fields = isApiError(error) ? error.fieldErrors : undefined;
      if (fields) {
        for (const [name, messages] of Object.entries(fields)) form.setError(name as keyof CustomerInput, { type: "server", message: messages[0] });
        if (fields.birthDate) setShowMore(true);
      } else {
        setFormError(describeError(error).description);
      }
    } finally {
      onSubmittingChange(false);
    }
  });

  return (
    <form id={FORM_ID} onSubmit={onSubmit} noValidate className="space-y-5" data-testid="customer-form">
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("customers.form.firstName")} required error={message(errors.firstName?.message)}>
          <Input autoComplete="off" aria-invalid={!!errors.firstName} data-testid="customer-form-firstName" {...form.register("firstName")} />
        </Field>
        <Field label={t("customers.form.lastName")} required error={message(errors.lastName?.message)}>
          <Input autoComplete="off" aria-invalid={!!errors.lastName} data-testid="customer-form-lastName" {...form.register("lastName")} />
        </Field>
      </div>

      <Field label={t("customers.form.phone")} required error={message(errors.phone?.message)} description={t("customers.form.smsConsent")}>
        <PhoneInput value={phone} onValueChange={(value) => form.setValue("phone", value, { shouldDirty: true, shouldValidate: form.formState.isSubmitted })} aria-invalid={!!errors.phone} data-testid="customer-form-phone" />
      </Field>

      <Field label={t("customers.form.email")} required error={message(errors.email?.message)}>
        <Input type="email" autoComplete="off" aria-invalid={!!errors.email} data-testid="customer-form-email" {...form.register("email")} />
      </Field>

      <Collapsible open={showMore} onOpenChange={setShowMore} className="rounded-xl border border-border/60">
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50" data-testid="customer-form-more">
          <span className="flex flex-col gap-0.5">
            <Text as="span" variant="label">
              {t("customers.form.more")}
            </Text>
            <Text as="span" variant="muted" className="text-xs">
              {t("customers.form.moreHint")}
            </Text>
          </span>
          <ChevronDown className={cn("size-4 shrink-0 text-text-muted transition-transform duration-200 motion-reduce:transition-none", showMore && "rotate-180")} aria-hidden />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 border-t border-border/60 px-4 py-4">
          <Field label={t("customers.form.birthDate")} error={message(errors.birthDate?.message)}>
            <Input type="date" aria-invalid={!!errors.birthDate} {...form.register("birthDate")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("customers.form.country")}>
              <Input autoComplete="off" {...form.register("country")} />
            </Field>
            <Field label={t("customers.form.state")}>
              <Input autoComplete="off" {...form.register("state")} />
            </Field>
            <Field label={t("customers.form.city")}>
              <Input autoComplete="off" {...form.register("city")} />
            </Field>
            <Field label={t("customers.form.zipcode")}>
              <Input autoComplete="off" inputMode="numeric" {...form.register("zipcode")} />
            </Field>
          </div>
          <Field label={t("customers.form.address")}>
            <Input autoComplete="off" {...form.register("address")} />
          </Field>
          <Controller
            control={form.control}
            name="onlineOnly"
            render={({ field }) => (
              <label className="flex items-start justify-between gap-4 rounded-lg bg-surface-subtle p-3">
                <span className="flex flex-col gap-0.5">
                  <Text as="span" variant="label">
                    {t("customers.form.onlineOnly")}
                  </Text>
                  <Text as="span" variant="muted" className="text-xs">
                    {t("customers.form.onlineOnlyHint")}
                  </Text>
                </span>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </label>
            )}
          />
        </CollapsibleContent>
      </Collapsible>
    </form>
  );
}
