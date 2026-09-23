import type { AppMessages } from "@/i18n";
import { appEs } from "./es";
import { appEn } from "./en";

/**
 * El diccionario de esta aplicación, listo para `<LocaleProvider messages={…}>`.
 *
 * El francés no está: el mecanismo ya lo habla —el selector lo ofrece y las
 * fechas y los números se formatean— y las cadenas caen al inglés mientras
 * nadie las escriba. Añadirlo es crear `fr.ts` y sumarlo aquí.
 */
export const APP_MESSAGES: AppMessages = {
  es: appEs,
  en: appEn,
};

export { appEs, appEn };
export type { AppMessageKey, AppMessageCatalog } from "./types";
export { useAppT } from "./useAppT";
