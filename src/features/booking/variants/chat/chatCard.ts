import type { useAppT } from "@/app/i18n";
import type { BookingState } from "../../bookingState";
import { cardBrandOf, cvcLengthOf, digitsOf, expiryOk, groupCard, type CardBrand } from "../../flow/cardValidation";
import { NEW_CARD } from "../../flow/SavedCardPicker";
import type { PaymentController } from "../../flow/usePaymentController";
import { makeQuestion, type BookingQuestion } from "./chatQuestions";
import type { Expecting, MessageInput } from "./chatKit";

const MIN_CARD = 13;
const MAX_CARD = 19;
const MIN_HOLDER = 3;
const BRAND_LABEL: Readonly<Record<Exclude<CardBrand, "other">, string>> = { visa: "Visa", mastercard: "Mastercard", amex: "Amex" };

/** Los pasos de la tarjeta nueva en la caja: número, titular, vencimiento y CVC. */
export type CardStep = Extract<Expecting, "cardNumber" | "cardName" | "cardExpiry" | "cardCvc">;
export const isCardStep = (value: Expecting): value is CardStep => value === "cardNumber" || value === "cardName" || value === "cardExpiry" || value === "cardCvc";

const plain = (value: string): string => value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const STOP = /\b(cancelar|cancela|otra forma|otro metodo|mejor no|cambiar metodo)\b/;

/** «1228», «12 28», «12/2028» → «12/28». */
export function normalizeExpiry(text: string): string {
  const digits = digitsOf(text);
  if (digits.length === 6) return `${digits.slice(0, 2)}/${digits.slice(4)}`;
  if (digits.length === 3) return `0${digits.slice(0, 1)}/${digits.slice(1)}`;
  return digits.length === 4 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : text.trim();
}

/** Cómo se ve en el hilo lo que se escribe en cada paso: el número y el CVC nunca enteros. */
export function maskCardInput(step: CardStep, text: string): string {
  const digits = digitsOf(text);
  if (step === "cardNumber") return digits.length >= 4 ? `•••• ${digits.slice(-4)}` : "••••";
  if (step === "cardCvc") return "•".repeat(Math.max(3, Math.min(4, digits.length)));
  if (step === "cardExpiry") return normalizeExpiry(text);
  return text.trim();
}

/** La tarjeta a medio escribir: un dato llega en cada mensaje. */
export interface CardDraft {
  number: string;
  name: string;
  expiry: string;
  cvc: string;
}

export const EMPTY_CARD: CardDraft = { number: "", name: "", expiry: "", cvc: "" };

export interface CardKit {
  t: ReturnType<typeof useAppT>;
  say: (...messages: MessageInput[]) => void;
  ask: (question: BookingQuestion, text?: string) => void;
  expect: (next: Expecting) => void;
  stateRef: { readonly current: BookingState };
  payment: { readonly current: PaymentController | null };
  cardDraft: { current: CardDraft };
  /** Volver a elegir cómo pagar (si se arrepiente a mitad de la tarjeta). */
  askMethod: (lead?: string) => void;
}

/**
 * La tarjeta nueva dentro de la conversación: el asistente pide un dato a la
 * vez —número, nombre como aparece en la tarjeta, vencimiento y CVC—, revisa
 * cada uno al llegar y, al final, pregunta si se guarda para la próxima. En el
 * hilo el número se ve como «•••• 4242» y el CVC como «•••». Los datos van al
 * mismo cobro de las otras versiones (`usePaymentController`).
 */
export function useChatNewCard(kit: CardKit) {
  const { t, say, ask, expect, stateRef, payment, askMethod, cardDraft: values } = kit;
  const draft = EMPTY_CARD;

  const brandName = (number: string): string => {
    const brand = cardBrandOf(number);
    return brand === "other" ? t("booking.chat.cardGeneric") : BRAND_LABEL[brand];
  };

  const start = (lead?: string) => {
    values.current = { ...draft };
    expect("cardNumber");
    say({ text: [lead, t("booking.chat.cardAskNumber")].filter(Boolean).join("\n\n") });
  };

  /** Un paso de la tarjeta con lo que se escribió; pide el siguiente o vuelve a pedir el mismo. */
  const submit = (step: CardStep, text: string) => {
    if (STOP.test(plain(text))) {
      expect(null);
      values.current = { ...draft };
      return askMethod(t("booking.chat.cardStopped"));
    }
    const current = values.current;
    if (step === "cardNumber") {
      const digits = digitsOf(text);
      if (digits.length < MIN_CARD || digits.length > MAX_CARD) return say({ text: t("booking.chat.cardBadNumber") });
      values.current = { ...current, number: groupCard(digits) };
      expect("cardName");
      return say({ text: t("booking.chat.cardAskName", { card: `${brandName(digits)} •••• ${digits.slice(-4)}` }) });
    }
    if (step === "cardName") {
      if (text.trim().length < MIN_HOLDER) return say({ text: t("booking.chat.cardBadName") });
      values.current = { ...current, name: text.trim().toUpperCase() };
      expect("cardExpiry");
      return say({ text: t("booking.chat.cardAskExpiry") });
    }
    if (step === "cardExpiry") {
      const expiry = normalizeExpiry(text);
      if (!/^\d{2}\/\d{2}$/.test(expiry) || !expiryOk(expiry)) return say({ text: t("booking.chat.cardBadExpiry") });
      values.current = { ...current, expiry };
      expect("cardCvc");
      return say({ text: t("booking.chat.cardAskCvc", { count: cvcLengthOf(cardBrandOf(current.number)) }) });
    }
    const cvc = digitsOf(text);
    if (cvc.length !== cvcLengthOf(cardBrandOf(current.number))) return say({ text: t("booking.chat.cardBadCvc", { count: cvcLengthOf(cardBrandOf(current.number)) }) });
    values.current = { ...current, cvc };
    expect(null);
    if (!stateRef.current.customer) return deliver(false);
    ask(makeQuestion("cardSave", t("booking.chat.cardSaveTitle"), [{ label: t("booking.chat.cardSaveYes"), value: "yes", emoji: "🔒" }, { label: t("booking.chat.cardSaveNo"), value: "no" }], { hint: t("booking.chat.cardSaveHint") }));
  };

  /** Entrega la tarjeta al cobro; el cobro avisa (`cardAdded`) y la conversación sigue con el resumen. */
  const deliver = (save: boolean) => {
    const controller = payment.current;
    if (!controller) return;
    controller.setCard({ ...values.current });
    controller.setSaveCard(save);
    controller.setCardChoice(NEW_CARD);
    controller.setShowCardErrors(false);
    if (controller.reserve.isError) controller.reserve.reset();
    values.current = { ...draft };
  };

  /** La respuesta a «¿La guardo para la próxima?»; `false` si la pregunta no es de aquí. */
  const answerCard = (question: BookingQuestion, value: string | null): boolean => {
    if (question.kind !== "cardSave") return false;
    deliver(value === "yes");
    return true;
  };

  return { start, submit, answerCard };
}
