import { splitMultipleAnswer } from "@/lib/chat";
import type { AppMessageKey } from "@/app/i18n";
import type { BookingQuestion } from "./chatQuestions";

/** Lo que se pide desde la cabecera de la conversación. */
export type ChatReplyId = "manage" | "restart";

export interface ChatTurn {
  id: string;
  from: "agent" | "user";
  text?: string;
  question?: BookingQuestion;
}

export type Message = Omit<ChatTurn, "id" | "from">;
/** Un mensaje, o una función que lo arma justo al decirlo (con las cuentas ya al día). */
export type MessageInput = Message | (() => Message | null);
/** Qué significa lo que se escriba en la caja ahora mismo. */
export type Expecting = "phone" | "code" | "firstName" | "lastName" | "email" | "note" | "cvc" | null;

export type PaymentEvent = { kind: "cardAdded"; last4: string } | { kind: "failed"; message: string };

/** El tiempo que «escribe» el asistente antes de cada mensaje; en pruebas, nada. */
export const TYPING_MS = import.meta.env.MODE === "test" ? 0 : 450;
export const DAYS_OFFERED = 14;
export const PHONE_DIGITS = 10;
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const RELATIONS: readonly AppMessageKey[] = ["booking.person.relation.child", "booking.person.relation.partner", "booking.person.relation.parent", "booking.person.relation.sibling", "booking.person.relation.friend", "booking.person.relation.other"];

export const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
export const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
export const firstName = (name: string) => name.split(" ")[0] ?? name;

let turnSeed = 0;
export const nextId = () => {
  turnSeed += 1;
  return `turn_${turnSeed}`;
};

/** La pregunta que se puede responder ahora: la última que se hizo, si no tiene respuesta. */
export function activeQuestionTurn(turns: readonly ChatTurn[]): ChatTurn | undefined {
  const last = [...turns].reverse().find((turn) => turn.question);
  return last && last.question?.answer === undefined ? last : undefined;
}

/** Si lo respondido es una de las opciones (o, con varias, todas lo son); si no, fue «Otro». */
export const isKnownAnswer = (question: BookingQuestion, label: string): boolean =>
  question.multiple ? splitMultipleAnswer(label).every((part) => question.options.includes(part)) : question.options.includes(label);

export interface Handlers {
  greet: () => void;
  reserved: () => void;
}

