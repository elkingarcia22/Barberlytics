import { useAppT } from "@/app/i18n";
import { Spinner } from "@/components/feedback/Spinner";
import { Heading, Text } from "@/components/typography";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { OptionTile, type SelectionOption } from "@/components/selection";
import { ThemaIcon } from "@/icons";
import { describeError } from "@/lib/api";
import { personName } from "../bookingState";
import { parseStart } from "../bookingFormat";
import type { PayMethod } from "../types";
import { draftOrderLines } from "../useBookingTotals";
import { useBookingFlow } from "./BookingContext";
import { BookingSheet } from "./BookingSheet";
import { GiftCardField } from "./GiftCardField";
import { MembershipPerk } from "./MembershipPerk";
import { NewCardSheet } from "./NewCardSheet";
import { OrderSummary } from "./OrderSummary";
import { PackagesToggle } from "./PackagesToggle";
import { PromoField } from "./PromoField";
import { NEW_CARD, SavedCardPicker } from "./SavedCardPicker";
import type { PaymentController } from "./usePaymentController";

const NO_TIP = "none";

/** El botón que cobra: dice exactamente lo que va a pasar («Pagar $64»). */
export function PayButton({ payment, className }: { payment: PaymentController; className?: string }) {
  const t = useAppT();
  const { method, deposit, reserve, payLabel, pay } = payment;
  return (
    <Button type="button" size="lg" className={className ?? "w-full"} disabled={!method || reserve.isPending} onClick={pay}>
      {reserve.isPending ? <Spinner size="sm" tone="inverse" /> : <ThemaIcon name={method === "shop" && deposit === 0 ? "calendar" : "lock"} />}
      {reserve.isPending ? t("booking.payment.processing") : method ? payLabel : t("booking.payment.choose")}
    </Button>
  );
}

interface PaymentPanelProps {
  payment: PaymentController;
  /** El resumen del pedido al final; la conversación lo enseña en su propia tarjeta. */
  showOrder?: boolean;
}

/**
 * La propina para el barbero, un cupón y cómo se paga. Si la barbería deja pagar en
 * el local, esa opción está; si el cliente es «solo en línea», no.
 */
