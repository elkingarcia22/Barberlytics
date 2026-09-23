/**
 * El idioma del sistema de diseño.
 *
 * Dos capas, a propósito:
 *
 * 1. **Las cadenas del sistema** (`t("common.cancel")`): las que traen los
 *    componentes de fábrica. Viven en `messages/`, son pocas y las mismas en
 *    todo el producto. No necesitan ninguna librería externa.
 * 2. **El contenido de cada aplicación**: sus pantallas, sus datos, sus
 *    textos. Eso lo traduce cada app con la herramienta que prefiera
 *    (react-i18next, FormatJS…); del sistema solo toma `useLocale()` para
 *    compartir el idioma activo y el mismo selector.
 *
 * Para el contenido largo que sí vive en este repo —la documentación— está
 * `Localized<T>`: un campo acepta la cadena de siempre o un objeto por idioma.
 */
export { LocaleProvider } from "./LocaleProvider";
export { LanguageSelector, LanguagePickerPanel, type LanguageSelectorProps } from "./LanguageSelector";
export {
  useLocale,
  useT,
  LocaleContext,
  type LocaleContextValue,
  type MessageParams,
  type TranslationKey,
  type AppMessages,
} from "./localeContext";
export { createLocaleValue, DEFAULT_LOCALE_VALUE } from "./createLocaleValue";
export { useLocalized, useLocalizer } from "./useLocalized";
export { resolveLocalized, type Localized } from "./localized";
export {
  LOCALES,
  DEFAULT_LOCALE,
  SOURCE_LOCALE,
  FALLBACK_LOCALE,
  LOCALE_STORAGE_KEY,
  findLocale,
  isLocaleId,
  detectBrowserLocale,
  type LocaleId,
  type LocaleOption,
} from "./locales";
export { MESSAGES, es, en, type MessageKey, type MessageCatalog, type PartialMessageCatalog } from "./messages";
