import * as React from "react";
import { Banknote, Check, ChevronRight, CreditCard, Gift, Link2, Smartphone, Split, SquareStack, X } from "lucide-react";
import { Chip } from "@/components/ai-interaction";
import { Field, NumberField } from "@/components/forms";
import { OptionTile, SegmentedControl } from "@/components/selection";
import { Text } from "@/components/typography";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";
import type { ModelContext } from "../calendarModel";
import type { PaymentPart } from "../types";
import { SendToClient } from "../appointmentPanel/SendToClient";
import type { SendTarget } from "../appointmentPanel/sendTarget";
import type { CheckoutController, PayChoice } from "./useCheckout";

/**
 * «¿Cómo paga?», con las tarjetas del panel de la cita: una por forma de pago,
 * con lo que se sabe de ella debajo del nombre. Efectivo y tarjeta se eligen
 * y su detalle (el cambio, el datáfono) se abre en su sitio; lo que pide más
 * pasos —el link de pago, mixto, en partes y la tarjeta de regalo del
 * cliente— entra a su propia página del panel, con «Volver» y un solo botón.
 */

export type PayPage = "link" | "mixed" | "parts" | "gift";

type MethodId = PayChoice | "gift";
const ICONS: Record<MethodId, React.ComponentType<{ className?: string }>> = { cash: Banknote, card: CreditCard, link: Link2, gift: Gift, mixed: Split, parts: SquareStack };
const METHODS: readonly MethodId[] = ["cash", "card", "link", "gift", "mixed", "parts"];
/** Las que entran a su página en vez de abrirse en su sitio. */
const PAGES: Partial<Record<MethodId, PayPage>> = { link: "link", gift: "gift", mixed: "mixed", parts: "parts" };
const PART_COUNTS = [2, 3, 4] as const;

