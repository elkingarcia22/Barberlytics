import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { Heading, Text } from "@/components/typography";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ThemaIcon } from "@/icons";
import { describeError } from "@/lib/api";
import { authApi } from "./api";
import { recoveryRequestSchema, type RecoveryRequest } from "./types";

export interface RecoveryPanelProps {
  onBack: () => void;
  /** Si el correo no llega, se abre un ticket con ese correo ya puesto. */
  onCreateTicket: (email: string) => void;
}

/**
 * Olvidé mi número: se escribe el correo registrado y el celular llega
 * allí. Vive dentro del mismo panel que el login y vuelve a él al terminar.
 */
export function RecoveryPanel({ onBack, onCreateTicket }: RecoveryPanelProps) {
  const t = useAppT();
  const [sentTo, setSentTo] = React.useState<string | null>(null);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const form = useForm<RecoveryRequest>({ resolver: zodResolver(recoveryRequestSchema), defaultValues: { email: "" } });
  const { errors, isSubmitting } = form.formState;

  const [isResending, setIsResending] = React.useState(false);
  const [wasResent, setWasResent] = React.useState(false);

  const send = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      await authApi.recovery.request(values);
      setSentTo(values.email);
      setWasResent(false);
    } catch (error) {
      setServerError(describeError(error).description);
    }
  });

  const resend = async (email: string) => {
    setServerError(null);
    setWasResent(false);
    setIsResending(true);
    try {
      await authApi.recovery.request({ email });
      setWasResent(true);
    } catch (error) {
      setServerError(describeError(error).description);
    } finally {
      setIsResending(false);
    }
  };

  /** Vuelve al formulario con el correo escrito para corregirlo. */
  const changeEmail = () => {
    setServerError(null);
    setSentTo(null);
  };

  if (sentTo) {
    return (
      <>
        <ThemaIcon name="success" size="lg" tone="positive" className="mb-4" />
        <Heading level={3} id="login-heading">
          {t("auth.recovery.doneTitle")}
        </Heading>
        <Text tone="secondary" className="mt-1.5">
          {t("auth.recovery.done")}
        </Text>

        <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1">
          <Text as="span" size="sm" tone="secondary">
            {t("auth.recovery.sentTo")}
          </Text>
          <Text as="span" size="sm" weight="semibold" className="break-all" data-testid="recovery-sent-to">
            {sentTo}
          </Text>
          <Button type="button" variant="link" size="sm" className="h-auto px-0" disabled={isResending} onClick={changeEmail} data-testid="recovery-change-email">
            {t("auth.recovery.changeEmail")}
          </Button>
        </div>

        <Button type="button" size="lg" className="btn-sweep mt-7 w-full" onClick={onBack}>
          <ThemaIcon name="arrowRight" size="sm" tone="inverse" />
          {t("auth.recovery.back")}
        </Button>

        <Separator className="my-6" />

        <Text size="sm" weight="semibold">
          {t("auth.recovery.notReceived")}
        </Text>
        <Text variant="caption" className="mt-1">
          {t("auth.recovery.checkSpam")}
        </Text>
        <Button type="button" variant="outline" size="lg" className="mt-4 w-full" disabled={isResending} onClick={() => void resend(sentTo)} data-testid="recovery-resend">
          {isResending ? <Loader2 className="animate-spin" /> : <ThemaIcon name="refresh" size="sm" />}
          {t("auth.recovery.resend")}
        </Button>
        {wasResent && (
          <Text variant="caption" role="status" className="mt-2 text-center">
            {t("auth.recovery.resent", { email: sentTo })}
          </Text>
        )}
        {serverError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle />
            <AlertTitle>{t("auth.recovery.errorTitle")}</AlertTitle>
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}
        <Text size="sm" tone="secondary" className="mt-4 text-center">
          {t("auth.recovery.stillMissing")}{" "}
          <Button type="button" variant="link" size="sm" className="h-auto px-0" onClick={() => onCreateTicket(sentTo)} data-testid="recovery-ticket">
            {t("auth.recovery.createTicket")}
          </Button>
        </Text>
      </>
    );
  }

  return (
    <>
      <Button type="button" variant="ghost" size="sm" className="-ml-2 mb-4" onClick={onBack}>
        <ThemaIcon name="arrowLeft" size="sm" />
        {t("auth.recovery.back")}
      </Button>
      <Heading level={3} id="login-heading">
        {t("auth.recovery.title")}
      </Heading>
      <Text tone="secondary" className="mt-1.5">
        {t("auth.recovery.description")}
      </Text>

      <form onSubmit={send} noValidate className="mt-7 space-y-5">
        {serverError && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>{t("auth.recovery.errorTitle")}</AlertTitle>
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="recovery-email">{t("auth.recovery.email")}</Label>
          <Input
            id="recovery-email"
            type="email"
            autoComplete="email"
            autoFocus
            disabled={isSubmitting}
            data-testid="recovery-email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "recovery-email-error" : undefined}
            {...form.register("email")}
          />
          {errors.email && (
            <Text size="xs" tone="negative" id="recovery-email-error">
              {errors.email.message}
            </Text>
          )}
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting} data-testid="recovery-send">
          {isSubmitting ? <Loader2 className="animate-spin" /> : <ThemaIcon name="arrowRight" size="sm" tone="inverse" />}
          {t("auth.recovery.send")}
        </Button>
      </form>
    </>
  );
}
