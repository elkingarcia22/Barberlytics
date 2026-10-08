import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useNavigate } from "react-router";
import { AlertCircle, Loader2, Mail } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { InputOtp, PhoneInput } from "@/components/forms";
import { Heading, Text } from "@/components/typography";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ThemaIcon } from "@/icons";
import { describeError } from "@/lib/api";
import { useAuth } from "./useAuth";
import { describePhone } from "./phoneLabel";
import { attemptsLeftFrom, isLockedError } from "./authErrors";
import { OTP_LENGTH, otpRequestSchema, type AuthProvider, type OtpChannel, type OtpRequest } from "./types";

interface LocationState {
  from?: string;
}

type Step = "phone" | "code";

interface ServerError {
  title: string;
  description: string;
}

const PROVIDERS: readonly { id: AuthProvider; label: "auth.google" | "auth.microsoft"; icon: "google" | "microsoft" }[] = [
  { id: "google", label: "auth.google", icon: "google" },
  { id: "microsoft", label: "auth.microsoft", icon: "microsoft" },
];

export interface LoginFormProps {
  onForgotNumber: () => void;
  onCreateAccount: () => void;
  /** El backend bloqueó el celular tras varios intentos fallidos seguidos. */
  onLocked: (phone: string) => void;
  /** Ni el SMS ni el correo de respaldo: abrir un ticket con soporte. */
  onContactSupport: (phone: string) => void;
}

/**
 * Entrar en dos pasos: el celular pide el código por SMS y el código abre
 * la sesión. Google y Outlook entran directo. Sin contraseña.
 *
 * Si el SMS no llega, el mismo código se puede pedir al correo de respaldo
 * que la persona verificó en Configuración › Inicio de sesión. El backend no
 * dice si la cuenta lo tiene, así que el texto lo plantea en condicional y
 * ofrece soporte a quien no lo configuró.
 */
