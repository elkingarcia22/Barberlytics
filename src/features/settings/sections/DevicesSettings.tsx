import { Smartphone } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { Field } from "@/components/forms";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { IconTile } from "@/components/utility";
import type { FieldErrors } from "../SettingsFormParts";
import { SettingsList } from "../SettingsListParts";
import { deviceSchema, type Device, type DeviceInput } from "../settingsTypes";

const EMPTY: DeviceInput = { name: "", serial: "", tpn: "", authKey: "" };
const MIN_CODE_LENGTH = 4;

/**
 * Datáfonos: las terminales que cobran en caja. La clave de autenticación se
 * guarda pero nunca vuelve a mostrarse: de un datáfono ya registrado solo se
 * sabe si la tiene.
 */
export function DevicesSettings() {
  const t = useAppT();

  const validate = (draft: DeviceInput): FieldErrors => {
    const errors: FieldErrors = {};
    if (draft.name.trim().length < 2) errors.name = t("cfg.devices.error.name");
    if (draft.serial.trim().length < MIN_CODE_LENGTH) errors.serial = t("cfg.devices.error.serial");
    if (draft.tpn.trim().length < MIN_CODE_LENGTH) errors.tpn = t("cfg.devices.error.tpn");
    return errors;
  };

  return (
    <SettingsList<Device, DeviceInput>
      list="devices"
      schema={deviceSchema}
      icon="phone"
      labelOf={(item) => item.name}
      renderRow={(item) => ({
        leading: <IconTile icon={<Smartphone />} tone="primary" />,
        description: (
          <span className="font-mono text-xs">
            SN {item.serial} · TPN {item.tpn}
          </span>
        ),
        meta: <Badge variant={item.hasAuthKey ? "positive" : "neutral"}>{t(item.hasAuthKey ? "cfg.devices.withKey" : "cfg.devices.withoutKey")}</Badge>,
      })}
      emptyDraft={EMPTY}
      toDraft={({ name, serial, tpn }) => ({ name, serial, tpn, authKey: "" })}
      validate={validate}
      messages={{
        count: (count) => t("cfg.devices.count", { count }),
        add: t("cfg.devices.add"),
        emptyTitle: t("cfg.devices.emptyTitle"),
        emptyHint: t("cfg.devices.emptyHint"),
        createTitle: t("cfg.devices.add"),
        editTitle: t("cfg.devices.editTitle"),
        formHint: t("cfg.devices.formHint"),
        created: t("cfg.devices.created"),
        saved: t("cfg.saved"),
        removed: t("cfg.devices.removed"),
        removeTitle: (label) => t("cfg.removeTitle", { name: label }),
        removeHint: t("cfg.devices.removeHint"),
        editAria: (label) => t("cfg.editAria", { name: label }),
        removeAria: (label) => t("cfg.removeAria", { name: label }),
      }}
      renderForm={({ draft, set, errors, editing }) => (
        <>
          <Field label={t("cfg.devices.name")} required error={errors.name} description={t("cfg.devices.nameHint")}>
            <Input value={draft.name} onChange={(event) => set("name", event.target.value)} aria-invalid={!!errors.name} autoComplete="off" data-testid="devices-name" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("cfg.devices.serial")} required error={errors.serial}>
              <Input value={draft.serial} onChange={(event) => set("serial", event.target.value)} aria-invalid={!!errors.serial} autoComplete="off" spellCheck={false} className="font-mono" data-testid="devices-serial" />
            </Field>
            <Field label={t("cfg.devices.tpn")} required error={errors.tpn} description={t("cfg.devices.tpnHint")}>
              <Input value={draft.tpn} onChange={(event) => set("tpn", event.target.value)} aria-invalid={!!errors.tpn} autoComplete="off" spellCheck={false} className="font-mono" data-testid="devices-tpn" />
            </Field>
          </div>
          <Field label={t("cfg.devices.authKey")} description={t(editing ? "cfg.devices.authKeyEditHint" : "cfg.devices.authKeyHint")}>
            <Input type="password" value={draft.authKey} onChange={(event) => set("authKey", event.target.value)} autoComplete="new-password" spellCheck={false} className="font-mono" data-testid="devices-auth" />
          </Field>
        </>
      )}
    />
  );
}
