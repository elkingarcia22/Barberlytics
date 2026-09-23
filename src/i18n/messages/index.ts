import type { LocaleId } from "../locales";
import { es } from "./es";
import { en } from "./en";
import type { PartialMessageCatalog } from "./types";

/**
 * Los diccionarios por idioma. El francés está declarado pero vacío a
 * propósito: el mecanismo ya lo habla —el selector lo ofrece, `Intl` formatea
 * sus fechas y sus números— y las cadenas se van sumando sin tocar código.
 */
export const MESSAGES: Readonly<Record<LocaleId, PartialMessageCatalog>> = {
  es,
  en,
  fr: {},
};

export { es, en };
export type { MessageKey, MessageCatalog, PartialMessageCatalog } from "./types";