const ROW =
  "group flex min-h-16 w-full items-center gap-3 rounded-xl border bg-surface px-3 py-2.5 text-left shadow-xs outline-none transition-[border-color,background-color] duration-fast hover:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function PayMethods({ checkout, ctx, onOpenPage }: { checkout: CheckoutController; ctx: ModelContext; onOpenPage: (page: PayPage) => void }) {
  const { t } = checkout;
  const detailOf = (method: MethodId): string => {
    if (method === "gift") return checkout.gift ? t("calendar.checkout.giftCard.row", { code: checkout.gift.code, amount: ctx.formatMoney(checkout.giftApplied) }) : t("calendar.checkout.pay.giftHint");
    if (method === "link" && checkout.payChoice === "link" && checkout.linkSent) return t("calendar.checkout.link.sentRow");
    if (method === "mixed" && checkout.payChoice === "mixed") return t("calendar.checkout.pay.mixedRow", { cash: ctx.formatMoney(checkout.cash), card: ctx.formatMoney(Math.max(0, checkout.total - checkout.cash)) });
    if (method === "parts" && checkout.payChoice === "parts" && checkout.parts) return Math.abs(checkout.partsLeft) <= 0.01 ? t("calendar.checkout.pay.partsRowOk", { count: checkout.parts.length }) : t("calendar.checkout.pay.partsRowLeft", { count: checkout.parts.length, amount: ctx.formatMoney(Math.abs(checkout.partsLeft)) });
    return t(`calendar.checkout.pay.${method}Hint`);
  };
  return (
    <div className="flex flex-col gap-2" data-testid="checkout-pay-step">
      <div role="radiogroup" aria-label={t("calendar.checkout.method")} className="flex flex-col gap-2" data-testid="checkout-methods">
        {METHODS.map((method) => {
          const Icon = ICONS[method];
          const page = PAGES[method];
          const selected = method === "gift" ? Boolean(checkout.gift) : checkout.payChoice === method;
          return (
            <button
              key={method}
              type="button"
              role={method === "gift" ? "checkbox" : "radio"}
              aria-checked={selected}
              onClick={() => {
                if (method !== "gift") checkout.choosePay(method);
                if (page) onOpenPage(page);
              }}
              className={cn(ROW, selected ? "border-primary/60 bg-[linear-gradient(hsl(var(--primary)/0.06),hsl(var(--primary)/0.06))]" : "border-input")}
              data-testid={`checkout-method-${method}`}
            >
              <IconTile size="md" shape="circle" tone={selected ? "primary" : "neutral"} icon={<Icon />} />
              <span className="flex min-w-0 flex-1 flex-col">
                <Text as="span" weight="medium">
                  {t(`calendar.checkout.pay.${method}`)}
                </Text>
                <Text as="span" size="xs" tone="muted" truncate>
                  {detailOf(method)}
                </Text>
              </span>
              {page ? <ChevronRight className="size-4 shrink-0 text-text-muted" aria-hidden="true" /> : selected && <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
      {/* Lo de la elegida que cabe aquí: el cambio del efectivo o el datáfono. */}
      {checkout.payChoice === "cash" && <CashDetail checkout={checkout} ctx={ctx} />}
      {checkout.payChoice === "card" && <DevicePicker checkout={checkout} value={checkout.deviceId} onChange={checkout.setDeviceId} />}
      {checkout.surcharge > 0 && (
        <Text size="xs" tone="muted" data-testid="checkout-surcharge">
          {t("calendar.checkout.surchargeHint", { amount: ctx.formatMoney(checkout.surcharge) })}
        </Text>
      )}
    </div>
  );
}

/** El contenido de cada página de pago, con su único botón principal. */
export function PayPageContent({ page, checkout, ctx, target, onDone }: { page: PayPage; checkout: CheckoutController; ctx: ModelContext; target: SendTarget | null; onDone: () => void }) {
  const { t } = checkout;
  if (page === "link") return <LinkPage checkout={checkout} ctx={ctx} target={target} onDone={onDone} />;
  const done = (
    <Button type="button" size="lg" className="w-full" onClick={onDone} disabled={page === "parts" && Math.abs(checkout.partsLeft) > 0.01} data-testid="checkout-page-done">
      {t("calendar.checkout.pageDone")}
    </Button>
  );
  return (
    <div className="flex flex-col gap-5" data-testid={`checkout-page-${page}`}>
      <Text tone="secondary">{t(page === "gift" ? "calendar.checkout.pay.giftLead" : `calendar.checkout.pay.${page}Hint`)}</Text>
      {page === "gift" && <GiftRedeem checkout={checkout} ctx={ctx} />}
      {page === "mixed" && <MixedDetail checkout={checkout} ctx={ctx} />}
      {page === "parts" && <PartsDetail checkout={checkout} ctx={ctx} />}
      {done}
    </div>
  );
}

/** Pagar con la tarjeta de regalo del cliente: el código, su saldo y cuánto cubre. */
function GiftRedeem({ checkout, ctx }: { checkout: CheckoutController; ctx: ModelContext }) {
  const { t } = checkout;
  const [code, setCode] = React.useState("");
  if (checkout.gift) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-input bg-surface px-3 py-2.5" data-testid="checkout-gift-applied">
        <IconTile size="md" shape="circle" tone="positive" icon={<Gift />} />
        <span className="flex min-w-0 flex-1 flex-col">
          <Text weight="medium">{checkout.gift.code}</Text>
          <Text size="xs" tone="muted" tabular>
            {t("calendar.checkout.giftCard.applied", { amount: ctx.formatMoney(checkout.giftApplied), left: ctx.formatMoney(Math.max(0, checkout.gift.balance - checkout.giftApplied)) })}
          </Text>
        </span>
        <Button size="icon-xs" variant="ghost" aria-label={t("calendar.checkout.giftCard.remove")} onClick={checkout.removeGift}>
          <X />
        </Button>
      </div>
    );
  }
  return (
    <form
      className="flex gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        void checkout.applyGift(code);
      }}
    >
      <Input value={code} onChange={(event) => setCode(event.target.value)} placeholder={t("calendar.checkout.giftCard.placeholder")} aria-label={t("calendar.checkout.giftCard.title")} className="flex-1 [&:not(:placeholder-shown)]:uppercase" data-testid="checkout-gift-code" />
      <Button type="submit" variant="outline" disabled={!code.trim() || checkout.checkingGift}>
        {t("calendar.checkout.giftCard.apply")}
      </Button>
    </form>
  );
}

function CashDetail({ checkout, ctx }: { checkout: CheckoutController; ctx: ModelContext }) {
  const { t, change } = checkout;
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-input bg-surface p-3">
      <Field label={t("calendar.checkout.received")}>
        <NumberField value={checkout.received} onValueChange={checkout.setReceived} min={0} step={1} prefix="$" size="sm" data-testid="checkout-received" />
      </Field>
      {change !== null && (
        <Text size="sm" tone={change < 0 ? "negative" : "secondary"} data-testid="checkout-change">
          {change < 0 ? t("calendar.checkout.missing", { amount: ctx.formatMoney(-change) }) : t("calendar.checkout.changeHint", { amount: ctx.formatMoney(change) })}
        </Text>
      )}
    </div>
  );
}

/** Con qué datáfono se pasa la tarjeta (los de Configuración). */
function DevicePicker({ checkout, value, onChange }: { checkout: CheckoutController; value: string | null | undefined; onChange: (id: string) => void }) {
  const { t, devices } = checkout;
  if (devices.length === 0) {
    return (
      <Alert>
        <Smartphone />
        <AlertDescription>{t("calendar.checkout.device.none")}</AlertDescription>
      </Alert>
    );
  }
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-input bg-surface p-3" data-testid="checkout-devices">
      <Text size="sm" weight="medium">
        {t("calendar.checkout.device.title")}
      </Text>
      <div role="radiogroup" aria-label={t("calendar.checkout.device.title")} className="grid grid-cols-2 gap-2">
        {devices.map((device) => (
          <OptionTile key={device.id} compact option={{ value: device.id, label: device.name, description: `TPN ${device.tpn}`, icon: Smartphone }} selected={value === device.id} onSelect={onChange} />
        ))}
      </div>
    </div>
  );
}

