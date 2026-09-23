import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useNavigate } from "react-router";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { PhoneInput } from "@/components/forms";
import { Heading, Text } from "@/components/typography";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ThemaIcon } from "@/icons";
import { describeError, env } from "@/lib/api";
import { useAuth } from "./useAuth";
import { PasswordField } from "./PasswordField";
import { credentialsSchema, type AuthProvider, type Credentials } from "./types";

interface LocationState {
  from?: string;
}

const PROVIDERS: readonly { id: AuthProvider; label: "auth.google" | "auth.microsoft"; icon: "google" | "microsoft" }[] = [
  { id: "google", label: "auth.google", icon: "google" },
  { id: "microsoft", label: "auth.microsoft", icon: "microsoft" },
];

export interface LoginFormProps {
  /** Aviso de éxito (p. ej. la contraseña recién cambiada). */
  notice?: string | null;
  onForgotPassword: () => void;
}

export function LoginForm({ notice, onForgotPassword }: LoginFormProps) {
  const t = useAppT();
  const { login, loginWithProvider } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from ?? "/dashboard";
  const [serverError, setServerError] = React.useState<{ title: string; description: string } | null>(null);
  const [pendingProvider, setPendingProvider] = React.useState<AuthProvider | null>(null);

  const form = useForm<Credentials>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { phone: "", password: "" },
  });
  const { errors, isSubmitting } = form.formState;
  const isBusy = isSubmitting || pendingProvider !== null;

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      await login(values);
      navigate(from, { replace: true });
    } catch (error) {
      setServerError({ title: t("auth.errorTitle"), description: describeError(error).description });
    }
  });

  const handleProvider = async (provider: AuthProvider) => {
    setServerError(null);
    setPendingProvider(provider);
    try {
      await loginWithProvider(provider);
      navigate(from, { replace: true });
    } catch (error) {
      const providerName = t(provider === "google" ? "auth.google" : "auth.microsoft");
      setServerError({ title: t("auth.providerErrorTitle", { provider: providerName }), description: describeError(error).description });
    } finally {
      setPendingProvider(null);
    }
  };

  return (
    <>
      <Heading level={3} id="login-heading">
        {t("auth.title")}
      </Heading>
      <Text tone="secondary" className="mt-1.5">
        {t("auth.description")}
      </Text>

      <form onSubmit={onSubmit} noValidate className="mt-7 space-y-5">
        {notice && !serverError && (
          <Alert variant="success">
            <CheckCircle2 />
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        )}
        {serverError && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>{serverError.title}</AlertTitle>
            <AlertDescription>{serverError.description}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="login-phone">{t("auth.phone")}</Label>
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
              />
            )}
          />
          {errors.phone && (
            <Text size="xs" tone="negative">
              {errors.phone.message}
            </Text>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="login-password">{t("auth.password")}</Label>
            <Button type="button" variant="link" size="sm" className="h-auto px-0" onClick={onForgotPassword}>
              {t("auth.forgot")}
            </Button>
          </div>
          <PasswordField
            id="login-password"
            autoComplete="current-password"
            disabled={isBusy}
            data-testid="login-password"
            aria-invalid={!!errors.password}
            {...form.register("password")}
          />
          {errors.password && (
            <Text size="xs" tone="negative">
              {errors.password.message}
            </Text>
          )}
        </div>

        <Button type="submit" size="lg" className="btn-sweep w-full" disabled={isBusy} data-testid="login-submit">
          {isSubmitting ? <Loader2 className="animate-spin" /> : <ThemaIcon name="arrowRight" size="sm" tone="inverse" />}
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

      {env.useMocks && (
        <Text variant="caption" className="mt-6 rounded-lg bg-surface-subtle p-3 leading-relaxed">
          {t("auth.mockHint")} <Text variant="code" className="whitespace-nowrap">300 123 4567</Text> / <Text variant="code">thema123</Text>, {t("auth.mockHintOr")}
        </Text>
      )}
    </>
  );
}
