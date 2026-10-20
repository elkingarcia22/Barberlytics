import * as React from "react";
import { Banknote, Check, CreditCard, Gift, Link2, Plus, Smartphone, Split, SquareStack, Trash2, X } from "lucide-react";
import { Chip } from "@/components/ai-interaction";
import { Field, NumberField } from "@/components/forms";
import { SegmentedControl } from "@/components/selection";
import { Text } from "@/components/typography";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";
import type { ModelContext } from "../calendarModel";
import { SendToClient } from "../appointmentPanel/SendToClient";
import type { SendTarget } from "../appointmentPanel/sendTarget";
import type { LineMethod, PayLine, PayMode } from "./payLines";
import type { CheckoutController } from "./useCheckout";

/**
 * «¿Cómo paga?»: un selector con las formas de pago y, debajo, lo de la
 * elegida, sin salir de la pantalla: el cambio del efectivo, la lista de
 * datáfonos, el link de pago (Correo y SMS, como el recibo), el código de la
 * tarjeta de regalo (y con qué se paga lo que no cubra), mixto (dos formas,
 * cada una con su monto) o en partes (2, 3, 4 o personalizado, cada parte con
 * su forma; la de link se manda por su monto).
 */

const MODES: readonly PayMode[] = ["cash", "card", "link", "gift", "mixed", "parts"];
const ICONS: Record<PayMode, React.ComponentType<{ className?: string }>> = { cash: Banknote, card: CreditCard, link: Link2, gift: Gift, mixed: Split, parts: SquareStack };
const LINE_ICONS: Record<LineMethod, React.ComponentType<{ className?: string }>> = { cash: Banknote, card: CreditCard, link: Link2, gift: Gift };
const MIXED_METHODS: readonly LineMethod[] = ["cash", "card", "gift"];
const PART_METHODS: readonly LineMethod[] = ["cash", "card", "link", "gift"];
const PART_COUNTS = [2, 3, 4] as const;

const BOX = "flex flex-col gap-3 rounded-xl border border-input bg-surface p-3";

