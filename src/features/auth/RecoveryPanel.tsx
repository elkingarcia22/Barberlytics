import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { InputOtp, PhoneInput, formatNational, parseE164 } from "@/components/forms";
import { Heading, Text } from "@/components/typography";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ThemaIcon } from "@/icons";
import { describeError, env } from "@/lib/api";
import { authApi } from "./api";
import { PasswordField } from "./PasswordField";
import {
  RECOVERY_CODE_LENGTH,
  newPasswordSchema,
  recoveryRequestSchema,
  type NewPassword,
  type RecoveryRequest,
} from "./types";

type Step = "phone" | "code" | "password" | "done";

export interface RecoveryPanelProps {
  /** Vuelve al login; con `notice` lleva el aviso de contraseña cambiada. */
  onBack: (notice?: string) => void;
}

/** «+573001234567» → «+57 300 123 4567», para decir a qué número se envió el código. */
function describePhone(phone: string): string {
  const parsed = parseE164(phone);
  if (!parsed.country) return phone;
  return `${parsed.country.dialCode} ${formatNational(parsed.national, parsed.country.groups)}`;
}

function useRequestError() {
  const [error, setError] = React.useState<string | null>(null);
  const run = React.useCallback(async (task: () => Promise<void>) => {
    setError(null);
    try {
      await task();
    } catch (cause) {
      setError(describeError(cause).description);
    }
  }, []);
  return { error, run, clear: () => setError(null) };
}

/**
 * Recuperar el acceso con el celular: pedir el código por SMS, escribirlo y
 * elegir una contraseña nueva. Vive dentro del mismo panel que el login y
 * vuelve a él al terminar.
 */
