import * as React from "react";

/**
 * Las preferencias de cada persona, no de la empresa: por ahora, el formato de
 * hora con el que ve su calendario («solo se reflejará en tu calendario», como
 * en producción). Mientras el contrato no tenga `/me/preferences`, se guardan en
 * este navegador; si el almacenamiento falla, se usa el del negocio.
 */
export type PersonalTimeFormat = "business" | "12h" | "24h";

const STORAGE_KEY = "thema.personal.timeFormat";
const VALUES: readonly PersonalTimeFormat[] = ["business", "12h", "24h"];

export function readPersonalTimeFormat(): PersonalTimeFormat {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return VALUES.includes(value as PersonalTimeFormat) ? (value as PersonalTimeFormat) : "business";
  } catch {
    return "business";
  }
}

export function writePersonalTimeFormat(value: PersonalTimeFormat): boolean {
  try {
    if (value === "business") window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, value);
    return true;
  } catch {
    return false;
  }
}

/** El formato propio y cómo cambiarlo; el cambio se recuerda entre visitas. */
export function usePersonalTimeFormat(): [PersonalTimeFormat, (value: PersonalTimeFormat) => boolean] {
  const [value, setValue] = React.useState<PersonalTimeFormat>(readPersonalTimeFormat);
  const update = React.useCallback((next: PersonalTimeFormat) => {
    setValue(next);
    return writePersonalTimeFormat(next);
  }, []);
  return [value, update];
}
