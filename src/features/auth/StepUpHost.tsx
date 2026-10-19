import * as React from "react";
import { useAppT } from "@/app/i18n";
import { apiAuth, describeError } from "@/lib/api";
import { Field } from "@/components/forms";
import { ModalShell } from "@/components/overlays";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clearStepUp, stepUpApi, stepUpToken } from "./stepUp";

const CODE_LENGTH = 6;

/**
 * El diálogo que pide el código cuando el servidor responde `step_up_required`. Se monta una vez: el
 * cliente de la API le pregunta, espera a que la persona confirme (o desista) y repite la petición.
 */
export function StepUpHost() {
  const t = useAppT();
  const [open, setOpen] = React.useState(false);
  const [hint, setHint] = React.useState("");
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const pending = React.useRef<{ promise: Promise<boolean>; resolve: (value: boolean) => void } | null>(null);

  const send = React.useCallback(async () => {
    setError(null);
    try {
      setHint((await stepUpApi.request()).phoneHint);
    } catch (reason) {
      setError(describeError(reason).description);
    }
  }, []);

  React.useEffect(() => {
    apiAuth.getStepUp = () => stepUpToken();
    apiAuth.onStepUpRequired = () => {
      // Si ya se está pidiendo, todas las peticiones esperan la misma confirmación.
      if (pending.current) return pending.current.promise;
      let resolve: (value: boolean) => void = () => {};
      const promise = new Promise<boolean>((done) => (resolve = done));
      pending.current = { promise, resolve };
      setCode("");
      setError(null);
      setOpen(true);
      void send();
      return promise;
    };
    return () => {
      apiAuth.getStepUp = undefined;
      apiAuth.onStepUpRequired = undefined;
      clearStepUp();
    };
  }, [send]);

  const finish = (confirmed: boolean) => {
    pending.current?.resolve(confirmed);
    pending.current = null;
    setOpen(false);
  };

  const verify = async () => {
    setBusy(true);
    setError(null);
    try {
      await stepUpApi.verify(code);
      finish(true);
    } catch (reason) {
      setError(describeError(reason).description);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell
      open={open}
      onOpenChange={(next) => !next && finish(false)}
      title={t("auth.stepUp.title")}
      description={hint ? t("auth.stepUp.hint", { phone: hint }) : t("auth.stepUp.hintNoPhone")}
      size="sm"
      actions={
        <>
          <Button variant="outline" onClick={() => finish(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={() => void verify()} disabled={busy || code.length !== CODE_LENGTH} data-testid="step-up-confirm">
            {t("auth.stepUp.confirm")}
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (code.length === CODE_LENGTH) void verify();
        }}
      >
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Field label={t("auth.stepUp.code")}>
          <Input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))} inputMode="numeric" autoComplete="one-time-code" autoFocus data-testid="step-up-code" />
        </Field>
        <Button type="button" variant="link" size="sm" className="px-0" onClick={() => void send()}>
          {t("auth.stepUp.resend")}
        </Button>
      </form>
    </ModalShell>
  );
}
