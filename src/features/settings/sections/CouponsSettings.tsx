import { Ticket } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useShellConfig } from "@/components/app-shell";
import { Field, MultiSelect, NumberField } from "@/components/forms";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { ThemaTabs } from "@/components/navigation";
import { Input } from "@/components/ui/input";
import { IconTile } from "@/components/utility";
import { DEFAULT_BRANCH_ID, useCurrencyInput } from "@/features/branches";
import { useMoney } from "@/features/calendar/calendarFormat";
import { useServicesQuery } from "@/features/services/queries";
import type { FieldErrors } from "../SettingsFormParts";
import { SwitchRow } from "../SettingsFormParts";
import { SettingsList } from "../SettingsListParts";
import { couponItemSchema, type CouponInput, type CouponItem } from "../settingsTypes";

const EMPTY: CouponInput = { code: "", type: "percent", value: Number.NaN, description: "", firstVisitOnly: false, minAppointments: null, validFrom: null, validTo: null, serviceIds: [], maxUses: null, perClient: 1, active: true };
const CODE = /^[A-Z0-9]{3,20}$/;

/**
 * Cupones: los códigos de descuento de la barbería. Valen igual en la reserva en línea y en la caja, con fecha de inicio
 * y fin, tope total y por cliente, solo primera visita o solo ciertos servicios. Cada uso queda anotado.
 */
