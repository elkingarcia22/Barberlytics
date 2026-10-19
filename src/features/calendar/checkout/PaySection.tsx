import * as React from "react";
import { Banknote, CreditCard, Gift, Link2, Mail, MessageSquareText, Smartphone, Split, SquareStack, X } from "lucide-react";
import { Chip } from "@/components/ai-interaction";
import { Field, NumberField } from "@/components/forms";
import { OptionTile, SegmentedControl } from "@/components/selection";
import { Heading, Text } from "@/components/typography";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon } from "@/icons";
import type { ModelContext } from "../calendarModel";
import type { PaymentPart } from "../types";
import type { CheckoutController, PayChoice } from "./useCheckout";

/**
 * «¿Cómo paga?», con la cara del pago de la reserva: las formas de pago en
 * tarjetas y lo de la elegida —efectivo (con el cambio), tarjeta (eligiendo el
 * datáfono), link de pago (se le manda y se registra cuando pague), mixto
 * (efectivo y tarjeta) o en partes (cada una con su método)—. La tarjeta de
 * regalo del cliente se abre desde un enlace; la propina se pregunta al cobrar.
 */

const PAY_ICONS: Record<PayChoice, React.ComponentType<{ className?: string }>> = { cash: Banknote, card: CreditCard, link: Link2, mixed: Split, parts: SquareStack };
const PAY_CHOICES: readonly PayChoice[] = ["cash", "card", "link", "mixed", "parts"];
const PART_COUNTS = [2, 3, 4] as const;

export function PaySection({ checkout, ctx }: { checkout: CheckoutController; ctx: ModelContext }) {
  const { t } = checkout;
  return (
    <div className="flex flex-col gap-6" data-testid="checkout-pay-step">
      <section className="flex flex-col gap-3">
        <Heading level={6}>{t("calendar.checkout.howPays")}</Heading>
        {/* Como el pago de la reserva: las formas de pago en tarjetas lado a lado y, debajo, lo de la elegida. */}
        <div role="radiogroup" aria-label={t("calendar.checkout.method")} className="grid grid-cols-3 gap-2" data-testid="checkout-methods">
          {PAY_CHOICES.map((choice) => (
            <OptionTile key={choice} layout="stacked" compact option={{ value: choice, label: t(`calendar.checkout.pay.${choice}`), icon: PAY_ICONS[choice] }} selected={checkout.payChoice === choice} onSelect={(value) => checkout.choosePay(value as PayChoice)} />
          ))}
        </div>
        <Text size="xs" tone="muted">
          {t(`calendar.checkout.pay.${checkout.payChoice}Hint`)}
        </Text>
        <div>
          {checkout.payChoice === "cash" && <CashDetail checkout={checkout} ctx={ctx} />}
          {checkout.payChoice === "card" && <DevicePicker checkout={checkout} value={checkout.deviceId} onChange={checkout.setDeviceId} />}
          {checkout.payChoice === "link" && <LinkDetail checkout={checkout} ctx={ctx} />}
          {checkout.payChoice === "mixed" && <MixedDetail checkout={checkout} ctx={ctx} />}
          {checkout.payChoice === "parts" && <PartsDetail checkout={checkout} ctx={ctx} />}
        </div>
        {checkout.surcharge > 0 && (
          <Text size="xs" tone="muted" data-testid="checkout-surcharge">
            {t("calendar.checkout.surchargeHint", { amount: ctx.formatMoney(checkout.surcharge) })}
          </Text>
        )}
      </section>
    </div>
  );
}

/** Pagar con la tarjeta de regalo del cliente: el código, su saldo y cuánto cubre. */
export function GiftRedeem({ checkout, ctx }: { checkout: CheckoutController; ctx: ModelContext }) {
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
    <div className="flex flex-col gap-1">
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
    <div className="flex flex-col gap-2" data-testid="checkout-devices">
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

/** El link de pago: se le manda por SMS o correo y, cuando pague, se registra con el botón de abajo. */
function LinkDetail({ checkout, ctx }: { checkout: CheckoutController; ctx: ModelContext }) {
  const { t, client } = checkout;
  const canContact = ctx.access?.canContact ?? true;
  const phone = canContact && client?.phone ? client.phone.replace(/[^\d+]/g, "") : "";
  const email = canContact && client?.email ? client.email : "";
  const url = `https://pagar.barberlytics.com/${(client?.id ?? "c").slice(-6)}-${Math.round(checkout.total * 100)}`;
  const text = t("calendar.checkout.link.message", { name: client?.name.split(" ")[0] ?? "", amount: ctx.formatMoney(checkout.total), url });
  const channels = [
    ...(phone ? [{ id: "sms", label: t("calendar.panel.write.sms"), href: `sms:${phone}?body=${encodeURIComponent(text)}`, icon: <MessageSquareText /> }] : []),
    ...(email ? [{ id: "email", label: t("calendar.panel.write.email"), href: `mailto:${email}?subject=${encodeURIComponent(t("calendar.checkout.link.subject"))}&body=${encodeURIComponent(text)}`, icon: <Mail /> }] : []),
  ];
  return (
    <div className="flex flex-col gap-2" data-testid="checkout-link">
      {checkout.linkSent ? (
        <Alert variant="info">
          <ThemaIcon name="clock" />
          <AlertDescription>{t("calendar.checkout.link.waiting", { amount: ctx.formatMoney(checkout.total) })}</AlertDescription>
        </Alert>
      ) : channels.length > 0 ? (
        <>
          <Text size="sm" tone="secondary">
            {t("calendar.checkout.link.send")}
          </Text>
          <div className="flex gap-2">
            {channels.map((channel) => (
              <Button key={channel.id} asChild variant="outline" className="flex-1">
                <a href={channel.href} target="_blank" rel="noreferrer" onClick={checkout.markLinkSent} data-testid={`checkout-link-${channel.id}`}>
                  {channel.icon} {channel.label}
                </a>
              </Button>
            ))}
          </div>
        </>
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
    <div className="flex flex-col gap-1">
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
