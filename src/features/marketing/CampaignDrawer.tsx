import * as React from "react";
import { Eye, Send, Ticket, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";
import { useLocale } from "@/i18n";
import { describeError, isApiError } from "@/lib/api";
import { Field } from "@/components/forms";
import { ThemaTabs } from "@/components/navigation";
import { DrawerShell } from "@/components/overlays";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { GroupFilters } from "@/features/customers/groupFilter";
import { useSettingsList } from "@/features/settings/settingsQueries";
import { couponItemSchema } from "@/features/settings/settingsTypes";
import { useCampaignActions, useCampaignPreview, type CampaignDraft, type ExcludedCounts } from "./campaigns";

const MAX_BODY = 600;
const NO_COUPON = "none";
/** Las marcas del mensaje van tal cual: `t()` reemplazaría `{nombre}` si no se le pasan. */
const TOKENS = { nombre: "{nombre}", cupon: "{cupon}" };
const WHEN: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" };
const EXCLUDED_KEYS: Readonly<Record<keyof ExcludedCounts, AppMessageKey>> = {
  noConsent: "campaigns.excluded.noConsent",
  noPhone: "campaigns.excluded.noPhone",
  promoCap: "campaigns.excluded.promoCap",
  blocked: "campaigns.excluded.blocked",
};

export interface CampaignDrawerProps {
  onClose: () => void;
  /** A quién: un grupo guardado o los filtros de la lista. */
  groupId?: string | null;
  filters?: GroupFilters;
  /** Cómo se llama a quién va («VIP con cera», «Le toca volver»). */
  audienceLabel: string;
}

/**
 * Una campaña a un grupo por WhatsApp: el texto (con {nombre} y {cupon}), un cupón, cuándo, y antes de mandar la vista
 * previa — a cuántos sí, a quiénes no y por qué, cómo lo lee un cliente y lo que costaría —. Se manda solo desde la
 * última vista previa: si el texto cambia, hay que volver a mirarla.
 */
export function CampaignDrawer({ onClose, groupId = null, filters, audienceLabel }: CampaignDrawerProps) {
  const t = useAppT();
  const { formatDate, current } = useLocale();
  const coupons = useSettingsList("coupons", couponItemSchema);
  const preview = useCampaignPreview();
  const { create } = useCampaignActions();
  const [name, setName] = React.useState(audienceLabel);
  const [body, setBody] = React.useState(() => t("campaigns.defaultBody", TOKENS));
  const [coupon, setCoupon] = React.useState<string | null>(null);
  const [when, setWhen] = React.useState<"now" | "later">("now");
  const [scheduleAt, setScheduleAt] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const draft: CampaignDraft = { groupId, filters, body: body.trim(), couponCode: coupon };
  const draftKey = JSON.stringify(draft);
  const [previewedKey, setPreviewedKey] = React.useState<string | null>(null);
  const fresh = previewedKey === draftKey && preview.data !== undefined;
  const money = (amount: number, currency: string) => new Intl.NumberFormat(current.intl, { style: "currency", currency, minimumFractionDigits: 2 }).format(amount);

  const fieldErrors = (error: unknown) => {
    const fields = isApiError(error) ? error.fieldErrors : undefined;
    if (fields) setErrors(Object.fromEntries(Object.entries(fields).map(([key, messages]) => [key, messages[0] ?? ""])));
    else toast.error(describeError(error).title, { description: describeError(error).description });
  };

  const look = () => {
    setErrors({});
    preview.mutate(draft, { onSuccess: () => setPreviewedKey(draftKey), onError: fieldErrors });
  };

  const send = () => {
    setErrors({});
    create.mutate(
      { ...draft, name: name.trim(), scheduleAt: when === "later" && scheduleAt ? new Date(scheduleAt).toISOString() : null },
      {
        onSuccess: (campaign) => {
          toast.success(t("campaigns.sent", { count: campaign.recipients }), { description: campaign.name });
          onClose();
        },
        onError: fieldErrors,
      }
    );
  };

  const insert = (token: string) => setBody((current) => `${current}${current.endsWith(" ") || current === "" ? "" : " "}${token}`);
  const data = preview.data;

  return (
    <DrawerShell
      open
      onOpenChange={(open) => !open && onClose()}
      size="lg"
      title={t("campaigns.newTitle")}
      description={t("campaigns.newHint", { audience: audienceLabel })}
      actions={
        <>
          <Button type="button" variant="outline" onClick={look} disabled={preview.isPending} data-testid="campaign-preview">
            <Eye /> {t("campaigns.preview")}
          </Button>
          <Button type="button" onClick={send} disabled={!fresh || !data || data.eligible === 0 || create.isPending || name.trim().length < 2} data-testid="campaign-send">
            <Send /> {data && fresh ? t("campaigns.send", { count: data.eligible }) : t("campaigns.sendNeedsPreview")}
          </Button>
        </>
      }
    >
      <div className="space-y-5" data-testid="campaign-drawer">
        <Field label={t("campaigns.name")} required error={errors.name}>
          <Input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} data-testid="campaign-name" />
        </Field>
        <Field label={t("campaigns.body")} required error={errors.body} description={t("campaigns.bodyHint", { ...TOKENS, max: MAX_BODY })}>
          <Textarea value={body} onChange={(event) => setBody(event.target.value)} rows={4} maxLength={MAX_BODY} data-testid="campaign-body" />
        </Field>
        <div className="-mt-3 flex flex-wrap gap-1.5">
          <Button type="button" size="xs" variant="outline" onClick={() => insert("{nombre}")}>
            <UserRound /> {"{nombre}"}
          </Button>
          <Button type="button" size="xs" variant="outline" onClick={() => insert("{cupon}")} disabled={!coupon}>
            <Ticket /> {"{cupon}"}
          </Button>
        </div>
        <div className="grid gap-4">
          <Field label={t("campaigns.coupon")} error={errors.couponCode}>
            <Select value={coupon ?? NO_COUPON} onValueChange={(value) => setCoupon(value === NO_COUPON ? null : value)}>
              <SelectTrigger data-testid="campaign-coupon">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_COUPON}>{t("campaigns.noCoupon")}</SelectItem>
                {(coupons.data?.items ?? []).filter((item) => item.active).map((item) => (
                  <SelectItem key={item.id} value={item.code}>
                    {item.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("campaigns.when")} error={errors.scheduleAt}>
            <ThemaTabs
              className="mb-0"
              fitContent
              tabs={[
                { id: "now", label: t("campaigns.whenNow") },
                { id: "later", label: t("campaigns.whenLater") },
              ]}
              activeTabId={when}
              onTabChange={(id) => setWhen(id as "now" | "later")}
            />
          </Field>
        </div>
        {when === "later" && (
          <Field label={t("campaigns.scheduleAt")}>
            <Input type="datetime-local" value={scheduleAt} onChange={(event) => setScheduleAt(event.target.value)} />
          </Field>
        )}
        {errors.filters && (
          <Text size="sm" tone="negative" role="alert">
            {errors.filters}
          </Text>
        )}

        {data && (
          <section className={fresh ? "space-y-4 rounded-2xl border border-border/60 bg-surface-subtle p-4" : "space-y-4 rounded-2xl border border-dashed border-border p-4 opacity-60"} aria-label={t("campaigns.preview")} data-testid="campaign-preview-card">
            {!fresh && <Text size="sm" tone="muted">{t("campaigns.stale")}</Text>}
            <dl className="grid grid-cols-3 gap-3 text-center">
              <div>
                <dt className="text-xs text-text-muted">{t("campaigns.audience")}</dt>
                <dd className="text-lg font-semibold tabular-nums">{data.audience}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">{t("campaigns.eligible")}</dt>
                <dd className="text-lg font-semibold tabular-nums text-status-positive" data-testid="campaign-eligible">
                  {data.eligible}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">{t("campaigns.cost")}</dt>
                <dd className="text-lg font-semibold tabular-nums" data-testid="campaign-cost">
                  {money(data.cost.amount, data.cost.currency)}
                </dd>
              </div>
            </dl>
            <ul className="space-y-1 text-sm">
              {(Object.keys(EXCLUDED_KEYS) as (keyof ExcludedCounts)[])
                .filter((key) => data.excluded[key] > 0)
                .map((key) => (
                  <li key={key} className="flex justify-between gap-3 text-text-secondary">
                    <span>{t(EXCLUDED_KEYS[key])}</span>
                    <span className="tabular-nums">{data.excluded[key]}</span>
                  </li>
                ))}
            </ul>
            {data.sample && (
              <figure className="space-y-1">
                <figcaption className="text-xs text-text-muted">{t("campaigns.sampleFor", { name: data.sample.name })}</figcaption>
                <blockquote className="whitespace-pre-line rounded-2xl rounded-tl-sm bg-surface px-4 py-3 text-sm text-text-primary shadow-card" data-testid="campaign-sample">
                  {data.sample.text}
                </blockquote>
              </figure>
            )}
            <Text size="xs" tone="muted">
              {[data.firstSendAt ? t("campaigns.firstSend", { when: formatDate(new Date(data.firstSendAt), WHEN) }) : null, t("campaigns.costNote")].filter(Boolean).join(" ")}
            </Text>
          </section>
        )}
      </div>
    </DrawerShell>
  );
}
