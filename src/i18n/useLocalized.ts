import * as React from "react";
import { useLocale } from "./localeContext";
import { resolveLocalized, type Localized } from "./localized";

/**
 * La versión hook de `resolveLocalized`: resuelve un texto traducible con el
 * idioma activo.
 *
 * ```tsx
 * const description = useLocalized(entry.description);
 * ```
 */
export function useLocalized<T>(value: Localized<T>): T {
  const { locale } = useLocale();
  return React.useMemo(() => resolveLocalized(value, locale), [value, locale]);
}

/** El resolutor suelto, para resolver varios textos de una lista. */
export function useLocalizer(): <T>(value: Localized<T>) => T {
  const { locale } = useLocale();
  return React.useCallback(<T,>(value: Localized<T>) => resolveLocalized(value, locale), [locale]);
}
