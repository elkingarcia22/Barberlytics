import type { useAppT } from "@/app/i18n";
import { describeError } from "@/lib/api";
import { bookingApi } from "../../api";
import type { BookingAction, BookingState } from "../../bookingState";
import type { BookingShop } from "../../types";
import { capitalize, EMAIL, type Expecting, type MessageInput } from "./chatKit";
import { makeQuestion, type BookingQuestion } from "./chatQuestions";
import { codeFromText, phoneFromText } from "./parseBookingText";

export interface IdentityKit {
  t: ReturnType<typeof useAppT>;
  shop: BookingShop;
  apply: (action: BookingAction) => void;
  say: (...messages: MessageInput[]) => void;
  ask: (question: BookingQuestion, text?: string) => void;
  busy: <T>(work: () => Promise<T>) => Promise<T>;
  expect: (next: Expecting) => void;
  expecting: { readonly current: Expecting };
  stateRef: { readonly current: BookingState };
  /** El perfil del cliente nuevo mientras lo escribe (nombre, apellido, correo). */
  profile: { current: { firstName: string; lastName: string; email: string } };
  askPhone: (text?: string) => void;
  /** Si el celular que escribe ya tiene que confirmarse con código (va a pagar o a «Mis citas»). */
  needsCode: () => boolean;
  /** El celular (de un cliente nuevo) quedó anotado sin código: se sigue armando la cita. */
  onPhoneSaved: () => void;
}

/**
 * Quién es, conversando: el celular (solo números) al empezar. Si ya es cliente, el código va ya (para
 * saludarlo con lo de siempre); si es nuevo, se arma la cita sin código y este se pide al pagar (o al
 * pedir «Mis citas»). La primera vez, además, nombre y apellido, correo y el permiso de promociones.
 * Todo se escribe en la caja; el código no se repite en el hilo.
 */
export function useChatIdentity(kit: IdentityKit) {
  const { t, shop, apply, say, ask, busy, expect, expecting, stateRef, profile, askPhone, needsCode, onPhoneSaved } = kit;

  /** Manda el código al celular y queda esperándolo. */
  const sendCode = async (phone: string) => {
    try {
      const sent = await busy(() => bookingApi.requestOtp(phone));
      apply({ type: "codeSent", phone, sentTo: sent.sentTo, channel: sent.channel });
      expect("code");
      say({
        // Siempre «por mensaje de texto», también en la conversación escrita (la voz ya lo decía así).
        text: `${t("booking.chat.codeSms", { phone: sent.sentTo })}\n\n${t("booking.chat.codeHelp")}`,
      });
    } catch (error) {
      say({ text: describeError(error).description });
    }
  };

  const submitPhone = async (text: string) => {
    // Con palabras alrededor («mi número es 320 217 27 38»), guiones o espacios: solo cuentan las cifras.
    const phone = phoneFromText(text);
    if (!phone) return say({ text: t("booking.chat.badPhone") });
    if (needsCode()) return sendCode(phone);
    // Solo si ya es cliente: al de siempre le llega el código ya (y su saludo con lo de siempre); el nuevo sigue sin código.
    let returning: boolean;
    try {
      returning = (await busy(() => bookingApi.checkPhone(phone))).returning;
    } catch (error) {
      return say({ text: describeError(error).description });
    }
    if (returning) return sendCode(phone);
    apply({ type: "phoneEntered", phone });
    expect(null);
    say({ text: t("booking.chat.phoneSaved") });
    onPhoneSaved();
  };

  const submitCode = async (text: string) => {
    const code = codeFromText(text);
    if (!code) return say({ text: t("booking.chat.needCode") });
    try {
      const result = await busy(() => bookingApi.verifyOtp(stateRef.current.phone, code));
      if (result.status === "known") {
        expect(null);
        return apply({ type: "customerFound", customer: result.customer, token: result.token });
      }
      if (result.status === "new") {
        apply({ type: "customerIsNew", token: result.token });
        expect("firstName");
        return say({ text: t("booking.chat.newHello", { shop: shop.name }) });
      }
      expect(null);
      apply({ type: "customerBlocked" });
      ask(makeQuestion("blocked", t("booking.chat.blockedTitle"), [{ label: t("booking.chat.callShop"), value: "call" }, { label: t("booking.blocked.other"), value: "other" }]), t("booking.chat.blocked"));
    } catch (error) {
      say({ text: describeError(error).description });
    }
  };

  /** Primera vez: nombre y apellido, correo y el permiso para promociones (sin marcar de entrada, Ley 1581). */
  const submitProfileText = (text: string) => {
    const value = text.trim();
    if (expecting.current === "firstName") {
      const [first = "", ...rest] = value.split(/\s+/);
      if (first.length < 2) return say({ text: t("booking.chat.askName") });
      profile.current = { ...profile.current, firstName: capitalize(first), lastName: rest.map(capitalize).join(" ") };
      if (!profile.current.lastName) {
        expect("lastName");
        return say({ text: t("booking.chat.askLastName", { name: profile.current.firstName }) });
      }
    } else if (expecting.current === "lastName") {
      if (value.length < 2) return say({ text: t("booking.chat.askLastName", { name: profile.current.firstName }) });
      profile.current = { ...profile.current, lastName: value.split(/\s+/).map(capitalize).join(" ") };
    } else if (expecting.current === "email") {
      if (!EMAIL.test(value)) return say({ text: t("booking.chat.badEmail") });
      profile.current = { ...profile.current, email: value };
      expect(null);
      return ask(makeQuestion("consent", t("booking.chat.consentTitle", { shop: shop.name }), [{ label: t("booking.chat.consentYes"), value: "yes" }, { label: t("booking.chat.consentNo"), value: "no" }], { hint: t("booking.chat.consentHint") }));
    }
    expect("email");
    say({ text: t("booking.chat.askEmail", { name: profile.current.firstName }) });
  };

  const createProfile = async (marketing: boolean) => {
    const token = stateRef.current.token;
    if (!token) return askPhone();
    try {
      const customer = await busy(() => bookingApi.createCustomer(token, { ...profile.current, marketing }));
      apply({ type: "customerUpdated", customer });
    } catch (error) {
      expect("email");
      say({ text: `${describeError(error).description} ${t("booking.chat.askEmailAgain")}` });
    }
  };

  return { submitPhone, sendCode, submitCode, submitProfileText, createProfile };
}
