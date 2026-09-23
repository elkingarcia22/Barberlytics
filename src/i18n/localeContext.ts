import * as React from "react";
import type { LocaleId, LocaleOption } from "./locales";
import type { MessageKey } from "./messages";
// Sin ciclo en tiempo de ejecución: `createLocaleValue` solo importa tipos de
// este archivo, y los tipos se borran al compilar.
import { DEFAULT_LOCALE_VALUE } from "./createLocaleValue";

/** Valores que se meten en una cadena: `t("table.selected", { count: 3 })`. */
export type MessageParams = Readonly<Record<string, string | number>>;

/**
 * Lo que acepta `t()`: las claves del sistema —con autocompletado— más las
 * que traiga la aplicación en su propio diccionario. El `string & {}` es el
 * truco que mantiene las sugerencias del editor sin cerrar el tipo.
 */
export type TranslationKey = MessageKey | (string & {});

/**
 * El diccionario propio de una aplicación, por idioma. Se pasa a
 * `<LocaleProvider messages={…}>` y se consulta antes que el del sistema, así
 * que una app puede sumar sus cadenas y pisar las que necesite.
 */
export type AppMessages = Partial<Record<LocaleId, Readonly<Record<string, string>>>>;

export interface LocaleContextValue {
  /** Idioma activo. */
  locale: LocaleId;
  setLocale: (locale: LocaleId) => void;
  /** Los idiomas que el sistema ofrece. */
  locales: readonly LocaleOption[];
  /** La ficha del idioma activo (nombre, etiqueta BCP 47). */
  current: LocaleOption;
  /**
   * Traduce una clave. Si el idioma activo no la tiene, cae al inglés y luego
   * al español, así que siempre devuelve texto legible, nunca la clave cruda.
   */
  t: (key: TranslationKey, params?: MessageParams) => string;
  /** Números con la convención del idioma activo (1.284 en español, 1,284 en inglés). */
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  /** Fechas con la convención del idioma activo. */
  formatDate: (value: Date | number, options?: Intl.DateTimeFormatOptions) => string;
  /** "hace 3 días" / "3 days ago", sin tabla de traducciones propia. */
  formatRelativeTime: (value: number, unit: Intl.RelativeTimeFormatUnit) => string;
}

export const LocaleContext = React.createContext<LocaleContextValue | null>(null);

/**
 * El idioma activo. Sin `LocaleProvider` arriba devuelve el idioma fuente en
 * vez de lanzar: una pieza del sistema montada suelta tiene que seguir
 * pintándose (ver `DEFAULT_LOCALE_VALUE`).
 */
export function useLocale(): LocaleContextValue {
  return React.useContext(LocaleContext) ?? DEFAULT_LOCALE_VALUE;
}

/**
 * Atajo para el caso normal: solo traducir.
 *
 * ```tsx
 * const t = useT();
 * <Button>{t("common.cancel")}</Button>
 * ```
 */
export function useT(): LocaleContextValue["t"] {
  return useLocale().t;
}
