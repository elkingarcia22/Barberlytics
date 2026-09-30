import { Plus, Trash2 } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { Field, NumberField } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Text } from "@/components/typography";
import { InfoCard, InfoRow } from "../teamShared";
import { CHANNEL_KEYS, reminderChannelSchema, type MemberOptions, type ReminderChannel } from "../types";

/**
 * La pestaña Opciones: los interruptores que cambian cómo se agenda con
 * esta persona, el intervalo, los recordatorios y sus redes.
 */

export interface OptionsFormProps {
  value: MemberOptions;
  onChange: (value: MemberOptions) => void;
}

const SWITCHES = [
  { key: "tips", labelKey: "teamMember.options.tips", hintKey: "teamMember.options.tipsHint" },
  { key: "multipleAppointments", labelKey: "teamMember.options.multiple", hintKey: "teamMember.options.multipleHint" },
  { key: "newClients", labelKey: "teamMember.options.newClients", hintKey: "teamMember.options.newClientsHint" },
] as const;

function SwitchRow({ label, hint, checked, onCheckedChange, testId }: { label: string; hint: string; checked: boolean; onCheckedChange: (checked: boolean) => void; testId?: string }) {
  return (
    <label className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
      <Switch checked={checked} onCheckedChange={onCheckedChange} data-testid={testId} />
      <span className="flex flex-col">
        <Text weight="medium">{label}</Text>
        <Text variant="muted">{hint}</Text>
      </span>
    </label>
  );
}

