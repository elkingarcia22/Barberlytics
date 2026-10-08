import * as React from "react";
import { useSearchParams } from "react-router";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { Field, NumberField } from "@/components/forms";
import { ThemaTabs } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Text } from "@/components/typography";
import { SettingsCard, SettingsDocument, SwitchRow, type FieldErrors } from "../SettingsFormParts";
import { bookingSchema, type BookingSettings as Booking } from "../settingsTypes";
import { buildBookingUrl, renderPolicy, widgetSnippet } from "./bookingUtils";
import { BookingFunnelCard } from "./BookingFunnelCard";

const SLOT_INTERVALS: readonly number[] = [10, 15, 20, 30, 45, 60];
const WAIT_MINUTES: readonly number[] = [5, 10, 15, 20, 30, 45, 60];
const CANCEL_HOURS: readonly number[] = [1, 2, 3, 6, 12, 24, 48];
const VIEWS = ["reglas", "enlaces"] as const;
type View = (typeof VIEWS)[number];

/**
 * Reservas online, en dos vistas: las **reglas** —con cuánta anticipación se
 * reserva, cuándo se puede cancelar, qué se le dice al cliente— y los
 * **enlaces y widgets** —lo que se copia para poner la reserva, el portal del
 * cliente y el kiosco en el sitio de la barbería—. En producción el portal
 * era un ajuste aparte; es la misma pregunta: cómo llega el cliente.
 */
export function BookingSettings() {
  const t = useAppT();
  const [searchParams, setSearchParams] = useSearchParams();
  const param = searchParams.get("vista");
  const view: View = VIEWS.find((item) => item === param) ?? "reglas";
  const pickView = (value: string) =>
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);
        if (value === "reglas") params.delete("vista");
        else params.set("vista", value);
        return params;
      },
      { replace: true }
    );

  const validate = (draft: Booking): FieldErrors => {
    const errors: FieldErrors = {};
    if (!(draft.minNotice >= 0)) errors.minNotice = t("cfg.booking.error.minNotice");
    if (!(draft.lateFeePercent >= 0 && draft.lateFeePercent <= 100)) errors.lateFeePercent = t("cfg.booking.error.lateFee");
    if (!(draft.maxCancellations >= 0)) errors.maxCancellations = t("cfg.booking.error.maxCancellations");
    if (draft.surge.enabled && !(draft.surge.occupancy >= 1 && draft.surge.occupancy <= 100)) errors.surge = t("cfg.booking.error.surge");
    if (!draft.paymentMethods.card && !draft.paymentMethods.payAtShop) errors.paymentMethods = t("cfg.booking.error.paymentMethods");
    if (draft.deposit.enabled && !(draft.deposit.percent >= 1 && draft.deposit.percent <= 100)) errors.deposit = t("cfg.booking.error.deposit");
    return errors;
  };

  return (
    <SettingsDocument section="booking" schema={bookingSchema} validate={validate}>
      {({ draft, set, errors }) => (
        <>
          <ThemaTabs
            className="mb-0"
            variant="page"
            fitContent
            tabs={[
              { id: "reglas", label: t("cfg.booking.view.rules") },
              { id: "enlaces", label: t("cfg.booking.view.links") },
            ]}
            activeTabId={view}
            onTabChange={pickView}
          />
          {view === "reglas" ? <Rules draft={draft} set={set} errors={errors} /> : <Links links={draft.links} />}
        </>
      )}
    </SettingsDocument>
  );
}

interface RulesProps {
  draft: Booking;
  set: <K extends keyof Booking>(key: K, value: Booking[K]) => void;
  errors: FieldErrors;
}

