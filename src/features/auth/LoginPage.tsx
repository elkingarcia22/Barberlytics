import * as React from "react";
import { useAppT } from "@/app/i18n";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate, useLocation, useNavigate } from "react-router";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BarberlyticsLogo } from "@/components/ui/BarberlyticsLogo";
import { ThemeModeToggle, ThemeSelector } from "@/themes";
import { describeError, env } from "@/lib/api";
import { useAuth } from "./useAuth";
import { credentialsSchema, type Credentials } from "./types";

interface LocationState {
  from?: string;
}

export function LoginPage() {
  const t = useAppT();
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from ?? "/dashboard";
  const [serverError, setServerError] = React.useState<string | null>(null);

  const form = useForm<Credentials>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: "", password: "" },
  });

  if (status === "authenticated") return <Navigate to={from} replace />;

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      await login(values);
      navigate(from, { replace: true });
    } catch (error) {
      setServerError(describeError(error).description);
    }
  });

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="absolute right-4 top-4 flex items-center gap-1.5">
        <ThemeSelector compact />
        <ThemeModeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <BarberlyticsLogo height={32} className="text-text-primary" />
        </div>
        <div className="rounded-3xl border border-border/60 bg-surface p-6 shadow-card sm:p-8">
          <h1 className="text-xl font-bold tracking-tight text-text-primary">Inicia sesión</h1>
          <p className="mt-1 text-sm text-text-secondary">Usa el correo con el que te registraron.</p>

          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
            {serverError && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertTitle>{t("auth.errorTitle")}</AlertTitle>
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="login-email">{t("auth.email")}</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                data-testid="login-email"
                aria-invalid={!!form.formState.errors.email}
                {...form.register("email")}
              />
              {form.formState.errors.email && <p className="text-xs text-status-negative">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="login-password">{t("auth.password")}</Label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                data-testid="login-password"
                aria-invalid={!!form.formState.errors.password}
                {...form.register("password")}
              />
              {form.formState.errors.password && <p className="text-xs text-status-negative">{form.formState.errors.password.message}</p>}
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting} data-testid="login-submit">
              {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
              Entrar
            </Button>
          </form>

          {env.useMocks && (
            <p className="mt-5 rounded-lg bg-surface-subtle p-3 text-xs leading-relaxed text-text-secondary">
              Backend simulado activo. Prueba con <code className="font-mono text-text-primary">admin@thema.dev</code> /{" "}
              <code className="font-mono text-text-primary">thema123</code>.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
