import * as React from "react";
import { useSearchParams } from "react-router";
import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";
import { NumberField } from "@/components/forms";
import { ThemaTabs } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/typography";
import { SettingsCard, SettingsDocument } from "../SettingsFormParts";
import { notificationsSchema, type NotificationSettings as Notifications } from "../settingsTypes";
import { AUDIENCES, NOTIFICATION_CATALOG, thresholdKey, toggleKey, type NotificationAudience, type NotificationChannel, type NotificationGroup } from "./notificationCatalog";

const AUDIENCE_KEYS: Readonly<Record<NotificationAudience, AppMessageKey>> = {
  owner: "cfg.notify.audience.owner",
  admin: "cfg.notify.audience.admin",
  frontDesk: "cfg.notify.audience.frontDesk",
  barberCommission: "cfg.notify.audience.barberCommission",
  barberRent: "cfg.notify.audience.barberRent",
  clients: "cfg.notify.audience.clients",
};
const CHANNEL_KEYS: Readonly<Record<NotificationChannel, AppMessageKey>> = { email: "cfg.notify.channel.email", push: "cfg.notify.channel.push", sms: "cfg.notify.channel.sms" };

/** Un aviso sin valor guardado está encendido: es como arranca una cuenta nueva. */
const isOn = (toggles: Notifications["toggles"], key: string): boolean => toggles[key] ?? true;

const keysOf = (audience: NotificationAudience, groups: readonly NotificationGroup[]): string[] => groups.flatMap((group) => group.events.flatMap((item) => item.channels.map((channel) => toggleKey(audience, item.id, channel))));

/**
 * Recordatorios y avisos: a cada quien —dueño, administrador, recepción,
 * barberos y clientes— qué se le avisa y por dónde. Una pestaña por
 * destinatario con cuántos avisos tiene encendidos, los avisos agrupados por
 * tema y cada canal con su interruptor. La pestaña vive en la URL.
 */
export function NotificationSettings() {
  const t = useAppT();
  const [searchParams, setSearchParams] = useSearchParams();
  const param = searchParams.get("para");
  const audience: NotificationAudience = AUDIENCES.find((item) => item === param) ?? "owner";
  const pickAudience = (value: string) =>
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);
        if (value === "owner") params.delete("para");
        else params.set("para", value);
        return params;
      },
      { replace: true }
    );

  return (
    <SettingsDocument section="notifications" schema={notificationsSchema}>
      {({ draft, set }) => {
        const groups = NOTIFICATION_CATALOG[audience];
        const keys = keysOf(audience, groups);
        const on = keys.filter((key) => isOn(draft.toggles, key)).length;
        const setAll = (value: boolean) => set("toggles", { ...draft.toggles, ...Object.fromEntries(keys.map((key) => [key, value])) });
        return (
          <>
            <ThemaTabs
              className="mb-0"
              variant="page"
              fitContent
              tabs={AUDIENCES.map((item) => ({ id: item, label: t(AUDIENCE_KEYS[item]), badge: keysOf(item, NOTIFICATION_CATALOG[item]).filter((key) => isOn(draft.toggles, key)).length }))}
              activeTabId={audience}
              onTabChange={pickAudience}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Text variant="muted" data-testid="notify-count">
                {t("cfg.notify.count", { on, total: keys.length })}
              </Text>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setAll(true)} disabled={on === keys.length}>
                  {t("cfg.notify.allOn")}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setAll(false)} disabled={on === 0} data-testid="notify-all-off">
                  {t("cfg.notify.allOff")}
                </Button>
              </div>
            </div>
            {groups.map((group) => (
              <SettingsCard key={group.id} title={t(group.labelKey)}>
                <ul className="divide-y divide-border/60">
                  {group.events.map((item) => (
                    <li key={item.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3 first:pt-0 last:pb-0">
                      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-sm text-text-primary">
                        {t(item.labelKey)}
                        {item.threshold && (
                          <span className="w-28">
                            <NumberField
                              size="sm"
                              value={draft.thresholds[thresholdKey(audience, item.id)] ?? item.threshold.default}
                              onValueChange={(value) => set("thresholds", { ...draft.thresholds, [thresholdKey(audience, item.id)]: value ?? item.threshold?.default ?? 0 })}
                              min={1}
                              max={item.threshold.unit === "percent" ? 100 : 1440}
                              suffix={item.threshold.unit === "percent" ? "%" : "min"}
                              aria-label={t(item.threshold.unit === "percent" ? "cfg.notify.thresholdPercent" : "cfg.notify.thresholdMinutes")}
                            />
                          </span>
                        )}
                      </span>
                      <span className="flex shrink-0 items-center gap-4">
                        {item.channels.map((channel) => (
                          <ChannelSwitch key={channel} label={t(CHANNEL_KEYS[channel])} checked={isOn(draft.toggles, toggleKey(audience, item.id, channel))} onCheckedChange={(checked) => set("toggles", { ...draft.toggles, [toggleKey(audience, item.id, channel)]: checked })} />
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </SettingsCard>
            ))}
          </>
        );
      }}
    </SettingsDocument>
  );
}

function ChannelSwitch({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  const id = React.useId();
  return (
    <span className="flex items-center gap-2">
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <label htmlFor={id} className="text-xs text-text-secondary">
        {label}
      </label>
    </span>
  );
}
