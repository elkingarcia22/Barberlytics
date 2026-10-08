import * as React from "react";
import { CreditCard, Smartphone, Store, Wallet } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { Spinner } from "@/components/feedback/Spinner";
import { ModalShell } from "@/components/overlays";
import { Heading, Text } from "@/components/typography";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { OptionTile, SegmentedControl, type SelectionOption } from "@/components/selection";
import { ThemaIcon } from "@/icons";
import { describeError, isApiError } from "@/lib/api";
import { personName } from "../bookingState";
import { feeLabel } from "../pricing";
import { parseStart } from "../bookingFormat";
import { useBookingFlow } from "../flow/BookingContext";
import { brandFromName, isCardComplete, isCvcComplete, type CardValues } from "../flow/cardValidation";
import { OrderSummary } from "../flow/OrderSummary";
import { PromoField } from "../flow/PromoField";
import { NewCardSheet } from "../flow/NewCardSheet";
import { NEW_CARD, SavedCardPicker } from "../flow/SavedCardPicker";
import { StepLayout } from "../flow/StepLayout";
import { useReserveMutation } from "../queries";
import type { PayMethod } from "../types";
import { draftOrderLines } from "../useBookingTotals";

const NO_TIP = "none";

/**
 * Pagar: la propina para el barbero, un cupón y cómo se paga. Si la barbería
 * deja pagar en el local, esa opción está; si el cliente es «solo en línea»,
 * no. El botón dice exactamente lo que va a pasar («Pagar $64»).
 */
