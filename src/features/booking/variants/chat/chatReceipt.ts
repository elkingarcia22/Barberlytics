import type { useAppT } from "@/app/i18n";
import { describeError } from "@/lib/api";
import { splitMultipleAnswer } from "@/lib/chat";
import { bookingApi } from "../../api";
import type { BookingState } from "../../bookingState";
import { EMAIL, PHONE_DIGITS, type ChatTurn, type Expecting, type MessageInput } from "./chatKit";
import { makeQuestion, type BookingQuestion, type QuestionEntry } from "./chatQuestions";

/** Lo que se va armando: a dónde va el recibo y qué falta que escriba. */
export interface ReceiptPlan {
  emails: string[];
  phones: string[];
  needEmail: boolean;
  needPhone: boolean;
}

export type ReceiptStep = Extract<Expecting, "receiptEmail" | "receiptPhone">;
export const isReceiptStep = (value: Expecting): value is ReceiptStep => value === "receiptEmail" || value === "receiptPhone";

const COUNTRY = "57";
const plain = (value: string): string => value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const STOP = /\b(cancelar|cancela|mejor no|olvidalo|dejalo|ya no)\b/;
const BOTH = /\b(ambos|ambas|los dos|las dos|a todo|correo y (sms|mensaje|celular)|(sms|mensaje) y correo)\b/;
const BY_SMS = /\b(sms|mensaje|mensajito|celular|texto)\b/;
const BY_EMAIL = /\b(correo|mail|email|e-mail)\b/;
const emailsIn = (text: string): string[] => text.split(/[\s,;]+/).map((word) => word.replace(/[.,;]$/, "")).filter((word) => EMAIL.test(word));
/** «3001234567», «57 300 123 4567», «+57 300…»: el celular dentro de lo escrito, con su indicativo. */
function phoneIn(text: string): string | null {
  const digits = text.replace(/[^\d+]/g, "").replace(/^\+/, "");
  if (digits.length === PHONE_DIGITS) return `+${COUNTRY}${digits}`;
  if (digits.length === PHONE_DIGITS + COUNTRY.length && digits.startsWith(COUNTRY)) return `+${digits}`;
  return null;
}
const masked = (phone: string) => `•••• ${phone.replace(/\D/g, "").slice(-4)}`;

export interface ReceiptKit {
  t: ReturnType<typeof useAppT>;
  say: (...messages: MessageInput[]) => void;
  ask: (question: BookingQuestion, text?: string) => void;
  busy: <T>(work: () => Promise<T>) => Promise<T>;
  expect: (next: Expecting) => void;
  stateRef: { readonly current: BookingState };
  /** Deja la pregunta respondida con lo que se escribió. */
  settle: (turnId: string, label: string) => void;
  /** Lo que sigue después de mandarlo («¿Algo más?»). */
  askAfter: (text?: string) => void;
  /** Los destinos que se van juntando entre mensajes. */
  receiptPlan: { current: ReceiptPlan | null };
}

/**
 * El recibo por correo o por SMS, conversando: una lista en la que se eligen uno
 * o varios destinos —su correo, un SMS al celular con el que entró, otro correo,
 * otro número— y, si eligió «otro», el asistente se lo pide en la caja. También
 * se puede escribir sin tocar la lista («a los dos», «por SMS», un correo o un
 * celular). Al final lo manda a todos y dice a dónde llegó.
 */