/** El link de pago, como el recibo: Correo y SMS para marcar y «Enviar». Cuando pague, se registra en el cobro. */
function LinkPage({ checkout, ctx, target, onDone }: { checkout: CheckoutController; ctx: ModelContext; target: SendTarget | null; onDone: () => void }) {
  const { t, client } = checkout;
  const url = `https://pagar.barberlytics.com/${(client?.id ?? "c").slice(-6)}-${Math.round(checkout.total * 100)}`;
  const text = t("calendar.checkout.link.message", { name: client?.name.split(" ")[0] ?? "", amount: ctx.formatMoney(checkout.total), url });
  return (
    <div className="flex flex-col gap-4" data-testid="checkout-link">
      {checkout.linkSent && (
        <Alert variant="info">
          <ThemaIcon name="clock" />
          <AlertDescription>{t("calendar.checkout.link.waiting", { amount: ctx.formatMoney(checkout.total) })}</AlertDescription>
        </Alert>
      )}
      {target && (target.email || target.phone) ? (
        <SendToClient
          target={target}
          kind="payLink"
          lead={t("calendar.checkout.link.lead", { amount: ctx.formatMoney(checkout.total) })}
          body={text}
          onSent={() => {
            checkout.markLinkSent();
            onDone();
          }}
        />
      ) : (
        <Text size="sm" tone="muted">
          {t("calendar.checkout.link.noContact")}
        </Text>
      )}
    </div>
  );
}

function MixedDetail({ checkout, ctx }: { checkout: CheckoutController; ctx: ModelContext }) {
  const { t } = checkout;
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-input bg-surface p-3">
      <Field label={t("calendar.checkout.splitCash")}>
        <NumberField value={checkout.cashPart} onValueChange={checkout.setCashPart} min={0} step={1} prefix="$" size="sm" data-testid="checkout-split-cash" />
      </Field>
      <Text size="sm" tone="secondary" data-testid="checkout-split-card">
        {t("calendar.checkout.splitCard", { amount: ctx.formatMoney(Math.max(0, checkout.total - checkout.cash)) })}
      </Text>
    </div>
  );
}

/** En partes: cuántas, y de cada una el método y el monto (empiezan iguales). */
function PartsDetail({ checkout, ctx }: { checkout: CheckoutController; ctx: ModelContext }) {
  const { t, parts } = checkout;
  if (!parts) return null;
  return (
    <div className="flex flex-col gap-3" data-testid="checkout-parts">
      <div className="flex items-center gap-2">
        <Text size="sm" weight="medium">
          {t("calendar.checkout.parts.count")}
        </Text>
        <div className="flex gap-1.5">
          {PART_COUNTS.map((count) => (
            <Chip key={count} size="sm" label={String(count)} selected={parts.length === count} onClick={() => checkout.setPartCount(count)} />
          ))}
        </div>
      </div>
      {parts.map((part, index) => (
        <div key={index} className="flex flex-col gap-2 rounded-xl border border-input bg-surface p-3" data-testid="checkout-part">
          <div className="flex items-center gap-2">
            <Text size="sm" weight="medium" className="flex-1">
              {t("calendar.checkout.parts.part", { index: index + 1 })}
            </Text>
            <SegmentedControl
              size="sm"
              value={part.method}
              onChange={(method) => checkout.updatePart(index, { method: method as PaymentPart["method"], deviceId: method === "card" ? (part.deviceId ?? checkout.devices[0]?.id) : undefined })}
              options={(["cash", "card", "link"] as const).map((method) => ({ value: method, label: t(`calendar.checkout.pay.${method}`) }))}
            />
          </div>
          <NumberField value={part.amount} onValueChange={(amount) => checkout.updatePart(index, { amount: amount ?? 0 })} min={0} step={1} prefix="$" size="sm" aria-label={t("calendar.checkout.parts.part", { index: index + 1 })} />
          {part.method === "card" && checkout.devices.length > 1 && (
            <SegmentedControl size="sm" value={part.deviceId} onChange={(deviceId) => checkout.updatePart(index, { deviceId })} options={checkout.devices.map((device) => ({ value: device.id, label: device.name }))} />
          )}
        </div>
      ))}
      <Text size="sm" tone={Math.abs(checkout.partsLeft) > 0.01 ? "warning" : "positive"} data-testid="checkout-parts-left">
        {Math.abs(checkout.partsLeft) <= 0.01 ? t("calendar.checkout.parts.ok") : checkout.partsLeft > 0 ? t("calendar.checkout.parts.missing", { amount: ctx.formatMoney(checkout.partsLeft) }) : t("calendar.checkout.parts.over", { amount: ctx.formatMoney(-checkout.partsLeft) })}
      </Text>
    </div>
  );
}
