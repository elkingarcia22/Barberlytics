import * as React from "react";
import { CircleCheck, CircleX, Loader2, PlugZap } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useAppT } from "@/app/i18n";
import { describeError } from "@/lib/api";
import { Field } from "@/components/forms";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettingsCard, SettingsDocument, type FieldErrors } from "../SettingsFormParts";
import { settingsApi } from "../settingsApi";
import { paymentsSchema, type PaymentsSettings as Payments } from "../settingsTypes";

/** Lo que el formulario lleva: lo guardado más la clave secreta que se está escribiendo. */
type Draft = Payments & { secretKey?: string };

/**
 * Pasarela de pago: las dos claves de Stripe para cobrar en línea. La clave
 * secreta nunca vuelve del servidor: una vez guardada solo se sabe que
 * existe, y para cambiarla se escribe una nueva.
 */
export function PaymentsSettings() {
  const t = useAppT();
  const test = useMutation({ mutationFn: settingsApi.testPayments });
  const [result, setResult] = React.useState<{ ok: boolean; message: string } | null>(null);

  const validate = (draft: Draft): FieldErrors => {
    const errors: FieldErrors = {};
    if (!draft.publicKey.trim().startsWith("pk_")) errors.publicKey = t("cfg.payments.error.publicKey");
    const secret = draft.secretKey?.trim() ?? "";
    if (!draft.secretKeySet && !secret) errors.secretKey = t("cfg.payments.error.secretKey");
    else if (secret && !secret.startsWith("sk_")) errors.secretKey = t("cfg.payments.error.secretKeyFormat");
    return errors;
  };

  return (
    <SettingsDocument<Draft> section="payments" schema={paymentsSchema} validate={validate} toBody={(draft) => ({ publicKey: draft.publicKey.trim(), secretKey: draft.secretKey?.trim() ?? "" })}>
      {({ draft, saved, set, errors }) => {
        const runTest = () =>
          test.mutate(
            { publicKey: draft.publicKey.trim(), secretKey: draft.secretKey?.trim() ?? "" },
            { onSuccess: setResult, onError: (error) => setResult({ ok: false, message: describeError(error).description }) }
          );
        return (
          <SettingsCard title={t("cfg.payments.title")} description={t("cfg.payments.hint")} actions={<StatusBadge status={saved.connected ? "active" : "inactive"} label={t(saved.connected ? "cfg.payments.connected" : "cfg.payments.notConnected")} />}>
            <Field label={t("cfg.payments.publicKey")} required error={errors.publicKey} description={t("cfg.payments.publicKeyHint")}>
              <Input value={draft.publicKey} onChange={(event) => set("publicKey", event.target.value)} aria-invalid={!!errors.publicKey} autoComplete="off" spellCheck={false} className="font-mono" placeholder="pk_test_…" data-testid="payments-public" />
            </Field>
            <Field label={t("cfg.payments.secretKey")} required={!draft.secretKeySet} error={errors.secretKey} description={draft.secretKeySet ? t("cfg.payments.secretKeySet") : t("cfg.payments.secretKeyHint")}>
              <Input type="password" value={draft.secretKey ?? ""} onChange={(event) => set("secretKey", event.target.value)} aria-invalid={!!errors.secretKey} autoComplete="new-password" spellCheck={false} className="font-mono" placeholder={draft.secretKeySet ? "••••••••••••" : "sk_test_…"} data-testid="payments-secret" />
            </Field>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" onClick={runTest} disabled={test.isPending || !draft.publicKey.trim()} data-testid="payments-test">
                {test.isPending ? <Loader2 className="animate-spin" /> : <PlugZap />} {t("cfg.payments.test")}
              </Button>
            </div>
            {result && (
              <Alert variant={result.ok ? "default" : "destructive"} data-testid="payments-result">
                {result.ok ? <CircleCheck className="text-status-positive" /> : <CircleX />}
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
            )}
          </SettingsCard>
        );
      }}
    </SettingsDocument>
  );
}