export function createChatReceipt(kit: ReceiptKit) {
  const { t, say, ask, busy, expect, stateRef, settle, askAfter, receiptPlan: plan } = kit;

  /** El SMS va al celular con el que entró en esta conversación (el que verificó con el código). */
  const ownPhone = (): string => stateRef.current.phone || stateRef.current.customer?.phone || "";
  const ownEmail = (): string => stateRef.current.customer?.email ?? "";

  const askReceipt = (lead?: string) => {
    const email = ownEmail();
    const phone = ownPhone();
    const entries: QuestionEntry[] = [
      ...(email ? [{ label: t("booking.chat.receiptToEmail"), value: "email", description: email, emoji: "✉️" }] : []),
      ...(phone ? [{ label: t("booking.chat.receiptBySms"), value: "sms", description: masked(phone), emoji: "💬" }] : []),
      { label: t("booking.chat.receiptOtherEmail"), value: "otherEmail", emoji: "📧" },
      { label: t("booking.chat.receiptOtherPhone"), value: "otherPhone", emoji: "📱" },
    ];
    const intro = !email ? t("booking.chat.receiptAskEmail") : stateRef.current.customer?.isNew ? t("booking.chat.receiptConfirmNew") : t("booking.chat.receiptConfirm");
    ask(makeQuestion("receiptTo", t("booking.chat.receiptTitle"), entries, { hint: t("booking.chat.receiptHint"), multiple: { confirmLabel: t("booking.chat.receiptSend") } }), lead ?? intro);
  };

  const sendAll = async () => {
    const current = plan.current;
    const reservation = stateRef.current.reservation;
    plan.current = null;
    if (!current || !reservation) return;
    const targets = [...current.emails.map((to) => ({ channel: "email" as const, to })), ...current.phones.map((to) => ({ channel: "sms" as const, to }))];
    const results = await busy(() => Promise.allSettled(targets.map((target) => bookingApi.sendReceipt(reservation.id, target))));
    const sent = targets.filter((_, index) => results[index]?.status === "fulfilled").map((target) => (target.channel === "sms" ? t("booking.chat.receiptSmsTo", { phone: masked(target.to) }) : target.to));
    const failed = results.find((result): result is PromiseRejectedResult => result.status === "rejected");
    if (sent.length === 0) {
      say({ text: failed ? describeError(failed.reason).description : t("booking.chat.receiptNothing") });
      return askReceipt(t("booking.chat.receiptRetry"));
    }
    askAfter([t("booking.chat.receiptSentTo", { targets: sent.join(", ") }), failed ? describeError(failed.reason).description : ""].filter(Boolean).join(" "));
  };

  /** Pide lo que falta (otro correo, otro número) o, si ya está todo, lo manda. */
  const next = () => {
    const current = plan.current;
    if (!current) return;
    if (current.needEmail) {
      expect("receiptEmail");
      return say({ text: t("booking.chat.receiptAskOtherEmail") });
    }
    if (current.needPhone) {
      expect("receiptPhone");
      return say({ text: t("booking.chat.receiptAskOtherPhone") });
    }
    expect(null);
    void sendAll();
  };

  /** Lo elegido en la lista («Mi correo · SMS a mi celular · A otro número»). */
  const answerReceipt = (question: BookingQuestion, label: string) => {
    const picked = splitMultipleAnswer(label).map((part) => question.values[part]);
    plan.current = {
      emails: picked.includes("email") && ownEmail() ? [ownEmail()] : [],
      phones: picked.includes("sms") && ownPhone() ? [ownPhone()] : [],
      needEmail: picked.includes("otherEmail"),
      needPhone: picked.includes("otherPhone"),
    };
    next();
  };

  /** El otro correo o el otro número, escritos en la caja. */
  const submitTarget = (step: ReceiptStep, text: string) => {
    const current = plan.current;
    if (!current || STOP.test(plain(text))) {
      plan.current = null;
      expect(null);
      return askAfter(t("booking.chat.okay"));
    }
    if (step === "receiptEmail") {
      const found = emailsIn(text);
      if (found.length === 0) return say({ text: t("booking.chat.badEmail") });
      plan.current = { ...current, emails: [...current.emails, ...found], needEmail: false };
      return next();
    }
    const phone = phoneIn(text);
    if (!phone) return say({ text: t("booking.chat.receiptBadPhone") });
    plan.current = { ...current, phones: [...current.phones, phone], needPhone: false };
    next();
  };

  /**
   * Escrito en vez de tocado, con la lista abierta: «a los dos», «por SMS», «a mi correo»,
   * un correo o un celular. `false` si no se entiende como destino.
   */
  const answerTyped = (turn: ChatTurn, text: string): boolean => {
    if (turn.question?.kind !== "receiptTo") return false;
    const typed = plain(text);
    const emails = emailsIn(text);
    const phone = phoneIn(text.replace(/\S+@\S+/g, " "));
    const both = BOTH.test(typed);
    const wantsSms = both || (!phone && BY_SMS.test(typed));
    const wantsEmail = both || (emails.length === 0 && BY_EMAIL.test(typed));
    if (emails.length === 0 && !phone && !wantsSms && !wantsEmail) return false;
    settle(turn.id, text);
    plan.current = {
      emails: [...emails, ...(wantsEmail && ownEmail() ? [ownEmail()] : [])],
      phones: [...(phone ? [phone] : []), ...(wantsSms && ownPhone() ? [ownPhone()] : [])],
      // Pidió correo sin tener uno guardado: se lo pregunto.
      needEmail: wantsEmail && !ownEmail() && emails.length === 0,
      needPhone: false,
    };
    next();
    return true;
  };

  return { askReceipt, answerReceipt, submitTarget, answerTyped };
}
