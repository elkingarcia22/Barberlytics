import * as React from "react";
import { AlertCircle, Loader2, Mail } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { InputOtp } from "@/components/forms";
import { Heading, Text } from "@/components/typography";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ThemaIcon } from "@/icons";
import { describeError } from "@/lib/api";
import { authApi } from "./api";
import { attemptsLeftFrom } from "./authErrors";
import { describePhone } from "./phoneLabel";
import { OTP_LENGTH } from "./types";
import { useAuth } from "./useAuth";
import { formatCountdown, useCountdown } from "./useCountdown";

export interface LockedPanelProps {
  phone: string;
  /** Lo que falta para poder intentarlo otra vez, según el servidor; `null` si no lo dijo. */
  retryAfterSeconds: number | null;
  onCreateTicket: () => void;
  onBack: () => void;
}

/**
 * Tras varios códigos fallidos seguidos el celular queda bloqueado un rato (crece si se repite). Se ve cuánto
 * falta; quien tiene correo de respaldo lo desbloquea ya con un código al correo, y si no, queda el ticket.
 */
export function LockedPanel({ phone, retryAfterSeconds, onCreateTicket, onBack }: LockedPanelProps) {
  const t = useAppT();
  const { startSession } = useAuth();
  const wait = useCountdown(retryAfterSeconds ?? 0);
  const [step, setStep] = React.useState<"locked" | "email">("locked");
  const [code, setCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [problem, setProblem] = React.useState<string | null>(null);
  const ready = retryAfterSeconds !== null && wait.left === 0;

  const requestEmail = async () => {
    setBusy(true);
    setProblem(null);
    try {
      await authApi.unlockRequest(phone);
      setStep("email");
    } catch (error) {
      setProblem(describeError(error).description);
    } finally {
      setBusy(false);
    }
  };

  const submit = async (value: string) => {
    if (value.length !== OTP_LENGTH) return;
    setBusy(true);
    setProblem(null);
    try {
      // Con la sesión abierta, la página de entrada lleva sola a donde iba.
      startSession(await authApi.unlockVerify({ phone, code: value }));
    } catch (error) {
      const left = attemptsLeftFrom(error);
      setProblem([describeError(error).description, left === null ? "" : left === 1 ? t("auth.code.lastAttempt") : t("auth.code.attemptsLeft", { count: left })].filter(Boolean).join(" "));
      setCode("");
      setBusy(false);
    }
  };

  return (
    <div role="alert" data-testid="login-locked">
      <ThemaIcon name="securityLock" size="lg" tone="negative" className="mb-4" />
      <Heading level={3} id="login-heading">
        {t("auth.locked.title")}
      </Heading>
      <Text tone="secondary" className="mt-1.5">
        {t("auth.locked.description", { phone: describePhone(phone) })}
      </Text>
      {retryAfterSeconds !== null && (
        <Text size="sm" weight="semibold" className="mt-3 tabular-nums" role="status" data-testid="locked-countdown">
          {ready ? t("auth.locked.ready") : t("auth.locked.wait", { time: formatCountdown(wait.left) })}
        </Text>
      )}

      {problem && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle />
          <AlertTitle>{t("auth.locked.emailErrorTitle")}</AlertTitle>
          <AlertDescription>{problem}</AlertDescription>
        </Alert>
      )}

      {step === "email" ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit(code);
          }}
          noValidate
          className="mt-5 space-y-4"
        >
          <Text size="sm" tone="secondary">
            {t("auth.locked.emailSent")}
          </Text>
          <div className="space-y-2">
            <Label htmlFor="unlock-code">{t("auth.locked.emailCode")}</Label>
            <InputOtp id="unlock-code" length={OTP_LENGTH} groups={[3, 3]} value={code} onChange={setCode} onComplete={(value) => void submit(value)} disabled={busy} autoFocus aria-label={t("auth.locked.emailCode")} data-testid="unlock-code" />
          </div>
          <Button type="submit" size="lg" className="btn-sweep w-full" disabled={busy || code.length !== OTP_LENGTH} data-testid="unlock-submit">
            {busy ? <Loader2 className="animate-spin" /> : <ThemaIcon name="arrowRight" size="sm" tone="inverse" />}
            {t("auth.locked.emailSubmit")}
          </Button>
        </form>
      ) : (
        <>
          <div className="mt-4 flex gap-2">
            <ThemaIcon name="info" size="sm" tone="muted" className="mt-0.5 shrink-0" />
            <Text size="sm" tone="secondary">
              {t("auth.locked.hint")}
            </Text>
          </div>
          {ready ? (
            <Button type="button" size="lg" className="btn-sweep mt-7 w-full" onClick={onBack} data-testid="locked-try-again">
              <ThemaIcon name="arrowRight" size="sm" tone="inverse" />
              {t("auth.locked.tryAgain")}
            </Button>
          ) : (
            <Button type="button" size="lg" className="btn-sweep mt-7 w-full" onClick={() => void requestEmail()} disabled={busy} data-testid="locked-email">
              {busy ? <Loader2 className="animate-spin" /> : <Mail />}
              {t("auth.locked.byEmail")}
            </Button>
          )}
          <Button type="button" variant="outline" size="lg" className="mt-2 w-full" onClick={onCreateTicket} data-testid="locked-ticket">
            <ThemaIcon name="ticket" size="sm" />
            {t("auth.locked.createTicket")}
          </Button>
        </>
      )}
      <Button type="button" variant="ghost" size="lg" className="mt-2 w-full" onClick={onBack} disabled={busy}>
        {t("auth.recovery.back")}
      </Button>
    </div>
  );
}
