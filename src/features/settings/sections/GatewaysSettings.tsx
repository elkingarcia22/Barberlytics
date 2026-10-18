import * as React from "react";
import { CircleCheck, CircleX, CreditCard, Loader2, PlugZap } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useAppT, type AppMessageKey } from "@/app/i18n";
import { describeError } from "@/lib/api";
import { Field } from "@/components/forms";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IconTile } from "@/components/utility";
import type { FieldErrors } from "../SettingsFormParts";
import { SettingsList } from "../SettingsListParts";
import { settingsApi } from "../settingsApi";
import { useSettingsList } from "../settingsQueries";
import { GATEWAY_PROVIDERS, GATEWAY_SPECS, keyLooksValid, keyPlaceholder, type GatewayProvider, type OnlineMethod } from "../gatewayProviders";
import { branchSchema, gatewaySchema, type Gateway, type GatewayInput } from "../settingsTypes";

/** El borrador lleva si se está editando: al editar, la clave secreta ya guardada no se vuelve a pedir. */
type GatewayDraft = GatewayInput & { editing: boolean };

const EMPTY: GatewayDraft = { provider: "stripe", name: "Stripe", publicKey: "", secretKey: "", editing: false };

const ONLINE_METHOD_KEYS: Record<OnlineMethod, AppMessageKey> = {
  card: "cfg.gateways.method.card",
  wallet: "cfg.gateways.method.wallet",
  pse: "cfg.gateways.method.pse",
  nequi: "cfg.gateways.method.nequi",
};

/**
 * Pasarelas de pago: las cuentas con las que se cobra en línea. Una barbería
 * con sucursales en dos países conecta una por país (Stripe o Square en
 * Estados Unidos; Wompi, Bold o Mercado Pago en Colombia) y en Sucursales
 * dice cuál usa cada una. La clave secreta se guarda pero nunca vuelve.
 */
export function GatewaysSettings() {
  const t = useAppT();
  const branches = useSettingsList("branches", branchSchema);
  const usedBy = (gatewayId: string) => (branches.data?.items ?? []).filter((branch) => branch.gatewayId === gatewayId).map((branch) => branch.name);

  const validate = (draft: GatewayDraft): FieldErrors => {
    const errors: FieldErrors = {};
    if (draft.name.trim().length < 2) errors.name = t("cfg.gateways.error.name");
    if (!keyLooksValid(draft.provider, "public", draft.publicKey)) errors.publicKey = t("cfg.gateways.error.publicKey");
    const secret = draft.secretKey.trim();
    if (!draft.editing && !secret) errors.secretKey = t("cfg.gateways.error.secretKey");
    else if (secret && !keyLooksValid(draft.provider, "secret", secret)) errors.secretKey = t("cfg.gateways.error.secretKeyFormat");
    return errors;
  };

  return (
    <SettingsList<Gateway, GatewayDraft>
      list="gateways"
      schema={gatewaySchema}
      icon="securityLock"
      labelOf={(item) => item.name}
      renderRow={(item) => {
        const branchNames = usedBy(item.id);
        return {
          leading: <IconTile icon={<CreditCard />} tone="primary" />,
          description: [
            GATEWAY_SPECS[item.provider].methods.map((method) => t(ONLINE_METHOD_KEYS[method])).join(" · "),
            branchNames.length > 0 ? t("cfg.gateways.usedBy", { names: branchNames.join(", ") }) : t("cfg.gateways.unused"),
          ].join(" — "),
          meta: <StatusBadge status={item.connected ? "active" : "inactive"} label={t(item.connected ? "cfg.gateways.connected" : "cfg.gateways.notConnected")} />,
        };
      }}
      emptyDraft={EMPTY}
      toDraft={({ provider, name, publicKey }) => ({ provider, name, publicKey, secretKey: "", editing: true })}
      validate={validate}
      toBody={({ provider, name, publicKey, secretKey }) => ({ provider, name: name.trim(), publicKey: publicKey.trim(), secretKey: secretKey.trim() })}
      messages={{
        count: (count) => t("cfg.gateways.count", { count }),
        add: t("cfg.gateways.add"),
        emptyTitle: t("cfg.gateways.emptyTitle"),
        emptyHint: t("cfg.gateways.emptyHint"),
        createTitle: t("cfg.gateways.add"),
        editTitle: t("cfg.gateways.editTitle"),
        formHint: t("cfg.gateways.formHint"),
        created: t("cfg.gateways.created"),
        saved: t("cfg.saved"),
        removed: t("cfg.gateways.removed"),
        removeTitle: (label) => t("cfg.removeTitle", { name: label }),
        removeHint: t("cfg.gateways.removeHint"),
        editAria: (label) => t("cfg.editAria", { name: label }),
        removeAria: (label) => t("cfg.removeAria", { name: label }),
      }}
      renderForm={({ draft, set, errors, editing }) => <GatewayForm draft={draft} set={set} errors={errors} editing={editing} />}
    />
  );
}

