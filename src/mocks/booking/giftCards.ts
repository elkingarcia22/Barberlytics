import { db } from "../db";
import type { MockGiftCard } from "./state";

/**
 * Tarjetas de regalo: se compran con tarjeta para alguien (llega su código por WhatsApp) y se
 * usan al pagar una reserva; el saldo que sobra queda para la próxima. La demo trae una de
 * prueba (`DEMO_GIFT_CODE`). Los códigos no distinguen mayúsculas ni guiones.
 */

export const DEMO_GIFT_CODE = "REGALO-50";
const DEMO_GIFT: MockGiftCard = {
  code: DEMO_GIFT_CODE,
  initial: 50,
  balance: 50,
  buyerId: null,
  recipientName: "Cliente de prueba",
  recipientContact: "",
  message: "",
  createdAt: "2026-09-01T12:00:00.000Z",
};

const normalize = (code: string): string => code.toUpperCase().replace(/[^A-Z0-9]/g, "");
const all = (): MockGiftCard[] => {
  const cards = db.booking.giftCards ?? [];
  return cards.some((card) => card.code === DEMO_GIFT_CODE) ? cards : [DEMO_GIFT, ...cards];
};

export const findGiftCard = (code: string): MockGiftCard | undefined => all().find((card) => normalize(card.code) === normalize(code));

/** Un código legible y difícil de adivinar: «BL-7KQ4-M2XP». */
function newCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const pick = () => Array.from(crypto.getRandomValues(new Uint32Array(4)), (value) => alphabet[value % alphabet.length]).join("");
  return `BL-${pick()}-${pick()}`;
}

export function createGiftCard(input: Omit<MockGiftCard, "code" | "balance" | "createdAt">): MockGiftCard {
  const card: MockGiftCard = { ...input, code: newCode(), balance: input.initial, createdAt: new Date().toISOString() };
  db.booking.giftCards = [...all(), card];
  return card;
}

/** Descuenta lo usado; devuelve el saldo que queda. */
export function spendGiftCard(code: string, amount: number): number {
  const card = findGiftCard(code);
  if (!card) return 0;
  const balance = Math.round(Math.max(0, card.balance - amount) * 100) / 100;
  db.booking.giftCards = all().map((item) => (item.code === card.code ? { ...item, balance } : item));
  return balance;
}