export function PayMethods({ checkout, ctx, target }: { checkout: CheckoutController; ctx: ModelContext; target: SendTarget | null }) {
  const { t } = checkout;
  const Icon = ICONS[checkout.payChoice];
  return (
    <div className="flex flex-col gap-3" data-testid="checkout-pay-step">
      <Select value={checkout.payChoice} onValueChange={(value) => checkout.choosePay(value as PayMode)}>
        {/* El disparador cuenta la forma elegida en dos líneas: sin el recorte a una línea del Select. */}
        <SelectTrigger className="h-auto min-h-14 py-2 [&>span]:line-clamp-none [&>span]:!flex" aria-label={t("calendar.checkout.method")} data-testid="checkout-method">
          <span className="flex min-w-0 items-center gap-3 text-left">
            <IconTile size="md" shape="circle" tone="primary" icon={<Icon />} />
            <span className="flex min-w-0 flex-col">
              <Text as="span" weight="medium" truncate>
                <SelectValue>{t(`calendar.checkout.pay.${checkout.payChoice}`)}</SelectValue>
              </Text>
              <Text as="span" size="xs" tone="muted" truncate>
                {t(`calendar.checkout.pay.${checkout.payChoice}Hint`)}
              </Text>
            </span>
          </span>
        </SelectTrigger>
        <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
          {MODES.map((mode) => {
            const ModeIcon = ICONS[mode];
            return (
              <SelectItem key={mode} value={mode} data-testid={`checkout-method-${mode}`}>
                <span className="flex items-center gap-2">
                  <ModeIcon className="size-4 text-text-muted" />
                  {t(`calendar.checkout.pay.${mode}`)}
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {checkout.payChoice === "cash" && <CashDetail checkout={checkout} ctx={ctx} />}
      {checkout.payChoice === "card" && <DeviceList checkout={checkout} value={checkout.deviceId} onChange={checkout.setDeviceId} />}
      {checkout.payChoice === "link" && <LinkDetail checkout={checkout} ctx={ctx} target={target} />}
      {checkout.payChoice === "gift" && <GiftDetail checkout={checkout} ctx={ctx} />}
      {checkout.payChoice === "mixed" && <MixedDetail checkout={checkout} ctx={ctx} />}
      {checkout.payChoice === "parts" && <PartsDetail checkout={checkout} ctx={ctx} target={target} />}

      {checkout.surcharge > 0 && (
        <Text size="xs" tone="muted" data-testid="checkout-surcharge">
          {t("calendar.checkout.surchargeHint", { amount: ctx.formatMoney(checkout.surcharge) })}
        </Text>
      )}
    </div>
  );
}

function CashDetail({ checkout, ctx }: { checkout: CheckoutController; ctx: ModelContext }) {
  const { t, change } = checkout;
  return (
    <div className={BOX}>
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

/** Con qué datáfono se pasa la tarjeta (los de Configuración), en lista. */
function DeviceList({ checkout, value, onChange }: { checkout: CheckoutController; value: string | null | undefined; onChange: (id: string) => void }) {
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
    <div className="flex flex-col gap-1.5" data-testid="checkout-devices">
      <Text size="sm" weight="medium">
        {t("calendar.checkout.device.title")}
      </Text>
      <div role="radiogroup" aria-label={t("calendar.checkout.device.title")} className="flex flex-col gap-1.5">
        {devices.map((device) => {
          const selected = value === device.id;
          return (
            <button
              key={device.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(device.id)}
              className={cn(
                "flex min-h-12 w-full items-center gap-3 rounded-xl border bg-surface px-3 py-2 text-left outline-none transition-[border-color,background-color] duration-fast hover:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-ring/50",
                selected ? "border-primary/60 bg-[linear-gradient(hsl(var(--primary)/0.06),hsl(var(--primary)/0.06))]" : "border-input"
              )}
              data-testid={`checkout-device-${device.id}`}
            >
              <IconTile size="sm" shape="circle" tone={selected ? "primary" : "neutral"} icon={<CreditCard />} />
              <span className="flex min-w-0 flex-1 flex-col">
                <Text as="span" size="sm" weight="medium" truncate>
                  {device.name}
                </Text>
                <Text as="span" size="xs" tone="muted">
                  {device.tpn}
                </Text>
              </span>
              {selected && <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** El link de pago, como el recibo: Correo y SMS para marcar y «Enviar». Cuando pague, se registra con el botón de abajo. */
function LinkDetail({ checkout, ctx, target, amount, onSent }: { checkout: CheckoutController; ctx: ModelContext; target: SendTarget | null; amount?: number; onSent?: () => void }) {
  const { t, client } = checkout;
  const value = amount ?? checkout.total;
  const sent = amount === undefined && checkout.linkSent;
  const url = `https://pagar.barberlytics.com/${(client?.id ?? "c").slice(-6)}-${Math.round(value * 100)}`;
  const text = t("calendar.checkout.link.message", { name: client?.name.split(" ")[0] ?? "", amount: ctx.formatMoney(value), url });
  if (!target || (!target.email && !target.phone)) {
    return (
      <Text size="sm" tone="muted">
        {t("calendar.checkout.link.noContact")}
      </Text>
    );
  }
  if (sent) {
    return (
      <Alert variant="info" data-testid="checkout-link-waiting">
        <ThemaIcon name="clock" />
        <AlertDescription>{t("calendar.checkout.link.waiting", { amount: ctx.formatMoney(value) })}</AlertDescription>
      </Alert>
    );
  }
  return (
    <div className={BOX} data-testid="checkout-link">
      <SendToClient target={target} kind="payLink" lead={t("calendar.checkout.link.lead", { amount: ctx.formatMoney(value) })} body={text} onSent={onSent ?? checkout.markLinkSent} />
    </div>
  );
}

/** El código de la tarjeta de regalo del cliente y, si no cubre todo, con qué se paga el resto. */
function GiftDetail({ checkout, ctx }: { checkout: CheckoutController; ctx: ModelContext }) {
  const { t } = checkout;
  const rest = checkout.total;
  return (
    <div className={BOX} data-testid="checkout-gift">
      <GiftRedeem checkout={checkout} ctx={ctx} />
      {checkout.gift && rest > 0.004 && (
        <div className="flex flex-col gap-2">
          <Text size="sm" weight="medium">
            {t("calendar.checkout.giftCard.rest", { amount: ctx.formatMoney(rest) })}
          </Text>
          <SegmentedControl fullWidth size="sm" value={checkout.giftRest} onChange={(value) => checkout.setGiftRest(value === "card" ? "card" : "cash")} options={(["cash", "card"] as const).map((method) => ({ value: method, label: t(`calendar.checkout.pay.${method}`) }))} />
          {checkout.giftRest === "card" && <DeviceList checkout={checkout} value={checkout.deviceId} onChange={checkout.setDeviceId} />}
        </div>
      )}
    </div>
  );
}

/** Pagar con la tarjeta de regalo del cliente: el código, su saldo y cuánto cubre. */
function GiftRedeem({ checkout, ctx }: { checkout: CheckoutController; ctx: ModelContext }) {
  const { t } = checkout;
  const [code, setCode] = React.useState("");
  if (checkout.gift) {
    return (
      <div className="flex items-center gap-3" data-testid="checkout-gift-applied">
        <IconTile size="md" shape="circle" tone="positive" icon={<Gift />} />
        <span className="flex min-w-0 flex-1 flex-col">
          <Text weight="medium">{checkout.gift.code}</Text>
          <Text size="xs" tone="muted" tabular>
            {t("calendar.checkout.giftCard.balance", { amount: ctx.formatMoney(checkout.gift.balance) })}
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

/** Mixto: dos formas de pago (efectivo, tarjeta o la tarjeta de regalo); la segunda se lleva lo que falta. */
function MixedDetail({ checkout, ctx }: { checkout: CheckoutController; ctx: ModelContext }) {
  const { t, lines } = checkout;
  return (
    <div className="flex flex-col gap-2" data-testid="checkout-mixed">
      {lines.map((line, index) => (
        <LineCard
          key={index}
          checkout={checkout}
          ctx={ctx}
          line={line}
          index={index}
          title={t("calendar.checkout.mixed.line", { index: index + 1 })}
          methods={MIXED_METHODS.filter((method) => method !== lines[index === 0 ? 1 : 0]?.method)}
          amountEditable={index === 0}
          amountHint={index === 1 ? t("calendar.checkout.mixed.rest") : undefined}
        />
      ))}
    </div>
  );
}

/** En partes: cuántas (2, 3, 4 o personalizado) y de cada una su forma y su monto. */
function PartsDetail({ checkout, ctx, target }: { checkout: CheckoutController; ctx: ModelContext; target: SendTarget | null }) {
  const { t, lines } = checkout;
  return (
    <div className="flex flex-col gap-3" data-testid="checkout-parts">
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t("calendar.checkout.parts.count")}>
        {PART_COUNTS.map((count) => (
          <Chip key={count} size="sm" label={t("calendar.checkout.parts.countLabel", { count })} selected={!checkout.customParts && lines.length === count} onClick={() => checkout.setPartCount(count)} />
        ))}
        <Chip size="sm" label={t("calendar.checkout.parts.custom")} selected={checkout.customParts} onClick={() => checkout.setPartCount(null)} data-testid="checkout-parts-custom" />
      </div>
      {lines.map((line, index) => (
        <LineCard
          key={index}
          checkout={checkout}
          ctx={ctx}
          line={line}
          index={index}
          title={t("calendar.checkout.parts.part", { index: index + 1 })}
          methods={PART_METHODS}
          amountEditable
          target={target}
          onRemove={checkout.customParts && lines.length > 2 ? () => checkout.removeLine(index) : undefined}
        />
      ))}
      {checkout.customParts && (
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={checkout.addLine} data-testid="checkout-parts-add">
          <Plus /> {t("calendar.checkout.parts.add")}
        </Button>
      )}
      <Text size="sm" tone={Math.abs(checkout.linesLeft) > 0.01 ? "warning" : "positive"} data-testid="checkout-parts-left">
        {Math.abs(checkout.linesLeft) <= 0.01 ? t("calendar.checkout.parts.ok") : checkout.linesLeft > 0 ? t("calendar.checkout.parts.missing", { amount: ctx.formatMoney(checkout.linesLeft) }) : t("calendar.checkout.parts.over", { amount: ctx.formatMoney(-checkout.linesLeft) })}
      </Text>
    </div>
  );
}

/** Una línea de pago: su forma, su monto y lo que pida (datáfono, código de regalo, mandar el link). */
function LineCard({
  checkout,
  ctx,
  line,
  index,
  title,
  methods,
  amountEditable,
  amountHint,
  target = null,
  onRemove,
}: {
  checkout: CheckoutController;
  ctx: ModelContext;
  line: PayLine;
  index: number;
  title: string;
  methods: readonly LineMethod[];
  amountEditable: boolean;
  amountHint?: string;
  target?: SendTarget | null;
  onRemove?: () => void;
}) {
  const { t } = checkout;
  const [sending, setSending] = React.useState(false);
  const Icon = LINE_ICONS[line.method];
  const overGift = line.method === "gift" && checkout.gift && line.amount > checkout.gift.balance + 0.004;
  return (
    <div className={BOX} data-testid="checkout-line">
      <div className="flex items-center gap-2">
        <Text size="sm" weight="medium" className="flex-1">
          {title}
        </Text>
        {line.method === "link" && line.sent && (
          <Text as="span" size="xs" tone="positive" className="flex items-center gap-1">
            <Check className="size-3.5" aria-hidden="true" /> {t("calendar.checkout.link.sentShort")}
          </Text>
        )}
        {onRemove && (
          <Button type="button" size="icon-xs" variant="ghost" aria-label={t("calendar.checkout.parts.remove", { index: index + 1 })} onClick={onRemove}>
            <Trash2 />
          </Button>
        )}
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_8rem] gap-2">
        <Select value={line.method} onValueChange={(method) => checkout.updateLine(index, { method: method as LineMethod })}>
          <SelectTrigger className="[&>span]:!flex" aria-label={t("calendar.checkout.lineMethod", { index: index + 1 })}>
            <span className="flex items-center gap-2">
              <Icon className="size-4 text-text-muted" />
              <SelectValue />
            </span>
          </SelectTrigger>
          <SelectContent>
            {methods.map((method) => (
              <SelectItem key={method} value={method}>
                {t(`calendar.checkout.pay.${method}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {amountEditable ? (
          <NumberField value={line.amount} onValueChange={(amount) => checkout.updateLine(index, { amount: amount ?? 0 })} min={0} step={1} prefix="$" size="sm" aria-label={t("calendar.checkout.lineAmount", { index: index + 1 })} />
        ) : (
          <span className="flex h-9 items-center justify-end rounded-md bg-surface-muted px-3 tabular-nums" aria-label={t("calendar.checkout.lineAmount", { index: index + 1 })}>
            {ctx.formatMoney(line.amount)}
          </span>
        )}
      </div>
      {amountHint && (
        <Text size="xs" tone="muted">
          {amountHint}
        </Text>
      )}
      {line.method === "card" && checkout.devices.length > 1 && (
        <Select value={line.deviceId} onValueChange={(deviceId) => checkout.updateLine(index, { deviceId })}>
          <SelectTrigger aria-label={t("calendar.checkout.device.title")}>
            <SelectValue placeholder={t("calendar.checkout.device.title")} />
          </SelectTrigger>
          <SelectContent>
            {checkout.devices.map((device) => (
              <SelectItem key={device.id} value={device.id}>
                {device.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {line.method === "gift" && (
        <>
          <GiftRedeem checkout={checkout} ctx={ctx} />
          {overGift && (
            <Text size="xs" tone="warning">
              {t("calendar.checkout.giftCard.notEnough", { amount: ctx.formatMoney(checkout.gift?.balance ?? 0) })}
            </Text>
          )}
        </>
      )}
      {line.method === "link" &&
        !line.sent &&
        (sending ? (
          <LinkDetail
            checkout={checkout}
            ctx={ctx}
            target={target}
            amount={line.amount}
            onSent={() => {
              checkout.updateLine(index, { sent: true });
              setSending(false);
            }}
          />
        ) : (
          <Button type="button" variant="outline" size="sm" className="self-start" disabled={line.amount <= 0} onClick={() => setSending(true)} data-testid="checkout-line-send">
            <Link2 /> {t("calendar.checkout.link.sendAmount", { amount: ctx.formatMoney(line.amount) })}
          </Button>
        ))}
    </div>
  );
}
