import type { LocaleId } from "./locales";
import { FALLBACK_LOCALE, SOURCE_LOCALE } from "./locales";

/**
 * Un texto que puede estar traducido o no.
 *
 * El diccionario (`t()`) sirve para las cadenas del sistema: son pocas, fijas
 * y las mismas en todas partes. Pero el contenido —la descripción de un
 * componente, el título de un ejemplo, la línea de una guía— es largo, vive
 * junto a lo que describe y se escribe de a poco. Para eso está esto: un
 * campo acepta la cadena de siempre (español, como está hoy) o un objeto por
 * idioma, y se puede subir de uno a otro archivo a archivo sin migrar nada
 * de golpe.
 *
 * ```ts
 * description: "La acción del sistema."                       // como hoy
 * description: { es: "La acción del sistema.", en: "The system's action." }
 * ```
 */
export type Localized<T = string> = T | Partial<Record<LocaleId, T>>;

/**
 * Un `ReactNode` también es un objeto, así que sin esta guarda un `<span>`
 * pasaría por mapa de traducciones y se perdería por el camino.
 */
function isReactElement(value: unknown): boolean {
  return typeof value === "object" && value !== null && "$$typeof" in (value as object);
}

function isTranslationMap<T>(value: Localized<T>): value is Partial<Record<LocaleId, T>> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && !isReactElement(value);
}

/**
 * Resuelve el texto para un idioma: el pedido, si no el inglés, si no el
 * español. Nunca devuelve vacío mientras la fuente esté escrita.
 */
export function resolveLocalized<T>(value: Localized<T>, locale: LocaleId): T {
  if (!isTranslationMap(value)) return value;
  return (value[locale] ?? value[FALLBACK_LOCALE] ?? value[SOURCE_LOCALE]) as T;
}
