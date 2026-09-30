import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { PhoneInput } from "@/components/forms";
import { Heading, Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ThemaIcon } from "@/icons";
import { describeError } from "@/lib/api";
import { authApi } from "./api";
import { AuthField, BackButton, FormErrorAlert } from "./authFormParts";
import { applyServerFieldErrors } from "./authErrors";
import { describePhone } from "./phoneLabel";
import { supportTicketSchema, type SupportTicketRequest, type TicketReason } from "./types";

/** De dónde viene la persona: prellena lo que ya se sabe. */
export interface TicketContext {
  reason: TicketReason;
  phone?: string;
  email?: string;
}

export interface SupportTicketPanelProps {
  context: TicketContext;
  onBack: () => void;
}

const REASON_LABEL = {
  recovery: "auth.ticket.reason.recovery",
  lockout: "auth.ticket.reason.lockout",
  other: "auth.ticket.description",
} as const;

/**
 * Contáctanos: abre un ticket a soporte sin sesión. Se llega desde «no me
 * llegó el correo» y desde el bloqueo por intentos fallidos.
 */
export function SupportTicketPanel({ context, onBack }: SupportTicketPanelProps) {
  const t = useAppT();
  const [created, setCreated] = React.useState<{ id: string; email: string } | null>(null);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const initialMessage =
    context.reason === "lockout" && context.phone
      ? t("auth.ticket.messageLockout", { phone: describePhone(context.phone) })
      : context.reason === "recovery" && context.email
        ? t("auth.ticket.messageRecovery", { email: context.email })
        : "";

  const form = useForm<SupportTicketRequest>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: {
      name: "",
      company: "",
      email: context.email ?? "",
      phone: context.phone ?? "",
      message: initialMessage,
      reason: context.reason,
    },
  });
  const { errors, isSubmitting } = form.formState;

  const submit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      const ticket = await authApi.createTicket(values);
      setCreated({ id: ticket.id, email: values.email });
    } catch (error) {
      if (!applyServerFieldErrors(error, form.setError)) setServerError(describeError(error).description);
    }
  });

  if (created) {
    return (
      <>
        <ThemaIcon name="ticket" size="lg" tone="positive" className="mb-4" />
        <Heading level={3} id="login-heading">
          {t("auth.ticket.doneTitle", { id: created.id })}
        </Heading>
        <Text tone="secondary" className="mt-1.5" role="status">
          {t("auth.ticket.done", { email: created.email })}
        </Text>
        <Button type="button" size="lg" className="mt-7 w-full" onClick={onBack}>
          {t("auth.recovery.back")}
        </Button>
      </>
    );
  }

  return (
    <>
      <BackButton label={t("auth.recovery.back")} onClick={onBack} disabled={isSubmitting} />
      <Heading level={3} id="login-heading">
        {t("auth.ticket.title")}
      </Heading>
      <Text tone="secondary" className="mt-1.5">
        {t(REASON_LABEL[context.reason])}
      </Text>

      <form onSubmit={submit} noValidate className="mt-7 space-y-4" data-testid="ticket-form">
        {serverError && <FormErrorAlert title={t("auth.ticket.errorTitle")} description={serverError} />}

        <AuthField id="ticket-name" label={t("auth.ticket.name")} error={errors.name?.message}>
          {(control) => <Input {...control} autoComplete="name" autoFocus disabled={isSubmitting} {...form.register("name")} />}
        </AuthField>
        <AuthField id="ticket-company" label={t("auth.ticket.company")} error={errors.company?.message}>
          {(control) => <Input {...control} autoComplete="organization" disabled={isSubmitting} {...form.register("company")} />}
        </AuthField>
        <AuthField id="ticket-email" label={t("auth.ticket.email")} error={errors.email?.message}>
          {(control) => <Input {...control} type="email" autoComplete="email" disabled={isSubmitting} {...form.register("email")} />}
        </AuthField>
        <AuthField id="ticket-phone" label={t("auth.ticket.phone")} error={errors.phone?.message}>
          {(control) => (
            <Controller
              control={form.control}
              name="phone"
              render={({ field }) => (
                <PhoneInput {...control} name={field.name} value={field.value} onValueChange={field.onChange} onBlur={field.onBlur} disabled={isSubmitting} />
              )}
            />
          )}
        </AuthField>
        <AuthField id="ticket-message" label={t("auth.ticket.message")} error={errors.message?.message}>
          {(control) => <Textarea {...control} rows={4} maxLength={1000} disabled={isSubmitting} {...form.register("message")} />}
        </AuthField>

        <Button type="submit" size="lg" className="btn-sweep mt-2 w-full" disabled={isSubmitting} data-testid="ticket-submit">
          {isSubmitting ? <Loader2 className="animate-spin" /> : <ThemaIcon name="ticket" size="sm" tone="inverse" />}
          {t("auth.ticket.submit")}
        </Button>
      </form>
    </>
  );
}