function Rules({ draft, set, errors }: RulesProps) {
  const t = useAppT();
  const number = (value: number) => (Number.isFinite(value) ? value : null);
  return (
    <>
      <SettingsCard title={t("cfg.booking.availability")} description={t("cfg.booking.availabilityHint")}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("cfg.booking.minNotice")} required error={errors.minNotice}>
            <NumberField value={number(draft.minNotice)} onValueChange={(value) => set("minNotice", value ?? Number.NaN)} min={0} aria-invalid={!!errors.minNotice} data-testid="booking-min-notice" />
          </Field>
          <Field label={t("cfg.booking.unit")} required>
            <Select value={draft.minNoticeUnit} onValueChange={(value) => set("minNoticeUnit", value as Booking["minNoticeUnit"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minutes">{t("cfg.unit.minutes")}</SelectItem>
                <SelectItem value="hours">{t("cfg.unit.hours")}</SelectItem>
                <SelectItem value="days">{t("cfg.unit.days")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("cfg.booking.slotInterval")} description={t("cfg.booking.slotIntervalHint")}>
            <Select value={String(draft.slotInterval)} onValueChange={(value) => set("slotInterval", Number(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SLOT_INTERVALS.map((minutes) => (
                  <SelectItem key={minutes} value={String(minutes)}>
                    {t("cfg.minutes", { count: minutes })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </SettingsCard>

      <SettingsCard title={t("cfg.booking.cancel")} description={t("cfg.booking.cancelHint")}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("cfg.booking.cancelWindow")}>
            <Select value={String(draft.cancelHours)} onValueChange={(value) => set("cancelHours", Number(value))}>
              <SelectTrigger data-testid="booking-cancel-hours">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CANCEL_HOURS.map((hours) => (
                  <SelectItem key={hours} value={String(hours)}>
                    {t("cfg.booking.upToHours", { count: hours })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("cfg.booking.lateFee")} required error={errors.lateFeePercent}>
            <NumberField value={number(draft.lateFeePercent)} onValueChange={(value) => set("lateFeePercent", value ?? Number.NaN)} min={0} max={100} suffix="%" aria-invalid={!!errors.lateFeePercent} />
          </Field>
          <Field label={t("cfg.booking.maxCancellations")} required error={errors.maxCancellations} description={t("cfg.booking.maxCancellationsHint")}>
            <NumberField value={number(draft.maxCancellations)} onValueChange={(value) => set("maxCancellations", value ?? Number.NaN)} min={0} max={99} aria-invalid={!!errors.maxCancellations} />
          </Field>
        </div>
        <Field label={t("cfg.booking.policy")} description={t("cfg.booking.policyHint")}>
          <Textarea value={draft.policy} onChange={(event) => set("policy", event.target.value)} rows={6} data-testid="booking-policy" />
        </Field>
        <div className="rounded-lg border border-border/60 p-3">
          <Text variant="label">{t("cfg.booking.policyPreview")}</Text>
          <p className="mt-1 whitespace-pre-line text-sm text-text-secondary" data-testid="booking-policy-preview">
            {renderPolicy(draft.policy, { cancel: t("cfg.hours", { count: draft.cancelHours }), fee: String(draft.lateFeePercent), max: String(draft.maxCancellations) })}
          </p>
        </div>
      </SettingsCard>

      <SettingsCard title={t("cfg.booking.payment")} description={t("cfg.booking.paymentHint")}>
        <SwitchRow label={t("cfg.booking.payCard")} hint={t("cfg.booking.payCardHint")} checked={draft.paymentMethods.card} onCheckedChange={(checked) => set("paymentMethods", { ...draft.paymentMethods, card: checked })} />
        <SwitchRow label={t("cfg.booking.payAtShop")} hint={t("cfg.booking.payAtShopHint")} checked={draft.paymentMethods.payAtShop} onCheckedChange={(checked) => set("paymentMethods", { ...draft.paymentMethods, payAtShop: checked })} testId="booking-pay-at-shop" />
        {/* El anticipo solo tiene sentido si se puede pagar en la barbería y cobrar con tarjeta. */}
        {draft.paymentMethods.payAtShop && draft.paymentMethods.card && (
          <SwitchRow label={t("cfg.booking.deposit")} hint={t("cfg.booking.depositHint")} checked={draft.deposit.enabled} onCheckedChange={(checked) => set("deposit", { ...draft.deposit, enabled: checked })} testId="booking-deposit">
            {draft.deposit.enabled && (
              <div className="mt-3 flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={t("cfg.booking.depositPercent")} error={errors.deposit}>
                    <NumberField size="sm" value={number(draft.deposit.percent)} onValueChange={(value) => set("deposit", { ...draft.deposit, percent: value ?? Number.NaN })} min={1} max={100} suffix="%" />
                  </Field>
                  <Field label={t("cfg.booking.depositNoShows")} description={t("cfg.booking.depositNoShowsHint")}>
                    <NumberField size="sm" value={draft.deposit.afterNoShows} onValueChange={(value) => set("deposit", { ...draft.deposit, afterNoShows: Math.max(0, value ?? 0) })} min={0} max={10} />
                  </Field>
                </div>
                <SwitchRow label={t("cfg.booking.depositNew")} hint={t("cfg.booking.depositNewHint")} checked={draft.deposit.newClients} onCheckedChange={(checked) => set("deposit", { ...draft.deposit, newClients: checked })} />
              </div>
            )}
          </SwitchRow>
        )}
        {errors.paymentMethods && (
          <p className="text-sm font-medium text-status-negative" role="alert">
            {errors.paymentMethods}
          </p>
        )}
      </SettingsCard>

      <SettingsCard title={t("cfg.booking.surge")} description={t("cfg.booking.surgeHint")}>
        <SwitchRow label={t("cfg.booking.surgeEnable")} hint={t("cfg.booking.surgeEnableHint")} checked={draft.surge.enabled} onCheckedChange={(checked) => set("surge", { ...draft.surge, enabled: checked })} testId="booking-surge">
          {draft.surge.enabled && (
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Field label={t("cfg.booking.surgeOccupancy")} error={errors.surge}>
                <NumberField size="sm" value={number(draft.surge.occupancy)} onValueChange={(value) => set("surge", { ...draft.surge, occupancy: value ?? Number.NaN })} min={1} max={100} suffix="%" />
              </Field>
              <Field label={t("cfg.booking.surgeType")}>
                <ThemaTabs
                  className="mb-0"
                  fitContent
                  tabs={[
                    { id: "percent", label: t("cfg.percent") },
                    { id: "amount", label: t("cfg.fixedAmount") },
                  ]}
                  activeTabId={draft.surge.increaseType}
                  onTabChange={(id) => set("surge", { ...draft.surge, increaseType: id as Booking["surge"]["increaseType"] })}
                />
              </Field>
              <Field label={t("cfg.booking.surgeIncrease")}>
                <NumberField size="sm" value={number(draft.surge.increase)} onValueChange={(value) => set("surge", { ...draft.surge, increase: value ?? Number.NaN })} min={0} prefix={draft.surge.increaseType === "amount" ? "$" : undefined} suffix={draft.surge.increaseType === "percent" ? "%" : undefined} />
              </Field>
            </div>
          )}
        </SwitchRow>
      </SettingsCard>

      <SettingsCard title={t("cfg.booking.waitlist")} description={t("cfg.booking.waitlistHint")}>
        <div className="grid gap-4 sm:grid-cols-2">
          {(["acceptMinutes", "arriveMinutes"] as const).map((key) => (
            <Field key={key} label={t(key === "acceptMinutes" ? "cfg.booking.waitAccept" : "cfg.booking.waitArrive")}>
              <Select value={String(draft.waitlist[key])} onValueChange={(value) => set("waitlist", { ...draft.waitlist, [key]: Number(value) })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WAIT_MINUTES.map((minutes) => (
                    <SelectItem key={minutes} value={String(minutes)}>
                      {t("cfg.minutes", { count: minutes })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ))}
        </div>
      </SettingsCard>
    </>
  );
}

function Links({ links }: { links: Booking["links"] }) {
  const t = useAppT();
  const [utm, setUtm] = React.useState({ source: "", medium: "", campaign: "" });
  const bookingUrl = buildBookingUrl(links.bookingUrl, utm);
  return (
    <>
      <BookingFunnelCard />
      <SettingsCard title={t("cfg.booking.link")} description={t("cfg.booking.linkHint")}>
        <CopyLine label={t("cfg.booking.linkLabel")} value={bookingUrl} testId="booking-link" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label={t("cfg.booking.utmSource")}>
            <Input value={utm.source} onChange={(event) => setUtm({ ...utm, source: event.target.value })} placeholder="instagram" autoComplete="off" data-testid="booking-utm-source" />
          </Field>
          <Field label={t("cfg.booking.utmMedium")}>
            <Input value={utm.medium} onChange={(event) => setUtm({ ...utm, medium: event.target.value })} placeholder="social" autoComplete="off" />
          </Field>
          <Field label={t("cfg.booking.utmCampaign")}>
            <Input value={utm.campaign} onChange={(event) => setUtm({ ...utm, campaign: event.target.value })} placeholder="verano" autoComplete="off" />
          </Field>
        </div>
        <Text variant="caption">{t("cfg.booking.utmHint")}</Text>
      </SettingsCard>

      <SettingsCard title={t("cfg.booking.widget")} description={t("cfg.booking.widgetHint")}>
        <CopyBlock title={t("cfg.booking.widgetFloating")} hint={t("cfg.booking.widgetFloatingHint")} code={widgetSnippet(links, { widget: "booking", mode: "floating" })} />
        <CopyBlock title={t("cfg.booking.widgetTrigger")} hint={t("cfg.booking.widgetTriggerHint")} code={widgetSnippet(links, { widget: "booking", mode: "floating", trigger: "#reservar" })} />
        <CopyBlock title={t("cfg.booking.widgetInline")} hint={t("cfg.booking.widgetInlineHint")} code={widgetSnippet(links, { widget: "booking", mode: "inline" })} />
        <Text variant="caption">{t("cfg.booking.widgetOnce")}</Text>
      </SettingsCard>

      <SettingsCard title={t("cfg.booking.portal")} description={t("cfg.booking.portalHint")}>
        <CopyLine label={t("cfg.booking.portalLink")} value={links.portalUrl} />
        <CopyBlock title={t("cfg.booking.portalInline")} hint={t("cfg.booking.portalInlineHint")} code={widgetSnippet(links, { widget: "appointments", mode: "inline", homeUrl: "/" })} />
        <CopyBlock title={t("cfg.booking.portalTrigger")} hint={t("cfg.booking.portalTriggerHint")} code={widgetSnippet(links, { widget: "appointments", mode: "floating", trigger: "#mis-citas" })} />
      </SettingsCard>

      <SettingsCard title={t("cfg.booking.frontDesk")} description={t("cfg.booking.frontDeskHint")}>
        <CopyLine label={t("cfg.booking.frontDeskLink")} value={links.frontDeskUrl} />
      </SettingsCard>
    </>
  );
}

function useCopy() {
  const t = useAppT();
  const [copied, setCopied] = React.useState(false);
  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(t("cfg.copied"));
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("cfg.copyFailed"));
    }
  };
  return { copied, copy };
}

function CopyLine({ label, value, testId }: { label: string; value: string; testId?: string }) {
  const t = useAppT();
  const { copied, copy } = useCopy();
  return (
    <div>
      <Text variant="label">{label}</Text>
      <div className="mt-1.5 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-md border border-border/60 bg-surface-subtle px-3 py-2 font-mono text-xs text-text-secondary" data-testid={testId}>
          {value}
        </code>
        <Button type="button" variant="outline" size="sm" onClick={() => void copy(value)}>
          {copied ? <Check /> : <Copy />} {t("cfg.copy")}
        </Button>
      </div>
    </div>
  );
}

function CopyBlock({ title, hint, code }: { title: string; hint: string; code: string }) {
  const t = useAppT();
  const { copied, copy } = useCopy();
  return (
    <div className="rounded-lg border border-border/60 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Text variant="label">{title}</Text>
          <Text variant="muted" className="text-xs">
            {hint}
          </Text>
        </div>
        <Button type="button" variant="outline" size="xs" onClick={() => void copy(code)}>
          {copied ? <Check /> : <Copy />} {t("cfg.copy")}
        </Button>
      </div>
      <pre className="mt-2 overflow-x-auto rounded-md bg-surface-subtle p-3 font-mono text-xs leading-relaxed text-text-secondary">{code}</pre>
    </div>
  );
}