export function LoginForm({ onForgotNumber, onCreateAccount, onLocked, onContactSupport }: LoginFormProps) {
  const t = useAppT();
  const { requestCode, verifyCode, loginWithProvider } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from ?? "/metricas";

  const [step, setStep] = React.useState<Step>("phone");
  const [phone, setPhone] = React.useState("");
  const [channel, setChannel] = React.useState<OtpChannel>("sms");
  const [code, setCode] = React.useState("");
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [wasResent, setWasResent] = React.useState(false);
  const [serverError, setServerError] = React.useState<ServerError | null>(null);
  const [pendingProvider, setPendingProvider] = React.useState<AuthProvider | null>(null);

  const form = useForm<OtpRequest>({ resolver: zodResolver(otpRequestSchema), defaultValues: { phone: "" } });
  const { errors, isSubmitting } = form.formState;
  const isBusy = isSubmitting || isVerifying || pendingProvider !== null;

  const enter = () => navigate(from, { replace: true });

  const sendCode = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      await requestCode(values);
      setPhone(values.phone);
      setChannel("sms");
      setCode("");
      setWasResent(false);
      setStep("code");
    } catch (error) {
      if (isLockedError(error)) return onLocked(values.phone);
      setServerError({ title: t("auth.errorTitle"), description: describeError(error).description });
    }
  });

  /** Pide otro código; con `next` cambia además por dónde llega (SMS ↔ correo). */
  const resendCode = async (next: OtpChannel = channel) => {
    setServerError(null);
    setIsVerifying(true);
    try {
      await requestCode({ phone, channel: next });
      setCode("");
      setWasResent(next === channel);
      setChannel(next);
    } catch (error) {
      if (isLockedError(error)) return onLocked(phone);
      setServerError({ title: t("auth.errorTitle"), description: describeError(error).description });
    } finally {
      setIsVerifying(false);
    }
  };

  const submitCode = async (value: string) => {
    if (value.length !== OTP_LENGTH) return;
    setServerError(null);
    setIsVerifying(true);
    try {
      await verifyCode({ phone, code: value });
      enter();
    } catch (error) {
      if (isLockedError(error)) return onLocked(phone);
      const attemptsLeft = attemptsLeftFrom(error);
      const warning =
        attemptsLeft === null ? "" : attemptsLeft === 1 ? t("auth.code.lastAttempt") : t("auth.code.attemptsLeft", { count: attemptsLeft });
      setServerError({ title: t("auth.code.errorTitle"), description: [describeError(error).description, warning].filter(Boolean).join(" ") });
      setCode("");
      setIsVerifying(false);
    }
  };

  const handleProvider = async (provider: AuthProvider) => {
    setServerError(null);
    setPendingProvider(provider);
    try {
      await loginWithProvider(provider);
      enter();
    } catch (error) {
      const providerName = t(provider === "google" ? "auth.google" : "auth.microsoft");
      setServerError({ title: t("auth.providerErrorTitle", { provider: providerName }), description: describeError(error).description });
      setPendingProvider(null);
    }
  };

  const changePhone = () => {
    setServerError(null);
    setStep("phone");
  };

  const errorAlert = serverError && (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>{serverError.title}</AlertTitle>
      <AlertDescription>{serverError.description}</AlertDescription>
    </Alert>
  );

  if (step === "code") {
    const byEmail = channel === "email";
    return (
      <>
        <Button type="button" variant="ghost" size="sm" className="-ml-2 mb-4" disabled={isBusy} onClick={changePhone}>
          <ThemaIcon name="arrowLeft" size="sm" />
          {t("auth.code.changePhone")}
        </Button>
        <Heading level={3} id="login-heading">
          {byEmail ? t("auth.code.titleEmail") : t("auth.code.title")}
        </Heading>
        <Text tone="secondary" className="mt-1.5" data-testid="login-code-description">
          {byEmail ? t("auth.code.descriptionEmail") : t("auth.code.description", { phone: describePhone(phone) })}
        </Text>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submitCode(code);
          }}
          noValidate
          className="mt-7 space-y-5"
        >
          {errorAlert}
          <div className="space-y-2">
            <Label htmlFor="login-code">{t("auth.code.label")}</Label>
            <InputOtp
              id="login-code"
              length={OTP_LENGTH}
              groups={[3, 3]}
              value={code}
              onChange={setCode}
              onComplete={(value) => void submitCode(value)}
              disabled={isBusy}
              autoFocus
              aria-label={t("auth.code.label")}
            />
          </div>
          <Button type="submit" size="lg" className="btn-sweep w-full" disabled={isBusy || code.length !== OTP_LENGTH} data-testid="login-verify">
            {isVerifying ? <Loader2 className="animate-spin" /> : <ThemaIcon name="arrowRight" size="sm" tone="inverse" />}
            {t("auth.code.submit")}
          </Button>
          <div className="flex items-center justify-between gap-4">
            <Button type="button" variant="link" size="sm" className="h-auto px-0" disabled={isBusy} onClick={() => void resendCode()} data-testid="login-resend">
              <ThemaIcon name="refresh" size="xs" />
              {t("auth.code.resend")}
            </Button>
            {wasResent && (
              <Text variant="caption" role="status">
                {byEmail ? t("auth.code.resentEmail") : t("auth.code.resent", { phone: describePhone(phone) })}
              </Text>
            )}
          </div>
        </form>

        <div className="mt-6 space-y-1 border-t border-border/60 pt-4">
          {byEmail ? (
            <>
              <Text size="sm" tone="secondary">
                {t("auth.code.emailHelp")}{" "}
                <Button type="button" variant="link" size="sm" className="h-auto px-0" disabled={isBusy} onClick={() => onContactSupport(phone)} data-testid="login-support">
                  {t("auth.code.contactSupport")}
                </Button>
              </Text>
              <Button type="button" variant="link" size="sm" className="h-auto px-0" disabled={isBusy} onClick={() => void resendCode("sms")} data-testid="login-use-sms">
                <ThemaIcon name="smsCode" size="xs" />
                {t("auth.code.useSms")}
              </Button>
            </>
          ) : (
            <Text size="sm" tone="secondary">
              {t("auth.code.noSms")}{" "}
              <Button type="button" variant="link" size="sm" className="h-auto px-0" disabled={isBusy} onClick={() => void resendCode("email")} data-testid="login-use-email">
                <Mail className="size-3.5" aria-hidden />
                {t("auth.code.useEmail")}
              </Button>
            </Text>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <Heading level={3} id="login-heading">
        {t("auth.title")}
      </Heading>
      <Text tone="secondary" className="mt-1.5">
        {t("auth.description")}
      </Text>

      <form onSubmit={sendCode} noValidate className="mt-7 space-y-5">
        {errorAlert}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="login-phone">{t("auth.phone")}</Label>
            <Button type="button" variant="link" size="sm" className="h-auto px-0" onClick={onForgotNumber}>
              {t("auth.forgotNumber")}
            </Button>
          </div>
          <Controller
            control={form.control}
            name="phone"
            render={({ field }) => (
              <PhoneInput
                id="login-phone"
                name={field.name}
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                disabled={isBusy}
                autoFocus
                data-testid="login-phone"
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "login-phone-error" : undefined}
              />
            )}
          />
          {errors.phone && (
            <Text size="xs" tone="negative" id="login-phone-error">
              {errors.phone.message}
            </Text>
          )}
        </div>

        <Button type="submit" size="lg" className="btn-sweep w-full" disabled={isBusy} data-testid="login-submit">
          {isSubmitting ? <Loader2 className="animate-spin" /> : <ThemaIcon name="smsCode" size="sm" tone="inverse" />}
          {t("auth.submit")}
        </Button>
      </form>

      <div className="mt-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <Text variant="caption">{t("auth.or")}</Text>
        <Separator className="flex-1" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {PROVIDERS.map((provider) => (
          <Button
            key={provider.id}
            type="button"
            variant="outline"
            size="lg"
            disabled={isBusy}
            onClick={() => void handleProvider(provider.id)}
            data-testid={`login-${provider.id}`}
          >
            {pendingProvider === provider.id ? <Loader2 className="animate-spin" /> : <ThemaIcon name={provider.icon} size="sm" />}
            {t(provider.label)}
          </Button>
        ))}
      </div>

      <Text size="sm" tone="secondary" className="mt-6 text-center">
        {t("auth.noAccount")}{" "}
        <Button type="button" variant="link" size="sm" className="h-auto px-0" disabled={isBusy} onClick={onCreateAccount} data-testid="login-signup">
          {t("auth.createAccount")}
        </Button>
      </Text>
    </>
  );
}
