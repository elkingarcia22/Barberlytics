import * as React from "react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { describeError } from "@/lib/api";
import { useSettingsList, useSettingsSection } from "@/features/settings/settingsQueries";
import { cardFeeSchema, deviceSchema, tipsSchema } from "@/features/settings/settingsTypes";
import { findBarber, findClient, newLinkId, servicesOf, type ModelContext } from "../calendarModel";
import { FALLBACK_TIPS, appointmentBill, changeDue, discountAmount, sumBills, surchargeAmount, tipAmount, type TipChoice } from "../checkoutMath";
import { useCheckoutAppointment, useUpdateAppointment } from "../queries";
import { PAYMENT_METHOD_KEYS, type Appointment, type CheckoutInput, type PaymentMethod, type PaymentPart, type ProductLine } from "../types";
import { calendarApi } from "../api";
import { allocateParts, paymentOf } from "./allocate";
import { cents, equalLines, giftOf, linesTotal, mixedLines, paymentOfLines, type PayLine, type PayMode } from "./payLines";

/**
 * El estado del cobro de la caja, sin interfaz: la cuenta (citas que se
 * cobran juntas, servicios con su precio, productos, la tarjeta de regalo que
 * se vende y el descuento) y el pago (propina, la tarjeta de regalo del
 * cliente y cómo paga: efectivo, tarjeta con su datáfono, link, mixto o en
 * partes). Calcula lo que se cobra igual que el servidor y cierra cada cita
 * con lo suyo.
 */

/** Cómo paga: efectivo, tarjeta, link, tarjeta de regalo, mixto (dos formas) o en partes. */
export type PayChoice = PayMode;
export type DiscountType = "percent" | "amount";

export interface GiftSaleDraft {
  amount: number | null;
  recipientName: string;
  recipientContact: string;
}

const NO_APPOINTMENTS: readonly Appointment[] = [];
const PART_COUNT = 2;

export interface UseCheckoutOptions {
  appointment: Appointment;
  /** Las demás citas sin cobrar de su visita (enlazadas): salen marcadas. */
  companions?: readonly Appointment[];
  /** Otras citas del día sin cobrar que se pueden sumar al cobro. */
  candidates?: readonly Appointment[];
  ctx: ModelContext;
  onPaid: (appointment: Appointment) => void;
  onClose: () => void;
}

