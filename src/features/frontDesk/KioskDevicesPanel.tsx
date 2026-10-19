import * as React from "react";
import { KeyRound, MonitorSmartphone, Power } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { Field } from "@/components/forms";
import { Text } from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranches } from "@/features/branches/useBranches";
import { useKioskDeviceActions, useKioskDevices, type KioskDevice } from "./api";

/**
 * Los kioscos de recepción, uno por tablet y atado a su sede. «Activar» da un código de 6 dígitos que
 * se escribe en la tablet (`/kiosco`); la tablet queda con su propio token, no con la sesión de nadie.
 * «Desactivar» lo corta al momento; «Nuevo código» sirve para cambiar de tablet.
 */

const WHEN: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" };

const STATUS_KEY = { pending: "frontDesk.devices.status.pending", active: "frontDesk.devices.status.active", revoked: "frontDesk.devices.status.revoked" } as const;

function PairingCode({ device }: { device: KioskDevice }) {
  const t = useAppT();
  const { formatDate } = useLocale();
  if (!device.pairingCode) return null;
  return (
    <div className="rounded-lg bg-surface-subtle px-3 py-2" data-testid="kiosk-pairing">
      <Text as="p" size="xs" tone="muted">
        {t("frontDesk.devices.codeHint", { url: `${window.location.origin}/kiosco` })}
      </Text>
      <p className="mt-1 font-mono text-2xl font-semibold tracking-[0.3em] text-text-primary" data-testid="kiosk-pairing-code">
        {device.pairingCode}
      </p>
      {device.pairingExpiresAt && (
        <Text as="p" size="xs" tone="muted">
          {t("frontDesk.devices.codeExpires", { time: formatDate(new Date(device.pairingExpiresAt), { hour: "numeric", minute: "2-digit" }) })}
        </Text>
      )}
    </div>
  );
}

export function KioskDevicesPanel() {
  const t = useAppT();
  const { formatDate } = useLocale();
  const branches = useBranches();
  const [branchId, setBranchId] = React.useState(branches[0]?.id ?? "");
  const [name, setName] = React.useState("");
  const devices = useKioskDevices(null);
  const actions = useKioskDeviceActions(branchId);
  const onError = (error: unknown) => toast.error(describeError(error).title, { description: describeError(error).description });
  const items = (devices.data?.items ?? []).filter((item) => item.status !== "revoked");

  const activate = () =>
    actions.create.mutate(name.trim() || t("frontDesk.devices.defaultName"), {
      onSuccess: () => {
        setName("");
        toast.success(t("frontDesk.devices.created"));
      },
      onError,
    });

  return (
    <div className="space-y-4" data-testid="kiosk-devices">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label={t("frontDesk.devices.branch")}>
          <Select value={branchId} onValueChange={setBranchId}>
            <SelectTrigger data-testid="kiosk-branch">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("frontDesk.devices.name")}>
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder={t("frontDesk.devices.defaultName")} maxLength={40} />
        </Field>
        <Button type="button" onClick={activate} disabled={!branchId || actions.create.isPending} data-testid="kiosk-activate">
          <MonitorSmartphone aria-hidden />
          {t("frontDesk.devices.activate")}
        </Button>
      </div>

      {items.length === 0 ? (
        <Text variant="caption">{t("frontDesk.devices.empty")}</Text>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-input">
          {items.map((device) => (
            <li key={device.id} className="flex flex-col gap-2 p-3" data-testid="kiosk-device">
              <div className="flex flex-wrap items-center gap-2">
                <Text as="span" weight="medium">
                  {device.name}
                </Text>
                <Text as="span" size="sm" tone="muted">
                  · {device.branchName}
                </Text>
                <Badge variant={device.status === "active" ? "default" : "outline"} className="ml-auto">
                  {t(STATUS_KEY[device.status])}
                </Badge>
              </div>
              {device.status === "active" && (
                <Text as="p" size="xs" tone="muted">
                  {device.lastSeenAt ? t("frontDesk.devices.lastSeen", { when: formatDate(new Date(device.lastSeenAt), WHEN) }) : t("frontDesk.devices.neverSeen")}
                </Text>
              )}
              <PairingCode device={device} />
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => actions.newCode.mutate(device.id, { onError })} disabled={actions.newCode.isPending}>
                  <KeyRound aria-hidden />
                  {t("frontDesk.devices.newCode")}
                </Button>
                <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => actions.revoke.mutate(device.id, { onSuccess: () => toast.success(t("frontDesk.devices.revoked")), onError })} disabled={actions.revoke.isPending} data-testid="kiosk-revoke">
                  <Power aria-hidden />
                  {t("frontDesk.devices.revoke")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