interface GatewayFormProps {
  draft: GatewayDraft;
  set: <K extends keyof GatewayDraft>(key: K, value: GatewayDraft[K]) => void;
  errors: FieldErrors;
  editing: boolean;
}

function GatewayForm({ draft, set, errors, editing }: GatewayFormProps) {
  const t = useAppT();
  const test = useMutation({ mutationFn: settingsApi.testGateway });
  const [result, setResult] = React.useState<{ ok: boolean; message: string } | null>(null);
  const spec = GATEWAY_SPECS[draft.provider];

  const chooseProvider = (provider: GatewayProvider) => {
    set("provider", provider);
    // El nombre sugerido sigue al proveedor mientras nadie lo haya cambiado a mano.
    if (!draft.name.trim() || GATEWAY_PROVIDERS.some((item) => GATEWAY_SPECS[item].name === draft.name.trim())) set("name", GATEWAY_SPECS[provider].name);
    setResult(null);
  };
  const runTest = () =>
    test.mutate(
      { provider: draft.provider, publicKey: draft.publicKey.trim(), secretKey: draft.secretKey.trim() },
      { onSuccess: setResult, onError: (error) => setResult({ ok: false, message: describeError(error).description }) }
    );

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("cfg.gateways.provider")} required description={spec.methods.map((method) => t(ONLINE_METHOD_KEYS[method])).join(" · ")}>
          <Select value={draft.provider} onValueChange={(value) => chooseProvider(value as GatewayProvider)} disabled={editing}>
            <SelectTrigger data-testid="gateways-provider">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GATEWAY_PROVIDERS.map((provider) => (
                <SelectItem key={provider} value={provider}>
                  {GATEWAY_SPECS[provider].name} · {GATEWAY_SPECS[provider].countries.join(", ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("cfg.gateways.name")} required error={errors.name} description={t("cfg.gateways.nameHint")}>
          <Input value={draft.name} onChange={(event) => set("name", event.target.value)} aria-invalid={!!errors.name} autoComplete="off" placeholder={spec.name} data-testid="gateways-name" />
        </Field>
      </div>
      <Field label={t("cfg.gateways.publicKey")} required error={errors.publicKey}>
        <Input value={draft.publicKey} onChange={(event) => set("publicKey", event.target.value)} aria-invalid={!!errors.publicKey} autoComplete="off" spellCheck={false} className="font-mono" placeholder={keyPlaceholder(draft.provider, "public")} data-testid="gateways-public" />
      </Field>
      <Field label={t("cfg.gateways.secretKey")} required={!editing} error={errors.secretKey} description={t(editing ? "cfg.gateways.secretKeySet" : "cfg.gateways.secretKeyHint")}>
        <Input type="password" value={draft.secretKey} onChange={(event) => set("secretKey", event.target.value)} aria-invalid={!!errors.secretKey} autoComplete="new-password" spellCheck={false} className="font-mono" placeholder={editing ? "••••••••••••" : keyPlaceholder(draft.provider, "secret")} data-testid="gateways-secret" />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={runTest} disabled={test.isPending || !draft.publicKey.trim()} data-testid="gateways-test">
          {test.isPending ? <Loader2 className="animate-spin" /> : <PlugZap />} {t("cfg.gateways.test")}
        </Button>
      </div>
      {result && (
        <Alert variant={result.ok ? "default" : "destructive"} data-testid="gateways-result">
          {result.ok ? <CircleCheck className="text-status-positive" /> : <CircleX />}
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}
    </>
  );
}