export function PaymentPanel({ payment, showOrder = true }: PaymentPanelProps) {
  const t = useAppT();
  const { state, dispatch, shop, catalog, totals, fmt } = useBookingFlow();
  const { methods, method, deposit, depositPercent, usesCard, coveredByGift, reserve, serverCardError } = payment;
  const hasSeveralAppointments = state.items.length > 1;
  const customer = state.customer;

  const tipOptions: SelectionOption[] = [
    { value: NO_TIP, label: t("booking.payment.tipNone") },
    ...shop.tipOptions.map((option) => ({ value: option.id, label: option.type === "percent" ? `${option.value} %` : fmt.money(option.value) })),
  ];

  const lines = draftOrderLines(state, catalog, (item) => {
    const barber = catalog?.barbers.find((entry) => entry.id === item.barberId)?.name ?? t("booking.review.noPreference");
    return `${personName(item.person, customer)} · ${barber}${item.start ? ` · ${fmt.when(parseStart(item.start))}` : ""}`;
  });

  return (
    <>
      <section className="flex flex-col gap-2">
        <Heading level={6}>{t("booking.payment.tip")}</Heading>
        {/* Pastillas que bajan de línea si no caben: en un segmentado de 5, «Sin propina» y «US$ 5» se salían. */}
        <div role="radiogroup" aria-label={t("booking.payment.tip")} className="flex flex-wrap gap-2">
          {tipOptions.map((option) => {
            const selected = (state.tipId ?? NO_TIP) === option.value;
            return (
              <Button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                size="sm"
                variant={selected ? "default" : "outline"}
                className="min-w-[4.5rem] rounded-full tabular-nums"
                onClick={() => dispatch({ type: "setTip", tipId: option.value === NO_TIP ? null : option.value })}
              >
                {option.label}
              </Button>
            );
          })}
        </div>
        <Text size="xs" tone="muted">
          {t("booking.payment.tipHint")}
        </Text>
      </section>

      <div className="flex flex-col gap-2">
        <PackagesToggle />
        <MembershipPerk />
        <PromoField />
        <GiftCardField />
      </div>

      {coveredByGift && (
        <Alert variant="success">
          <ThemaIcon name="ticket" />
          <AlertTitle>{t("booking.gift.coveredTitle")}</AlertTitle>
          <AlertDescription>{t("booking.gift.coveredBody")}</AlertDescription>
        </Alert>
      )}
      <section className={coveredByGift ? "hidden" : "flex flex-col gap-3"}>
        <Heading level={6}>{t("booking.payment.method")}</Heading>
        <div role="radiogroup" aria-label={t("booking.payment.method")} className="flex flex-col gap-2">
          {methods.map((option) => (
            <OptionTile
              key={option.value}
              option={option}
              selected={method === option.value}
              onSelect={(value) => {
                dispatch({ type: "setMethod", method: value as PayMethod });
                if (value === "shop" && hasSeveralAppointments && method !== "shop") payment.setShopNoticeOpen(true);
              }}
            />
          ))}
        </div>
        {deposit > 0 && (
          <Alert variant="info">
            <ThemaIcon name="securityLock" />
            <AlertTitle>{t("booking.payment.deposit.title", { amount: fmt.money(deposit) })}</AlertTitle>
            <AlertDescription>{t("booking.payment.deposit.body", { percent: depositPercent ?? 0, rest: fmt.money(Math.max(0, totals.total - deposit)), hours: shop.cancelHours })}</AlertDescription>
          </Alert>
        )}
        {usesCard && (
          <SavedCardPicker
            cards={payment.savedCards}
            value={payment.cardChoice}
            onChange={payment.chooseCard}
            pending={payment.card}
            onAddNew={() => payment.setSheet({ open: true, prefill: false })}
            onEditPending={() => payment.setSheet({ open: true, prefill: true })}
            onRemovePending={payment.cardManager.onRemovePending}
            onEditCard={payment.cardManager.onEditCard}
            onRemoveCard={payment.cardManager.onRemoveCard}
            cvc={payment.savedCvc}
            onCvcChange={payment.setSavedCvc}
            showErrors={payment.showCardErrors}
          />
        )}
        {usesCard && serverCardError && (
          <Text size="sm" tone="negative">
            {serverCardError}
          </Text>
        )}
        {method === "shop" && hasSeveralAppointments && (
          <Alert variant="info">
            <ThemaIcon name="info" />
            <AlertTitle>{t("booking.payment.shopMulti.title", { count: state.items.length })}</AlertTitle>
            <AlertDescription>
              {t("booking.payment.shopMulti.short")}{" "}
              <button type="button" className="font-medium underline underline-offset-2" onClick={() => payment.setShopNoticeOpen(true)}>
                {t("booking.payment.shopMulti.more")}
              </button>
            </AlertDescription>
          </Alert>
        )}
        {(method !== "shop" || deposit > 0) && (
          <Text size="xs" tone="muted" className="flex items-center gap-1.5">
            <ThemaIcon name="securityLock" size="xs" />
            {t("booking.payment.secure")}
          </Text>
        )}
      </section>

      {reserve.isError && !serverCardError && (
        <Alert variant="destructive">
          <ThemaIcon name="error" />
          <AlertDescription>{describeError(reserve.error).description}</AlertDescription>
        </Alert>
      )}

      {showOrder && (
        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-subtle p-4">
          <Heading level={6}>{t("booking.payment.order")}</Heading>
          <OrderSummary totals={totals} money={fmt.money} lines={lines} promoCode={state.promo?.code} />
          {deposit > 0 && (
            <div className="flex flex-col gap-1 border-t border-border pt-2">
              <div className="flex items-center justify-between gap-3">
                <Text size="sm" weight="medium">
                  {t("booking.payment.deposit.today")}
                </Text>
                <Text size="sm" weight="semibold" tabular>
                  {fmt.money(deposit)}
                </Text>
              </div>
              <div className="flex items-center justify-between gap-3">
                <Text size="sm" tone="secondary">
                  {t("booking.payment.deposit.atShop")}
                </Text>
                <Text size="sm" tone="secondary" tabular>
                  {fmt.money(Math.max(0, totals.total - deposit))}
                </Text>
              </div>
            </div>
          )}
        </section>
      )}
      <PaymentSheets payment={payment} />
    </>
  );
}

/** Las hojas del cobro: cómo se paga en el local con varias citas y la tarjeta nueva. */
export function PaymentSheets({ payment }: { payment: PaymentController }) {
  const t = useAppT();
  const { state } = useBookingFlow();
  const { reserve, sheet, setSheet, card, saveCard } = payment;
  return (
    <>
      <BookingSheet
        open={payment.shopNoticeOpen}
        onOpenChange={payment.setShopNoticeOpen}
        title={t("booking.payment.shopMulti.modalTitle")}
        actions={
          <Button type="button" size="lg" className="w-full" onClick={() => payment.setShopNoticeOpen(false)}>
            {t("booking.payment.shopMulti.ok")}
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          <Text tone="secondary">{t("booking.payment.shopMulti.intro", { count: state.items.length })}</Text>
          <ol className="flex list-decimal flex-col gap-2 pl-5 marker:text-text-muted">
            <li>
              <Text as="span" tone="secondary">
                {t("booking.payment.shopMulti.one")}
              </Text>
            </li>
            <li>
              <Text as="span" tone="secondary">
                {t("booking.payment.shopMulti.two")}
              </Text>
            </li>
            <li>
              <Text as="span" tone="secondary">
                {t("booking.payment.shopMulti.three")}
              </Text>
            </li>
          </ol>
          <Text tone="secondary">{t("booking.payment.shopMulti.bye")}</Text>
        </div>
      </BookingSheet>
      {payment.cardManager.sheets}
      <NewCardSheet
        key={`${sheet.open}-${sheet.prefill}`}
        open={sheet.open}
        onOpenChange={(open) => setSheet((current) => ({ ...current, open }))}
        initial={sheet.prefill ? card : null}
        initialSave={saveCard}
        canSave={Boolean(state.customer)}
        onConfirm={(values, save) => {
          payment.setCard(values);
          payment.setSaveCard(save);
          payment.setCardChoice(NEW_CARD);
          payment.setShowCardErrors(false);
          // Lo que dijo la pasarela ya no vale para la tarjeta corregida.
          if (reserve.isError) reserve.reset();
        }}
      />
    </>
  );
}