export function PaymentStep() {
  const t = useAppT();
  const { state, dispatch, shop, catalog, totals, fmt } = useBookingFlow();
  const reserve = useReserveMutation();
  // La tarjeta nueva, ya escrita y revisada en su hoja (null mientras no se agrega).
  const [card, setCard] = React.useState<CardValues | null>(null);
  const [sheet, setSheet] = React.useState<{ open: boolean; prefill: boolean }>({ open: false, prefill: false });
  const [showCardErrors, setShowCardErrors] = React.useState(false);
  // Varias citas pagadas en el local: se explica cómo se cobra antes de que lleguen.
  const [shopNoticeOpen, setShopNoticeOpen] = React.useState(false);
  const hasSeveralAppointments = state.items.length > 1;
  const customer = state.customer;
  const credit = customer?.credit ?? 0;
  // Con tarjetas guardadas abre en la primera que no esté vencida; si no, en «tarjeta nueva».
  const savedCards = customer?.cards ?? [];
  const [cardChoice, setCardChoice] = React.useState<string>(() => savedCards.find((card) => new Date(card.expYear, card.expMonth, 1).getTime() > Date.now())?.id ?? NEW_CARD);
  const [savedCvc, setSavedCvc] = React.useState("");
  // Guardar la tarjeta es una decisión del cliente: empieza sin marcar.
  const [saveCard, setSaveCard] = React.useState(false);
  const chosenSaved = savedCards.find((card) => card.id === cardChoice) ?? null;

  // El recargo se dice en la opción que lo lleva, antes de elegirla, y pagar en la barbería lo evita.
  const fee = shop.cardFee ? t("booking.payment.feeHint", { fee: feeLabel(shop.cardFee, fmt.money) }) : "";
  const methods: SelectionOption[] = [
    ...(shop.payment.card
      ? [
          { value: "card", label: t("booking.payment.card"), description: [t("booking.payment.cardHint"), fee].filter(Boolean).join(" "), icon: CreditCard },
          { value: "wallet", label: t("booking.payment.wallet"), description: [t("booking.payment.walletHint"), fee].filter(Boolean).join(" "), icon: Smartphone },
        ]
      : []),
    // «Solo en línea» no esconde la opción: se ve apagada y dice por qué.
    ...(shop.payment.payAtShop
      ? [
          customer?.onlineOnly
            ? { value: "shop", label: t("booking.payment.shop"), description: t("booking.payment.onlineOnly"), icon: Store, disabled: true }
            : { value: "shop", label: t("booking.payment.shop"), description: [t("booking.payment.shopHint"), shop.cardFee ? t("booking.payment.shopNoFee") : ""].filter(Boolean).join(" "), icon: Store },
        ]
      : []),
    ...(credit >= totals.total && totals.total > 0 ? [{ value: "credit", label: t("booking.payment.credit"), description: t("booking.payment.creditHint", { amount: fmt.money(credit) }), icon: Wallet }] : []),
  ];
  const available = methods.filter((option) => !option.disabled);
  const method = state.method && available.some((option) => option.value === state.method) ? state.method : ((available[0]?.value as PayMethod | undefined) ?? null);

  const tipOptions: SelectionOption[] = [
    { value: NO_TIP, label: t("booking.payment.tipNone") },
    ...shop.tipOptions.map((option) => ({ value: option.id, label: option.type === "percent" ? `${option.value} %` : fmt.money(option.value) })),
  ];

  const serverCardError = isApiError(reserve.error) ? reserve.error.fieldErrors?.card?.[0] : undefined;
  const payLabel =
    method === "shop" ? t("booking.payment.payShop") : method === "credit" ? t("booking.payment.payCredit") : method === "wallet" ? t("booking.payment.payWallet", { amount: fmt.money(totals.total) }) : t("booking.payment.payNow", { amount: fmt.money(totals.total) });

  const pay = () => {
    if (!customer || !state.branchId || !method) return;
    if (method === "card" && !chosenSaved && !card) {
      setSheet({ open: true, prefill: false });
      return;
    }
    if (method === "card" && (chosenSaved ? !isCvcComplete(savedCvc, brandFromName(chosenSaved.brand)) : !card || !isCardComplete(card))) {
      setShowCardErrors(true);
      return;
    }
    reserve.mutate(
      {
        customerId: customer.id,
        branchId: state.branchId,
        items: state.items.map((item) => ({
          guestId: item.person.kind === "guest" ? item.person.guestId : null,
          guestName: item.person.kind === "new" ? item.person.name : undefined,
          guestRelation: item.person.kind === "new" ? item.person.relation : undefined,
          serviceIds: item.serviceIds,
          barberId: item.barberId,
          start: item.start ?? "",
        })),
        products: Object.entries(state.products).map(([productId, qty]) => ({ productId, qty })),
        tipId: state.tipId,
        promoCode: state.promo?.code ?? null,
        method,
        // El CVC no se manda: va a la pasarela. De una guardada solo viaja su id (el token).
        card: method === "card" && !chosenSaved && card ? { number: card.number, name: card.name, expiry: card.expiry, save: saveCard } : undefined,
        savedCardId: method === "card" && chosenSaved ? chosenSaved.id : undefined,
        notes: state.notes.trim() || undefined,
      },
      { onSuccess: (reservation) => dispatch({ type: "reserved", reservation }) }
    );
  };

  const lines = draftOrderLines(state, catalog, (item) => {
    const barber = catalog?.barbers.find((entry) => entry.id === item.barberId)?.name ?? t("booking.review.noPreference");
    return `${personName(item.person, customer)} · ${barber}${item.start ? ` · ${fmt.when(parseStart(item.start))}` : ""}`;
  });

  return (
    <StepLayout
      title={t("booking.payment.title")}
      lead={t("booking.payment.lead")}
      footer={
        <div className="flex flex-col gap-2">
          <Button type="button" size="lg" className="w-full" disabled={!method || reserve.isPending} onClick={pay}>
            {reserve.isPending ? <Spinner size="sm" tone="inverse" /> : <ThemaIcon name={method === "shop" ? "calendar" : "lock"} />}
            {reserve.isPending ? t("booking.payment.processing") : method ? payLabel : t("booking.payment.choose")}
          </Button>
          <Text size="xs" tone="muted" className="text-center">
            {t("booking.payment.policyAccept")}
          </Text>
        </div>
      }
    >
      <section className="flex flex-col gap-2">
        <Heading level={6}>{t("booking.payment.tip")}</Heading>
        <SegmentedControl options={tipOptions} value={state.tipId ?? NO_TIP} onChange={(value) => dispatch({ type: "setTip", tipId: value === NO_TIP ? null : value })} fullWidth ariaLabel={t("booking.payment.tip")} />
        <Text size="xs" tone="muted">
          {t("booking.payment.tipHint")}
        </Text>
      </section>

      <PromoField />

      <section className="flex flex-col gap-3">
        <Heading level={6}>{t("booking.payment.method")}</Heading>
        <div role="radiogroup" aria-label={t("booking.payment.method")} className="flex flex-col gap-2">
          {methods.map((option) => (
            <OptionTile key={option.value} option={option} selected={method === option.value} onSelect={(value) => {
                dispatch({ type: "setMethod", method: value as PayMethod });
                if (value === "shop" && hasSeveralAppointments && method !== "shop") setShopNoticeOpen(true);
              }}
            />
          ))}
        </div>
        {method === "card" && (
          <SavedCardPicker
            cards={savedCards}
            value={cardChoice}
            onChange={(value) => {
              setCardChoice(value);
              setSavedCvc("");
              setShowCardErrors(false);
              if (reserve.isError) reserve.reset();
            }}
            pending={card}
            onAddNew={() => setSheet({ open: true, prefill: false })}
            onEditPending={() => setSheet({ open: true, prefill: true })}
            cvc={savedCvc}
            onCvcChange={setSavedCvc}
            showErrors={showCardErrors}
          />
        )}
        {method === "card" && serverCardError && (
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
              <button type="button" className="font-medium underline underline-offset-2" onClick={() => setShopNoticeOpen(true)}>
                {t("booking.payment.shopMulti.more")}
              </button>
            </AlertDescription>
          </Alert>
        )}
        {method !== "shop" && (
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

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-subtle p-4">
        <Heading level={6}>{t("booking.payment.order")}</Heading>
        <OrderSummary totals={totals} money={fmt.money} lines={lines} promoCode={state.promo?.code} />
      </section>
      <ModalShell
        open={shopNoticeOpen}
        onOpenChange={setShopNoticeOpen}
        size="sm"
        title={t("booking.payment.shopMulti.modalTitle")}
        actions={
          <Button type="button" size="lg" className="w-full" onClick={() => setShopNoticeOpen(false)}>
            {t("booking.payment.shopMulti.ok")}
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          <Text tone="secondary">{t("booking.payment.shopMulti.intro", { count: state.items.length })}</Text>
          <ol className="flex list-decimal flex-col gap-2 pl-5 marker:text-text-muted">
            <li><Text as="span" tone="secondary">{t("booking.payment.shopMulti.one")}</Text></li>
            <li><Text as="span" tone="secondary">{t("booking.payment.shopMulti.two")}</Text></li>
            <li><Text as="span" tone="secondary">{t("booking.payment.shopMulti.three")}</Text></li>
          </ol>
          <Text tone="secondary">{t("booking.payment.shopMulti.bye")}</Text>
        </div>
      </ModalShell>
      <NewCardSheet
        key={`${sheet.open}-${sheet.prefill}`}
        open={sheet.open}
        onOpenChange={(open) => setSheet((current) => ({ ...current, open }))}
        initial={sheet.prefill ? card : null}
        initialSave={saveCard}
        canSave={Boolean(customer)}
        onConfirm={(values, save) => {
          setCard(values);
          setSaveCard(save);
          setCardChoice(NEW_CARD);
          setShowCardErrors(false);
          // Lo que dijo la pasarela ya no vale para la tarjeta corregida.
          if (reserve.isError) reserve.reset();
        }}
      />
    </StepLayout>
  );
}
