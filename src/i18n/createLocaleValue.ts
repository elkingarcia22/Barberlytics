import { FALLBACK_LOCALE, SOURCE_LOCALE, LOCALES, findLocale, type LocaleId } from "./locales";
import { MESSAGES } from "./messages";
import type { AppMessages, LocaleContextValue, MessageParams, TranslationKey } from "./localeContext";

/**
 * Mete los parámetros en la cadena: `"{count} seleccionados"` + `{ count: 3 }`.
 * Un parámetro que no venga se deja tal cual en vez de imprimir "undefined":
 * un hueco visible se corrige; un "undefined" en pantalla se explica.
 */
function interpolate(message: string, params?: MessageParams): string {
  if (!params) return message;
  return message.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

/**
 * Busca la clave en el idioma pedido, luego en el recambio y por último en la
 * fuente. Con `count` distinto de 1 prueba antes la variante `_plural`.
 *
 * En cada idioma mira primero el diccionario de la aplicación y después el del
 * sistema: así una app puede traer sus propias cadenas —y, si le hace falta,
 * pisar una del sistema— sin tocar este paquete.
 */
function resolveMessage(
  locale: LocaleId,
  key: TranslationKey,
  app: AppMessages | undefined,
  params?: MessageParams
): string {
  const chain: LocaleId[] = [locale, FALLBACK_LOCALE, SOURCE_LOCALE];
  const count = params?.count;
  const wantsPlural = typeof count === "number" && count !== 1;

  for (const candidate of chain) {
    const catalogs = [app?.[candidate], MESSAGES[candidate]];
    for (const catalog of catalogs) {
      if (!catalog) continue;
      if (wantsPlural) {
        const plural = (catalog as Record<string, string>)[`${key}_plural`];
        if (plural) return plural;
      }
      const message = (catalog as Record<string, string>)[key];
      if (message) return message;
    }
  }
  // Ni en la fuente: la clave misma es mejor pista que una cadena vacía.
  return key;
}

/**
 * El valor del contexto para un idioma, con sus traducciones y sus formatos.
 * `app` es el diccionario propio de la aplicación, si lo trae.
 */
export function createLocaleValue(
  locale: LocaleId,
  setLocale: (locale: LocaleId) => void,
  app?: AppMessages
): LocaleContextValue {
  const current = findLocale(locale);
  const tag = current.intl;
  return {
    locale,
    setLocale,
    locales: LOCALES,
    current,
    t: (key, params) => interpolate(resolveMessage(locale, key, app, params), params),
    formatNumber: (value, options) => new Intl.NumberFormat(tag, options).format(value),
    formatDate: (value, options) => new Intl.DateTimeFormat(tag, options).format(value),
    formatRelativeTime: (value, unit) =>
      new Intl.RelativeTimeFormat(tag, { numeric: "auto" }).format(value, unit),
  };
}

/**
 * El idioma que se usa cuando nadie montó un `LocaleProvider`.
 *
 * A diferencia de `useTheme`, esto **no** lanza: un componente del sistema
 * suelto —en una prueba, en un playground, en una app que todavía no montó el
 * proveedor— tiene que seguir pintándose. Sin tokens de color un componente no
 * se ve; sin idioma sí, y en la lengua fuente. Cambiar de idioma es lo único
 * que no hace nada sin proveedor, porque no hay dónde guardarlo.
 */
export const DEFAULT_LOCALE_VALUE: LocaleContextValue = createLocaleValue(SOURCE_LOCALE, () => {
  /* sin proveedor no hay estado que mover */
});
