import type { AppMessageKey } from "@/app/i18n";
import type { MessagePurpose } from "./relationship";

/** Las plantillas de los mensajes 1 a 1 desde la ficha: el equipo las edita antes de abrir WhatsApp. */

type Translate = (key: AppMessageKey, params?: Readonly<Record<string, string | number>>) => string;

export const PURPOSE_KEYS: Readonly<Record<MessagePurpose, AppMessageKey>> = {
  thanks: "customers.whatsapp.purpose.thanks",
  rebook: "customers.whatsapp.purpose.rebook",
  birthday: "customers.whatsapp.purpose.birthday",
  free: "customers.whatsapp.purpose.free",
};

const BODY_KEYS: Readonly<Record<Exclude<MessagePurpose, "free">, AppMessageKey>> = {
  thanks: "customers.whatsapp.body.thanks",
  rebook: "customers.whatsapp.body.rebook",
  birthday: "customers.whatsapp.body.birthday",
};

export interface TemplateContext {
  name: string;
  shop: string;
  barber: string | null;
  /** Días desde su última visita (o un marcador, al escribirles a varios); `null` si nunca vino. */
  daysSince: number | string | null;
  bookingUrl: string;
}

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

/** El texto de partida para cada propósito; «libre» arranca con el saludo. */
export function templateBody(t: Translate, purpose: MessagePurpose, context: TemplateContext): string {
  const name = firstName(context.name);
  if (purpose === "free") return t("customers.whatsapp.body.free", { name });
  return t(BODY_KEYS[purpose], { name, shop: context.shop, barber: context.barber ?? t("customers.whatsapp.anyBarber"), days: context.daysSince ?? 0, link: context.bookingUrl });
}
