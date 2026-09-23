import { enUS, es, fr, type Locale } from "date-fns/locale";
import type { LocaleId } from "@/i18n";

/**
 * El objeto `Locale` de date-fns para cada idioma del sistema.
 *
 * La rejilla del calendario (react-day-picker sobre date-fns) no entiende
 * etiquetas BCP 47: necesita el objeto del idioma, y con él traduce sola los
 * nombres de mes, los días de la semana y por qué día empieza la semana. Es
 * el único sitio donde hace falta traer traducciones de fuera; el resto de
 * las fechas las formatea `Intl`, que ya viene en el navegador.
 */
const CALENDAR_LOCALES: Readonly<Record<LocaleId, Locale>> = {
  es,
  en: enUS,
  fr,
};

export function calendarLocale(locale: LocaleId): Locale {
  return CALENDAR_LOCALES[locale] ?? enUS;
}