export function OptionsForm({ value, onChange }: OptionsFormProps) {
  const t = useAppT();
  const set = <K extends keyof MemberOptions>(key: K, next: MemberOptions[K]) => onChange({ ...value, [key]: next });
  const cancel = value.clientCancel;
  const toggleChannel = (channel: ReminderChannel, on: boolean) =>
    set("clientCancel", { ...cancel, channels: on ? [...new Set([...cancel.channels, channel])] : cancel.channels.filter((item) => item !== channel) });

  return (
    <div className="grid gap-4 lg:grid-cols-2" data-testid="options-form">
      <InfoCard title={t("teamMember.options.title")} description={t("teamMember.options.hint")}>
        <div className="space-y-2">
          {SWITCHES.map((item) => (
            <SwitchRow key={item.key} label={t(item.labelKey)} hint={t(item.hintKey)} checked={value[item.key]} onCheckedChange={(checked) => set(item.key, checked)} testId={`options-${item.key}`} />
          ))}
          <SwitchRow label={t("teamMember.options.clientCancel")} hint={t("teamMember.options.clientCancelHint")} checked={cancel.enabled} onCheckedChange={(enabled) => set("clientCancel", { ...cancel, enabled })} />
          {cancel.enabled && (
            <div className="space-y-3 rounded-lg bg-surface-subtle p-3">
              <div className="flex flex-wrap gap-4">
                {reminderChannelSchema.options.map((channel) => (
                  <label key={channel} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={cancel.channels.includes(channel)} onCheckedChange={(checked) => toggleChannel(channel, checked === true)} />
                    {t(CHANNEL_KEYS[channel])}
                  </label>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label={`${t("teamMember.options.cancelWindow")} · ${t("teamMember.options.hours")}`}>
                  <NumberField value={cancel.hours} onValueChange={(hours) => set("clientCancel", { ...cancel, hours: hours ?? 0 })} min={0} max={72} size="sm" />
                </Field>
                <Field label={t("teamMember.options.minutes")}>
                  <NumberField value={cancel.minutes} onValueChange={(minutes) => set("clientCancel", { ...cancel, minutes: minutes ?? 0 })} min={0} max={59} step={5} size="sm" />
                </Field>
              </div>
            </div>
          )}
          <Field label={t("teamMember.options.interval")} required description={t("teamMember.options.intervalHint")}>
            <NumberField value={value.intervalMinutes} onValueChange={(minutes) => set("intervalMinutes", minutes ?? 30)} min={5} max={120} step={5} suffix="min" />
          </Field>
        </div>
      </InfoCard>

      <div className="space-y-4">
        <InfoCard
          title={t("teamMember.options.reminders")}
          description={t("teamMember.options.remindersHint")}
          actions={
            <Button type="button" variant="outline" size="sm" onClick={() => set("reminders", [...value.reminders, { channel: "push", hours: 0, minutes: 15 }])}>
              <Plus /> {t("teamMember.options.addReminder")}
            </Button>
          }
        >
          {value.reminders.length === 0 ? (
            <Text variant="muted">{t("teamMember.options.noReminders")}</Text>
          ) : (
            <div className="space-y-2">
              {value.reminders.map((reminder, index) => (
                <div key={index} className="grid grid-cols-[1fr_5rem_5rem_auto] items-end gap-2 rounded-lg border border-border/60 p-2">
                  <Select value={reminder.channel} onValueChange={(channel) => set("reminders", value.reminders.map((item, i) => (i === index ? { ...item, channel: channel as ReminderChannel } : item)))}>
                    <SelectTrigger size="sm" aria-label={t("teamMember.options.reminders")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reminderChannelSchema.options.map((channel) => (
                        <SelectItem key={channel} value={channel}>
                          {t(CHANNEL_KEYS[channel])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <NumberField aria-label={t("teamMember.options.hours")} value={reminder.hours} onValueChange={(hours) => set("reminders", value.reminders.map((item, i) => (i === index ? { ...item, hours: hours ?? 0 } : item)))} min={0} max={72} suffix="h" size="sm" />
                  <NumberField aria-label={t("teamMember.options.minutes")} value={reminder.minutes} onValueChange={(minutes) => set("reminders", value.reminders.map((item, i) => (i === index ? { ...item, minutes: minutes ?? 0 } : item)))} min={0} max={59} step={5} suffix="min" size="sm" />
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={t("teamMember.options.removeReminder")} onClick={() => set("reminders", value.reminders.filter((_, i) => i !== index))}>
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </InfoCard>
        <InfoCard title={t("teamMember.options.personal")} description={t("teamMember.profile.detailsHint")}>
          <div className="space-y-3">
            <Field label={t("teamMember.options.social")}>
              <Input value={value.social} onChange={(event) => set("social", event.target.value)} placeholder="@barberia" />
            </Field>
            <Field label={t("teamMember.options.link")}>
              <Input value={value.link} onChange={(event) => set("link", event.target.value)} placeholder="https://" />
            </Field>
          </div>
        </InfoCard>
      </div>
    </div>
  );
}

export function OptionsView({ value }: { value: MemberOptions }) {
  const t = useAppT();
  const yesNo = (flag: boolean) => (flag ? t("teamMember.profile.enabled") : t("teamMember.profile.disabled"));
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <InfoCard title={t("teamMember.options.title")} description={t("teamMember.options.hint")}>
        {SWITCHES.map((item) => (
          <InfoRow key={item.key} label={t(item.labelKey)}>
            {yesNo(value[item.key])}
          </InfoRow>
        ))}
        <InfoRow label={t("teamMember.options.clientCancel")}>
          {value.clientCancel.enabled
            ? `${yesNo(true)} · ${value.clientCancel.channels.map((channel) => t(CHANNEL_KEYS[channel])).join(", ") || "—"} · ${t("teamMember.options.before", { hours: value.clientCancel.hours, minutes: value.clientCancel.minutes })}`
            : yesNo(false)}
        </InfoRow>
        <InfoRow label={t("teamMember.options.interval")}>{t("teamMember.options.every", { minutes: value.intervalMinutes })}</InfoRow>
      </InfoCard>
      <div className="space-y-4">
        <InfoCard title={t("teamMember.options.reminders")} description={t("teamMember.options.remindersHint")}>
          {value.reminders.length === 0 ? (
            <Text variant="muted">{t("teamMember.options.noReminders")}</Text>
          ) : (
            value.reminders.map((reminder, index) => (
              <InfoRow key={index} label={t(CHANNEL_KEYS[reminder.channel])}>
                {t("teamMember.options.before", { hours: reminder.hours, minutes: reminder.minutes })}
              </InfoRow>
            ))
          )}
        </InfoCard>
        <InfoCard title={t("teamMember.options.personal")}>
          <InfoRow label={t("teamMember.options.social")}>{value.social || "--"}</InfoRow>
          <InfoRow label={t("teamMember.options.link")}>{value.link || "--"}</InfoRow>
        </InfoCard>
      </div>
    </div>
  );
}