export function useCheckout({ appointment, companions = NO_APPOINTMENTS, candidates = NO_APPOINTMENTS, ctx, onPaid, onClose }: UseCheckoutOptions) {
  const t = useAppT();
  const checkout = useCheckoutAppointment();
  const update = useUpdateAppointment();
  const tipSettings = useSettingsSection("tips", tipsSchema);
  const cardFee = useSettingsSection("cardFee", cardFeeSchema);
  const devicesQuery = useSettingsList("devices", deviceSchema);
  const devices = devicesQuery.data?.items ?? [];

  // La cuenta.
  const [serviceIds, setServiceIds] = React.useState<string[]>(appointment.serviceIds);
  const [servicePrices, setServicePrices] = React.useState<(number | null)[]>(() => appointment.serviceIds.map((_, index) => appointment.servicePrices?.[index] ?? null));
  const [products, setProducts] = React.useState<ProductLine[]>(appointment.products);
  const [productPrices, setProductPrices] = React.useState<Record<string, number>>(appointment.productPrices ?? {});
  const [extraIds, setExtraIds] = React.useState<readonly string[]>([]);
  const [companionIds, setCompanionIds] = React.useState<readonly string[]>(() => companions.map((item) => item.id));
  /** Las citas sumadas al cobro quedan enlazadas con esta (una sola visita). */
  const [linkExtras, setLinkExtras] = React.useState(true);
  const [discountType, setDiscountType] = React.useState<DiscountType>("percent");
  const [discountValue, setDiscountValue] = React.useState<number | null>(null);
  const [discountReason, setDiscountReason] = React.useState("");
  const [giftSale, setGiftSale] = React.useState<GiftSaleDraft | null>(null);

  // El pago.
  const tipOptions: readonly TipChoice[] = tipSettings.data?.options.length ? tipSettings.data.options : FALLBACK_TIPS;
  const [tipChoice, setTipChoice] = React.useState<string>("none");
  const [customTip, setCustomTip] = React.useState<number | null>(null);
  const [payChoice, setPayChoice] = React.useState<PayChoice>("cash");
  const [received, setReceived] = React.useState<number | null>(null);
  const [deviceId, setDeviceId] = React.useState<string | null>(null);
  /** Mixto y en partes: cada línea con su forma de pago. */
  const [lines, setLines] = React.useState<PayLine[]>([]);
  /** «Personalizado» en partes: los montos los pone quien cobra. */
  const [customParts, setCustomParts] = React.useState(false);
  /** Con la tarjeta de regalo: con qué se paga lo que no cubre. */
  const [giftRest, setGiftRest] = React.useState<"cash" | "card">("cash");
  const [gift, setGift] = React.useState<{ code: string; balance: number } | null>(null);
  const [linkSent, setLinkSent] = React.useState(false);
  const [checkingGift, setCheckingGift] = React.useState(false);

  const client = findClient(ctx.catalog, appointment.clientId);
  const barber = findBarber(ctx.catalog, appointment.barberId);
  const services = servicesOf(ctx.catalog, { serviceIds, barberId: appointment.barberId });
  const extras = candidates.filter((item) => extraIds.includes(item.id));
  const together = [...companions.filter((item) => companionIds.includes(item.id)), ...extras];
  const prices = { servicePrices, productPrices };
  const pricesChanged = servicePrices.some((price) => price !== null) || Object.keys(productPrices).length > 0;

  // El descuento va sobre la cita abierta, a precio ya ajustado (antes de impuestos).
  const listBill = appointmentBill(ctx.catalog, serviceIds, products, appointment.online, appointment.barberId, prices);
  const discountBase = cents(listBill.subtotal - listBill.discount);
  const discount = discountAmount(discountValue ? { type: discountType, value: discountValue } : null, discountBase);
  const ownBill = appointmentBill(ctx.catalog, serviceIds, products, appointment.online, appointment.barberId, { ...prices, checkoutDiscount: discount });
  const togetherBills = together.map((item) => appointmentBill(ctx.catalog, item.serviceIds, item.products, item.online, item.barberId, item));
  const bill = sumBills([ownBill, ...togetherBills]);

  /** La propina de una opción (`none`, `custom` o el id de Configuración): se elige al pulsar «Cobrar». */
  const tipOf = (choice: string, custom: number | null = customTip): number => {
    const option = tipOptions.find((item) => item.id === choice);
    return choice === "custom" ? Math.max(0, custom ?? 0) : option ? tipAmount(option, bill.subtotal) : 0;
  };
  const giftSaleAmount = giftSale?.amount && giftSale.amount > 0 ? giftSale.amount : 0;
  const lined = payChoice === "mixed" || payChoice === "parts";
  /**
   * Lo que se cobra con una propina dada. La cuenta entera (`grand`) se reparte entre las formas de
   * pago; la tarjeta de regalo cubre de lo de esta cita, y el recargo va sobre lo que se pasa con tarjeta.
   */
  const amountsWith = (tipValue: number) => {
    const grand = cents(bill.due + tipValue + giftSaleAmount);
    const ownGrand = cents(ownBill.due + tipValue + giftSaleAmount);
    const shaped = payChoice === "mixed" ? mixedLines(lines, grand) : lines;
    const wantedGift = payChoice === "gift" ? grand : lined ? giftOf(shaped) : 0;
    const giftUsed = gift ? cents(Math.min(gift.balance, ownGrand, wantedGift)) : 0;
    const cardAmount = payChoice === "card" || (payChoice === "gift" && giftRest === "card") ? cents(grand - giftUsed) : payChoice === "mixed" ? cents(shaped.filter((line) => line.method === "card").reduce((sum, line) => sum + line.amount, 0)) : 0;
    // En mixto con varias citas las líneas se reparten entre ellas: ahí el recargo no se cobra.
    const fee = cardAmount > 0 && !(payChoice === "mixed" && together.length > 0) ? surchargeAmount(cardFee.data, "card", cardAmount) : 0;
    return { grand, giftApplied: giftUsed, lines: shaped, surcharge: fee, total: cents(grand - giftUsed + fee) };
  };
  const tip = tipOf(tipChoice);
  const { grand, giftApplied, lines: shownLines, surcharge, total } = amountsWith(tip);
  const change = payChoice === "cash" ? changeDue(received, total) : null;
  const linesLeft = lined ? cents(grand - linesTotal(shownLines)) : 0;
  const giftLines = giftOf(shownLines);

  /* ---------------------------------------------------------------- la cuenta */

  const setServicePrice = (index: number, price: number | null) => setServicePrices((current) => current.map((value, i) => (i === index ? price : value)));
  const removeService = (index: number) => {
    setServiceIds((current) => current.filter((_, i) => i !== index));
    setServicePrices((current) => current.filter((_, i) => i !== index));
  };
  const addService = (id: string) => {
    setServiceIds((current) => [...current, id]);
    setServicePrices((current) => [...current, null]);
  };
  const addProduct = (productId: string) =>
    setProducts((current) => {
      const existing = current.find((line) => line.productId === productId);
      return existing ? current.map((line) => (line.productId === productId ? { ...line, qty: line.qty + 1 } : line)) : [...current, { productId, qty: 1 }];
    });
  const setProductQty = (productId: string, qty: number) => setProducts((current) => (qty <= 0 ? current.filter((line) => line.productId !== productId) : current.map((line) => (line.productId === productId ? { ...line, qty } : line))));
  const setProductPrice = (productId: string, price: number | null) =>
    setProductPrices((current) => {
      const rest = Object.fromEntries(Object.entries(current).filter(([id]) => id !== productId));
      return price === null ? rest : { ...rest, [productId]: price };
    });
  const toggleCompanion = (id: string) => setCompanionIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  const addExtra = (id: string) => setExtraIds((current) => (current.includes(id) ? current : [...current, id]));
  const removeExtra = (id: string) => setExtraIds((current) => current.filter((item) => item !== id));

  /* ---------------------------------------------------------------- el pago */

  const firstDevice = devices[0]?.id;
  const choosePay = (next: PayChoice) => {
    setPayChoice(next);
    setLinkSent(false);
    if ((next === "card" || next === "gift") && !deviceId) setDeviceId(firstDevice ?? null);
    // Mixto: efectivo y tarjeta para empezar (se cambian); la segunda se lleva lo que falta.
    if (next === "mixed") setLines([{ method: "cash", amount: 0 }, { method: "card", amount: grand, deviceId: firstDevice }]);
    // En partes: dos iguales, efectivo y tarjeta, para empezar.
    if (next === "parts") {
      setCustomParts(false);
      setLines(equalLines(grand, PART_COUNT, (index) => (index === 0 ? { method: "cash" } : { method: "card", deviceId: firstDevice })));
    }
  };
  /** En partes: 2, 3 o 4 iguales, o `null` para ponerlos a mano (personalizado). */
  const setPartCount = (count: number | null) => {
    if (count === null) {
      setCustomParts(true);
      return;
    }
    setCustomParts(false);
    setLines((current) => equalLines(grand, count, (index) => ({ method: current[index]?.method ?? "card", ...(current[index]?.deviceId ? { deviceId: current[index].deviceId } : {}) })));
  };
  const updateLine = (index: number, patch: Partial<PayLine>) =>
    setLines((current) =>
      current.map((line, i) => {
        if (i !== index) return line;
        const next = { ...line, ...patch };
        // Cambiar de forma o de monto un link ya enviado obliga a mandarlo otra vez.
        if (line.method === "link" && (patch.method !== undefined || patch.amount !== undefined)) next.sent = false;
        if (next.method === "card" && !next.deviceId) next.deviceId = firstDevice;
        return next;
      })
    );
  const addLine = () => setLines((current) => [...current, { method: "cash", amount: Math.max(0, cents(grand - linesTotal(current))) }]);
  const removeLine = (index: number) => setLines((current) => (current.length > 2 ? current.filter((_, i) => i !== index) : current));

  const applyGift = async (code: string) => {
    if (!code.trim()) return;
    setCheckingGift(true);
    try {
      setGift(await calendarApi.checkGiftCard(code.trim()));
    } catch (error) {
      toast.error(describeError(error).title, { description: describeError(error).description });
    } finally {
      setCheckingGift(false);
    }
  };

  /**
   * Si se puede cobrar ya: el link se manda primero; con tarjeta de regalo, aplicada y con saldo; en
   * partes, tienen que cuadrar y cada link estar enviado.
   */
  const giftOk = !(payChoice === "gift" || giftLines > 0) || (gift !== null && giftLines <= gift.balance + 0.004);
  const linesOk = !lined || (Math.abs(linesLeft) <= 0.01 && shownLines.every((line) => line.method !== "link" || line.sent));
  const ready = services.length > 0 && !(payChoice === "link" && !linkSent) && giftOk && linesOk && !(giftSale && (!giftSale.amount || giftSale.recipientName.trim().length < 2));

  /** Cobra con la propina elegida en la ventana de «Cobrar» (en partes, la propina se suma a la última). */
  const pay = async (tipChoiceNow: string = tipChoice, customNow: number | null = customTip) => {
    setTipChoice(tipChoiceNow);
    setCustomTip(customNow);
    const tip = tipOf(tipChoiceNow, customNow);
    const { giftApplied, lines: payLines, surcharge, total } = amountsWith(tip);
    const ownDue = cents(ownBill.due + tip + giftSaleAmount - giftApplied);
    const dues = [ownDue, ...togetherBills.map((item) => item.due)];
    // Las líneas sin la tarjeta de regalo; en partes la propina (elegida al cobrar) va en la última.
    const paidLines = lined ? payLines.filter((line) => line.method !== "gift") : [];
    const withTip = payChoice === "parts" && paidLines.length > 0 ? paidLines.map((line, index) => (index === paidLines.length - 1 ? { ...line, amount: cents(line.amount + tip) } : line)) : paidLines;
    const asParts = withTip.map(({ method, amount, deviceId }) => ({ method: method as PaymentPart["method"], amount, ...(method === "card" && deviceId ? { deviceId } : {}) }));
    // Varias citas a la vez con líneas: se reparten en orden y cada una se cierra con lo suyo.
    const allocated = lined && together.length > 0 ? allocateParts(asParts, dues).map(paymentOf) : null;
    const simple = payChoice === "gift" ? giftRest : payChoice;
    const methodOf = (index: number): Pick<CheckoutInput, "method" | "parts" | "deviceId" | "split"> => {
      if (allocated) return allocated[index];
      if (lined) return paymentOfLines(withTip, surcharge);
      return { method: simple as PaymentMethod, ...(simple === "card" && deviceId ? { deviceId } : {}) };
    };
    try {
      const own: CheckoutInput = {
        serviceIds,
        products,
        tip,
        surcharge,
        ...methodOf(0),
        ...(pricesChanged ? { servicePrices, productPrices } : {}),
        ...(discount > 0 && discountValue ? { discount: { type: discountType, value: discountValue, reason: discountReason.trim() || undefined } } : {}),
        ...(gift && giftApplied > 0 ? { giftCode: gift.code, giftAmount: giftApplied } : {}),
        ...(giftSale && giftSaleAmount > 0 ? { giftSale: { amount: giftSaleAmount, recipientName: giftSale.recipientName.trim(), recipientContact: giftSale.recipientContact.trim() } } : {}),
      };
      const [paid, ...others] = await Promise.all([
        checkout.mutateAsync({ id: appointment.id, input: own }),
        ...together.map((item, index) => checkout.mutateAsync({ id: item.id, input: { serviceIds: item.serviceIds, products: item.products, tip: 0, surcharge: 0, ...methodOf(index + 1) } })),
      ]);
      // Las que se sumaron al cobro quedan enlazadas con esta, como una sola visita.
      if (linkExtras && extras.length > 0) {
        const linkId = appointment.linkId ?? newLinkId(appointment);
        await Promise.all([appointment, ...extras].filter((item) => item.linkId !== linkId).map((item) => update.mutateAsync({ id: item.id, patch: { linkId } })));
      }
      const charged = [paid, ...others].reduce((sum, item) => sum + (item.payment?.total ?? 0) - (item.payment?.prepaid ?? 0), 0);
      const methodLabel = payChoice === "parts" ? t("calendar.checkout.pay.partsDone") : payChoice === "gift" ? t("calendar.checkout.pay.gift") : t(PAYMENT_METHOD_KEYS[payChoice]);
      toast.success(others.length > 0 ? t("calendar.checkout.paidVisit", { count: others.length + 1 }) : t("calendar.checkout.paid"), {
        description: t("calendar.checkout.paidHint", { total: ctx.formatMoney(charged || total), method: methodLabel }),
      });
      onClose();
      onPaid(paid);
    } catch (error) {
      toast.error(describeError(error).title, { description: describeError(error).description });
    }
  };

  return {
    t,
    reservation: appointment.online?.reservation ?? "",
    client,
    barber,
    services,
    serviceIds,
    servicePrices,
    products,
    productPrices,
    companions,
    companionIds,
    candidates,
    extras,
    together,
    linkExtras,
    setLinkExtras,
    discountType,
    discountValue,
    discountReason,
    discount,
    giftSale,
    giftSaleAmount,
    tipOptions,
    tipChoice,
    customTip,
    tip,
    tipOf,
    totalWithTip: (tipValue: number) => amountsWith(tipValue).total,
    payChoice,
    received,
    change,
    deviceId,
    devices,
    lines: shownLines,
    linesLeft,
    customParts,
    giftRest,
    grand,
    gift,
    giftApplied,
    checkingGift,
    linkSent,
    bill,
    surcharge,
    total,
    cardFeeName: cardFee.data?.name || null,
    ready,
    paying: checkout.isPending,
    setServicePrice,
    removeService,
    addService,
    addProduct,
    setProductQty,
    setProductPrice,
    toggleCompanion,
    addExtra,
    removeExtra,
    setDiscountType,
    setDiscountValue,
    setDiscountReason,
    setGiftSale,
    setTipChoice,
    setCustomTip,
    choosePay,
    setReceived,
    setDeviceId,
    setPartCount,
    updateLine,
    addLine,
    removeLine,
    setGiftRest,
    applyGift,
    removeGift: () => setGift(null),
    markLinkSent: () => setLinkSent(true),
    pay,
  };
}

export type CheckoutController = ReturnType<typeof useCheckout>;
