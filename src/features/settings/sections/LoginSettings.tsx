import * as React from "react";
import { Loader2, Mail, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { Field, InputOtp } from "@/components/forms";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { ConfirmDialog } from "@/components/overlays";
import { Text } from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { IconTile } from "@/components/utility/IconTile";
import {
  OTP_LENGTH,
  backupEmailRequestSchema,
  describePhone,
  useBackupEmailMutations,
  useAuth,
  useBackupEmailQuery,
} from "@/features/auth";
import { describeError, isApiError } from "@/lib/api";
import { QueryBoundary } from "@/lib/query";
import { SettingsCard, SwitchRow } from "../SettingsFormParts";

/**
 * Inicio de sesión: cómo entra cada persona. El SMS al celular es la forma
 * principal y no se apaga; el correo de respaldo es la salida cuando el SMS
 * no llega (operador caído, celular sin señal, número de otro país). Es de la
 * persona, no de la barbería, así que lo ve cualquiera que tenga sesión.
 */
export function LoginSettings() {
  const t = useAppT();
  // La ruta va detrás de `RequireAuth`; el perfil puede tardar un instante en llegar.
  const { user } = useAuth();
  const query = useBackupEmailQuery();

  return (
    <div className="space-y-stack" data-testid="settings-login">
      <SettingsCard title={t("cfg.login.primaryTitle")} description={t("cfg.login.primaryHint")}>
        <div className="flex items-center gap-3">
          <IconTile icon={<MessageSquareText />} tone="primary" />
          <div className="min-w-0 flex-1">
            {user ? <Text variant="label">{describePhone(user.phone)}</Text> : <Skeleton className="h-4 w-32" />}
            <Text variant="caption">{t("cfg.login.primarySms")}</Text>
          </div>
          <Badge variant="secondary">{t("cfg.login.primaryBadge")}</Badge>
        </div>
      </SettingsCard>

      <SettingsCard title={t("cfg.login.backupTitle")} description={t("cfg.login.backupHint")}>
        <QueryBoundary query={query} loading={<Skeleton className="h-16 w-full rounded-lg" />}>
          {(data) => <BackupEmailControl saved={data.email} suggestion={user?.email ?? ""} />}
        </QueryBoundary>
      </SettingsCard>
    </div>
  );
}

type Mode = "idle" | "email" | "code";

/**
 * El interruptor y lo que cuelga de él: el correo verificado, o el alta en dos
 * pasos —escribir el correo y devolver el código que le llegó—. Un correo no
 * sirve para entrar hasta que se verifica.
 */
function BackupEmailControl({ saved, suggestion }: { saved: string | null; suggestion: string }) {
  const t = useAppT();
  const { request, verify, remove } = useBackupEmailMutations();
  const [mode, setMode] = React.useState<Mode>("idle");
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | undefined>();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const busy = request.isPending || verify.isPending;

  const startEditing = (initial: string) => {
    setEmail(initial);
    setCode("");
    setError(undefined);
    setMode("email");
  };

  const toggle = (on: boolean) => {
    if (on) return startEditing(suggestion);
    if (saved) return setConfirmOpen(true);
    setMode("idle");
  };

  const fail = (failure: unknown, field: "email" | "code") => {
    const message = isApiError(failure) ? failure.fieldErrors?.[field]?.[0] : undefined;
    setError(message ?? describeError(failure).description);
  };

  const sendCode = (event?: React.FormEvent) => {
    event?.preventDefault();
    const parsed = backupEmailRequestSchema.safeParse({ email });
    if (!parsed.success) return setError(t("cfg.login.errorEmail"));
    setError(undefined);
    request.mutate(parsed.data, {
      onSuccess: () => {
        setEmail(parsed.data.email);
        setCode("");
        if (mode === "code") toast.success(t("cfg.login.resent"));
        setMode("code");
      },
      onError: (failure) => fail(failure, "email"),
    });
  };

  const submitCode = (value: string) => {
    if (value.length !== OTP_LENGTH) return setError(t("cfg.login.errorCode"));
    setError(undefined);
    verify.mutate(
      { email, code: value },
      {
        onSuccess: (next) => {
          setMode("idle");
          toast.success(t("cfg.login.activated"), { description: t("cfg.login.activatedHint", { email: next.email ?? email }) });
        },
        onError: (failure) => {
          setCode("");
          fail(failure, "code");
        },
      }
    );
  };

  const confirmRemove = () =>
    remove.mutate(undefined, {
      onSuccess: () => {
        setConfirmOpen(false);
        setMode("idle");
        toast.success(t("cfg.login.removed"));
      },
      onError: (failure) => toast.error(describeError(failure).title, { description: describeError(failure).description }),
    });

  return (
    <>
      <SwitchRow
        label={t("cfg.login.backupSwitch")}
        hint={t("cfg.login.backupSwitchHint")}
        checked={saved !== null || mode !== "idle"}
        onCheckedChange={toggle}
        disabled={busy || remove.isPending}
        testId="backup-email-switch"
      >
        {mode === "idle" && saved && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-border/60 pt-3">
            {/* El correo pide su propia línea en pantallas angostas: el botón baja antes que cortarlo. */}
            <div className="flex min-w-0 flex-1 basis-60 items-center gap-2">
              <Mail className="size-4 shrink-0 text-text-secondary" aria-hidden />
              <Text variant="label" className="min-w-0 truncate" data-testid="backup-email-saved">
                {saved}
              </Text>
              <StatusBadge status="active" label={t("cfg.login.verified")} />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => startEditing(saved)}>
              {t("cfg.login.changeEmail")}
            </Button>
          </div>
        )}

        {mode === "email" && (
          <form onSubmit={sendCode} noValidate className="mt-3 space-y-3 border-t border-border/60 pt-3">
            <Field label={t("cfg.login.email")} description={t("cfg.login.emailHint")} error={error}>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={busy}
                autoFocus
                data-testid="backup-email-input"
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={busy} data-testid="backup-email-send">
                {request.isPending ? <Loader2 className="animate-spin" /> : <Mail />}
                {t("cfg.login.sendCode")}
              </Button>
              <Button type="button" variant="ghost" disabled={busy} onClick={() => setMode("idle")}>
                {t("cfg.login.cancel")}
              </Button>
            </div>
          </form>
        )}

        {mode === "code" && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitCode(code);
            }}
            noValidate
            className="mt-3 space-y-3 border-t border-border/60 pt-3"
          >
            <Text variant="muted">{t("cfg.login.codeSent", { email })}</Text>
            <Field label={t("cfg.login.code")} error={error}>
              <InputOtp
                length={OTP_LENGTH}
                groups={[3, 3]}
                value={code}
                onChange={setCode}
                onComplete={submitCode}
                disabled={busy}
                autoFocus
                aria-label={t("cfg.login.code")}
              />
            </Field>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" disabled={busy || code.length !== OTP_LENGTH} data-testid="backup-email-verify">
                {verify.isPending && <Loader2 className="animate-spin" />}
                {t("cfg.login.verify")}
              </Button>
              <Button type="button" variant="ghost" disabled={busy} onClick={() => startEditing(email)}>
                {t("cfg.login.changeEmail")}
              </Button>
              <Button type="button" variant="link" size="sm" className="ml-auto h-auto px-0" disabled={busy} onClick={() => sendCode()}>
                {t("cfg.login.resend")}
              </Button>
            </div>
          </form>
        )}
      </SwitchRow>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!remove.isPending) setConfirmOpen(open);
        }}
        variant="destructive"
        title={t("cfg.login.removeTitle")}
        description={t("cfg.login.removeHint")}
        confirmLabel={t("cfg.login.remove")}
        cancelLabel={t("cfg.login.cancel")}
        loading={remove.isPending}
        onConfirm={confirmRemove}
      />
    </>
  );
}
