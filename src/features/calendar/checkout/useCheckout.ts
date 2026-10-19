import * as React from "react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { describeError } from "@/lib/api";
import { useSettingsList, useSettingsSection } from "@/features/settings/settingsQueries";
import { cardFeeSchema, deviceSchema, tipsSchema } from "@/features/settings/settingsTypes";
import { findBarber, findClient, servicesOf, type ModelContext } from "../calendarModel";
import { FALLBACK_TIPS, appointmentBill, changeDue, discountAmount, equalParts, splitAcross, sumBills, surchargeAmount, tipAmount, type TipChoice } from "../checkoutMath";
import { useCheckoutAppointment } from "../queries";
import { PAYMENT_METHOD_KEYS, type Appointment, type CheckoutInput, type PaymentMethod, type PaymentPart, type ProductLine } from "../types";
import { calendarApi } from "../api";
import { allocateParts, paymentOf } from "./allocate";

/**
 * El estado del cobro de la caja, sin interfaz: la cuenta (citas que se
 * cobran juntas, servicios con su precio, productos, la tarjeta de regalo que
 * se vende y el descuento) y el pago (propina, la tarjeta de regalo del
 * cliente y cómo paga: efectivo, tarjeta con su datáfono, link, mixto o en
 * partes). Calcula lo que se cobra igual que el servidor y cierra cada cita
 * con lo suyo.
 */

/** Cómo paga: los métodos de siempre más «en partes» (cada parte con el suyo). */
export type PayChoice = PaymentMethod | "parts";
export type DiscountType = "percent" | "amount";

export interface GiftSaleDraft {
  amount: number | null;
  recipientName: string;
  recipientContact: string;
}

const NO_APPOINTMENTS: readonly Appointment[] = [];
const PART_COUNT = 2;
const cents = (value: number): number => Math.round(value * 100) / 100;

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
  const [cashPart, setCashPart] = React.useState<number | null>(null);
  const [deviceId, setDeviceId] = React.useState<string | null>(null);
  const [parts, setParts] = React.useState<PaymentPart[] | null>(null);
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
  const mixed = payChoice === "mixed";
  /** Lo que se cobra con una propina dada: la tarjeta de regalo paga primero; el recargo va sobre lo que se pasa con tarjeta. */
  const amountsWith = (tipValue: number) => {
    const giftUsed = gift ? cents(Math.min(gift.balance, ownBill.due + tipValue + giftSaleAmount)) : 0;
    const beforeFee = cents(bill.due + tipValue + giftSaleAmount - giftUsed);
    const cashNow = mixed ? Math.min(Math.max(0, cashPart ?? 0), beforeFee) : 0;
    const fee = payChoice === "card" ? surchargeAmount(cardFee.data, "card", cents(bill.due - giftUsed)) : mixed ? surchargeAmount(cardFee.data, "card", beforeFee - cashNow) : 0;
    return { giftApplied: giftUsed, cash: cashNow, surcharge: fee, total: cents(beforeFee + fee) };
  };
  const tip = tipOf(tipChoice);
  const { giftApplied, cash, surcharge, total } = amountsWith(tip);
  const change = payChoice === "cash" ? changeDue(received, total) : null;
  const partsTotal = parts ? cents(parts.reduce((sum, part) => sum + part.amount, 0)) : 0;
  const partsLeft = cents(total - partsTotal);

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

  const choosePay = (next: PayChoice) => {
    setPayChoice(next);
    setLinkSent(false);
    if (next === "card" && !deviceId) setDeviceId(devices[0]?.id ?? null);
    // En partes: dos iguales, efectivo y tarjeta, para empezar.
    if (next === "parts") setParts(equalParts(total, PART_COUNT).map((amount, index) => ({ method: index === 0 ? "cash" : "card", amount, ...(index === 0 || !devices[0] ? {} : { deviceId: devices[0].id }) })));
  };
  const setPartCount = (count: number) => setParts((current) => equalParts(total, count).map((amount, index) => ({ ...(current?.[index] ?? { method: "card" as const }), amount })));
  const updatePart = (index: number, patch: Partial<PaymentPart>) => setParts((current) => (current ?? []).map((part, i) => (i === index ? { ...part, ...patch } : part)));

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

  /** Si se puede cobrar ya: el link se manda primero; en partes, tienen que cuadrar. */
  const ready = services.length > 0 && !(payChoice === "link" && !linkSent) && !(payChoice === "parts" && Math.abs(partsLeft) > 0.01) && !(giftSale && (!giftSale.amount || giftSale.recipientName.trim().length < 2));

  /** Cobra con la propina elegida en la ventana de «Cobrar» (en partes, la propina se suma a la última). */
  const pay = async (tipChoiceNow: string = tipChoice, customNow: number | null = customTip) => {
    setTipChoice(tipChoiceNow);
    setCustomTip(customNow);
    const tip = tipOf(tipChoiceNow, customNow);
    const { giftApplied, cash, surcharge, total } = amountsWith(tip);
    const ownDue = cents(ownBill.due + tip + giftSaleAmount - giftApplied + (payChoice === "card" ? surcharge : 0));
    const dues = [ownDue, ...togetherBills.map((item) => item.due)];
    // Cómo se cierra cada cita: en partes se reparten en orden; en mixto, el efectivo se reparte y el resto va con tarjeta.
    const withTip = parts ? parts.map((part, index) => (index === parts.length - 1 ? { ...part, amount: cents(part.amount + tip) } : part)) : null;
    const allocated = payChoice === "parts" && withTip ? allocateParts(withTip, dues).map(paymentOf) : null;
    const mixedSplits = mixed ? splitAcross(cash, [cents(ownDue + surcharge), ...dues.slice(1)]) : [];
    const methodOf = (index: number): Pick<CheckoutInput, "method" | "parts" | "deviceId" | "split"> => {
      if (allocated) return allocated[index];
      if (mixed) return { method: "mixed", split: mixedSplits[index] };
      return { method: payChoice as PaymentMethod, ...(payChoice === "card" && deviceId ? { deviceId } : {}) };
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
      const charged = [paid, ...others].reduce((sum, item) => sum + (item.payment?.total ?? 0) - (item.payment?.prepaid ?? 0), 0);
      const methodLabel = payChoice === "parts" ? t("calendar.checkout.pay.partsDone") : t(PAYMENT_METHOD_KEYS[payChoice]);
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
    cashPart,
    cash,
    deviceId,
    devices,
    parts,
    partsLeft,
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
    setCashPart,
    setDeviceId,
    setPartCount,
    updatePart,
    applyGift,
    removeGift: () => setGift(null),
    markLinkSent: () => setLinkSent(true),
    pay,
  };
}

export type CheckoutController = ReturnType<typeof useCheckout>;