export function CouponsSettings() {
  const t = useAppT();
  const formatMoney = useMoney();
  const { symbol } = useCurrencyInput();
  const { activeCompanyId } = useShellConfig();
  const services = useServicesQuery(activeCompanyId ?? DEFAULT_BRANCH_ID);
  const serviceOptions = (services.data?.items ?? []).map((item) => ({ value: item.id, label: item.name }));

  const validate = (draft: CouponInput): FieldErrors => {
    const errors: FieldErrors = {};
    if (!CODE.test(draft.code.trim().toUpperCase())) errors.code = t("cfg.coupons.error.code");
    if (!(draft.value > 0) || (draft.type === "percent" && draft.value > 100)) errors.value = t("cfg.coupons.error.value");
    if (draft.validFrom && draft.validTo && draft.validTo < draft.validFrom) errors.validTo = t("cfg.coupons.error.dates");
    return errors;
  };

  const ruleOf = (item: CouponItem) =>
    [
      item.type === "percent" ? `${item.value} %` : formatMoney(item.value),
      item.firstVisitOnly ? t("cfg.coupons.firstVisitShort") : null,
      item.validTo ? t("cfg.coupons.until", { date: item.validTo }) : null,
      item.maxUses ? t("cfg.coupons.usesOf", { uses: item.uses, max: item.maxUses }) : t("cfg.coupons.uses", { count: item.uses }),
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <SettingsList<CouponItem, CouponInput>
      list="coupons"
      schema={couponItemSchema}
      icon="ticket"
      labelOf={(item) => item.code}
      renderRow={(item) => ({
        leading: <IconTile icon={<Ticket />} tone="primary" />,
        description: [ruleOf(item), item.description].filter(Boolean).join(" — "),
        meta: <StatusBadge status={item.active ? "active" : "inactive"} label={t(item.active ? "cfg.active" : "cfg.inactive")} />,
      })}
      emptyDraft={EMPTY}
      toDraft={({ code, type, value, description, firstVisitOnly, minAppointments, validFrom, validTo, serviceIds, maxUses, perClient, active }) => ({ code, type, value, description, firstVisitOnly, minAppointments, validFrom, validTo, serviceIds, maxUses, perClient, active })}
      validate={validate}
      messages={{
        count: (count) => t("cfg.coupons.count", { count }),
        add: t("cfg.coupons.add"),
        emptyTitle: t("cfg.coupons.emptyTitle"),
        emptyHint: t("cfg.coupons.emptyHint"),
        createTitle: t("cfg.coupons.add"),
        editTitle: t("cfg.coupons.editTitle"),
        formHint: t("cfg.coupons.formHint"),
        created: t("cfg.coupons.created"),
        saved: t("cfg.saved"),
        removed: t("cfg.coupons.removed"),
        removeTitle: (label) => t("cfg.removeTitle", { name: label }),
        removeHint: t("cfg.coupons.removeHint"),
        editAria: (label) => t("cfg.editAria", { name: label }),
        removeAria: (label) => t("cfg.removeAria", { name: label }),
      }}
      renderForm={({ draft, set, errors }) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("cfg.coupons.code")} required error={errors.code} description={t("cfg.coupons.codeHint")}>
              <Input value={draft.code} onChange={(event) => set("code", event.target.value.toUpperCase().replace(/\s+/g, ""))} aria-invalid={!!errors.code} autoComplete="off" className="uppercase" data-testid="coupons-code" />
            </Field>
            <Field label={t("cfg.coupons.type")} required>
              <ThemaTabs
                className="mb-0"
                fitContent
                tabs={[
                  { id: "percent", label: t("cfg.percent") },
                  { id: "amount", label: t("cfg.fixedAmount") },
                ]}
                activeTabId={draft.type}
                onTabChange={(id) => set("type", id as CouponInput["type"])}
              />
            </Field>
            <Field label={t("cfg.coupons.value")} required error={errors.value}>
              <NumberField value={Number.isFinite(draft.value) ? draft.value : null} onValueChange={(value) => set("value", value ?? Number.NaN)} min={0} max={draft.type === "percent" ? 100 : undefined} precision={2} prefix={draft.type === "amount" ? symbol : undefined} suffix={draft.type === "percent" ? "%" : undefined} aria-invalid={!!errors.value} data-testid="coupons-value" />
            </Field>
            <Field label={t("cfg.coupons.description")}>
              <Input value={draft.description} onChange={(event) => set("description", event.target.value)} autoComplete="off" />
            </Field>
            <Field label={t("cfg.coupons.validFrom")}>
              <Input type="date" value={draft.validFrom ?? ""} onChange={(event) => set("validFrom", event.target.value || null)} />
            </Field>
            <Field label={t("cfg.coupons.validTo")} error={errors.validTo}>
              <Input type="date" value={draft.validTo ?? ""} min={draft.validFrom ?? undefined} onChange={(event) => set("validTo", event.target.value || null)} aria-invalid={!!errors.validTo} />
            </Field>
            <Field label={t("cfg.coupons.maxUses")} description={t("cfg.coupons.noLimit")}>
              <NumberField value={draft.maxUses} onValueChange={(value) => set("maxUses", value && value >= 1 ? Math.floor(value) : null)} min={1} />
            </Field>
            <Field label={t("cfg.coupons.perClient")} description={t("cfg.coupons.noLimit")}>
              <NumberField value={draft.perClient} onValueChange={(value) => set("perClient", value && value >= 1 ? Math.floor(value) : null)} min={1} />
            </Field>
          </div>
          <Field label={t("cfg.coupons.services")} description={t("cfg.coupons.servicesHint")}>
            <MultiSelect options={serviceOptions} value={draft.serviceIds} onValueChange={(value) => set("serviceIds", value)} placeholder={t("cfg.coupons.allServices")} searchPlaceholder={t("cfg.search")} emptyMessage={t("cfg.noResults")} />
          </Field>
          <SwitchRow label={t("cfg.coupons.firstVisit")} hint={t("cfg.coupons.firstVisitHint")} checked={draft.firstVisitOnly} onCheckedChange={(checked) => set("firstVisitOnly", checked)} />
          <SwitchRow label={t("cfg.coupons.active")} hint={t("cfg.coupons.activeHint")} checked={draft.active} onCheckedChange={(checked) => set("active", checked)} testId="coupons-active" />
        </>
      )}
    />
  );
}