export function RecoveryPanel({ onBack }: RecoveryPanelProps) {
  const t = useAppT();
  const [step, setStep] = React.useState<Step>("phone");
  const [phone, setPhone] = React.useState("");
  const [code, setCode] = React.useState("");
  const [resetToken, setResetToken] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);
  const [wasResent, setWasResent] = React.useState(false);
  const request = useRequestError();

  const withPending = async (task: () => Promise<void>) => {
    setIsPending(true);
    try {
      await request.run(task);
    } finally {
      setIsPending(false);
    }
  };

  const phoneForm = useForm<RecoveryRequest>({ resolver: zodResolver(recoveryRequestSchema), defaultValues: { phone: "" } });
  const passwordForm = useForm<NewPassword>({ resolver: zodResolver(newPasswordSchema), defaultValues: { password: "", confirm: "" } });

  const sendCode = phoneForm.handleSubmit((values) =>
    withPending(async () => {
      await authApi.recovery.request(values);
      setPhone(values.phone);
      setCode("");
      setStep("code");
    })
  );

  const resendCode = () =>
    withPending(async () => {
      await authApi.recovery.request({ phone });
      setWasResent(true);
    });

  const verifyCode = () =>
    withPending(async () => {
      const ticket = await authApi.recovery.verify({ phone, code });
      setResetToken(ticket.resetToken);
      setStep("password");
    });

  const savePassword = passwordForm.handleSubmit((values) =>
    withPending(async () => {
      await authApi.recovery.reset({ resetToken, password: values.password });
      setStep("done");
    })
  );

  const headings: Record<Step, { title: string; description: string }> = {
    phone: { title: t("auth.recovery.title"), description: t("auth.recovery.description") },
    code: { title: t("auth.recovery.codeTitle"), description: t("auth.recovery.codeDescription", { phone: describePhone(phone) }) },
    password: { title: t("auth.recovery.passwordTitle"), description: t("auth.recovery.passwordDescription") },
    done: { title: t("auth.recovery.doneTitle"), description: t("auth.recovery.done") },
  };

  return (
    <>
      {step === "done" ? (
        <ThemaIcon name="success" size="lg" tone="positive" className="mb-4" />
      ) : (
        <Button type="button" variant="ghost" size="sm" className="-ml-2 mb-4" onClick={() => onBack()}>
          <ThemaIcon name="arrowLeft" size="sm" />
          {t("auth.recovery.back")}
        </Button>
      )}
      <Heading level={3} id="login-heading">
        {headings[step].title}
      </Heading>
      <Text tone="secondary" className="mt-1.5">
        {headings[step].description}
      </Text>

      {request.error && (
        <Alert variant="destructive" className="mt-5">
          <AlertCircle />
          <AlertTitle>{t("auth.recovery.errorTitle")}</AlertTitle>
          <AlertDescription>{request.error}</AlertDescription>
        </Alert>
      )}

      {step === "phone" && (
        <form onSubmit={sendCode} noValidate className="mt-7 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="recovery-phone">{t("auth.phone")}</Label>
            <Controller
              control={phoneForm.control}
              name="phone"
              render={({ field }) => (
                <PhoneInput
                  id="recovery-phone"
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  disabled={isPending}
                  autoFocus
                  data-testid="recovery-phone"
                  aria-invalid={!!phoneForm.formState.errors.phone}
                />
              )}
            />
            {phoneForm.formState.errors.phone && (
              <Text size="xs" tone="negative">
                {phoneForm.formState.errors.phone.message}
              </Text>
            )}
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={isPending} data-testid="recovery-send">
            {isPending ? <Loader2 className="animate-spin" /> : <ThemaIcon name="smsCode" size="sm" tone="inverse" />}
            {t("auth.recovery.send")}
          </Button>
        </form>
      )}

      {step === "code" && (
        <div className="mt-7 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="recovery-code">{t("auth.recovery.code")}</Label>
            <InputOtp
              id="recovery-code"
              length={RECOVERY_CODE_LENGTH}
              groups={[3, 3]}
              value={code}
              onChange={setCode}
              onComplete={() => request.clear()}
              disabled={isPending}
              autoFocus
              aria-label={t("auth.recovery.code")}
            />
            {env.useMocks && (
              <Text variant="caption">
                {t("auth.recovery.mockHint")} <Text variant="code">246810</Text>.
              </Text>
            )}
          </div>
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={isPending || code.length !== RECOVERY_CODE_LENGTH}
            onClick={() => void verifyCode()}
            data-testid="recovery-verify"
          >
            {isPending ? <Loader2 className="animate-spin" /> : <ThemaIcon name="check" size="sm" tone="inverse" />}
            {t("auth.recovery.verify")}
          </Button>
          <div className="flex items-center justify-between gap-4">
            <Button type="button" variant="link" size="sm" className="h-auto px-0" disabled={isPending} onClick={() => void resendCode()}>
              <ThemaIcon name="refresh" size="xs" />
              {t("auth.recovery.resend")}
            </Button>
            <Button type="button" variant="link" size="sm" className="h-auto px-0" disabled={isPending} onClick={() => setStep("phone")}>
              {t("auth.recovery.changePhone")}
            </Button>
          </div>
          {wasResent && (
            <Text variant="caption" role="status">
              {t("auth.recovery.codeDescription", { phone: describePhone(phone) })}
            </Text>
          )}
        </div>
      )}

      {step === "password" && (
        <form onSubmit={savePassword} noValidate className="mt-7 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="recovery-password">{t("auth.recovery.newPassword")}</Label>
            <PasswordField
              id="recovery-password"
              autoComplete="new-password"
              autoFocus
              disabled={isPending}
              data-testid="recovery-password"
              aria-invalid={!!passwordForm.formState.errors.password}
              {...passwordForm.register("password")}
            />
            {passwordForm.formState.errors.password && (
              <Text size="xs" tone="negative">
                {passwordForm.formState.errors.password.message}
              </Text>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="recovery-confirm">{t("auth.recovery.confirmPassword")}</Label>
            <PasswordField
              id="recovery-confirm"
              autoComplete="new-password"
              disabled={isPending}
              data-testid="recovery-confirm"
              aria-invalid={!!passwordForm.formState.errors.confirm}
              {...passwordForm.register("confirm")}
            />
            {passwordForm.formState.errors.confirm && (
              <Text size="xs" tone="negative">
                {passwordForm.formState.errors.confirm.message}
              </Text>
            )}
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={isPending} data-testid="recovery-save">
            {isPending ? <Loader2 className="animate-spin" /> : <ThemaIcon name="lock" size="sm" tone="inverse" />}
            {t("auth.recovery.save")}
          </Button>
        </form>
      )}

      {step === "done" && (
        <div className="mt-7">
          <Button type="button" size="lg" className="w-full" onClick={() => onBack(t("auth.recovery.done"))}>
            {t("auth.recovery.back")}
          </Button>
        </div>
      )}
    </>
  );
}
