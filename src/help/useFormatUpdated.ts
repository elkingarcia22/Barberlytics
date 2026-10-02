import { useLocale } from "@/i18n";

/** «Actualizado el 24 de septiembre de 2026», en el idioma activo. */
export function useFormatUpdated() {
  const { locale } = useLocale();
  return (updated: string) => {
    const date = new Date(`${updated}T12:00:00`);
    if (Number.isNaN(date.getTime())) return updated;
    return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-CO", { dateStyle: "long" }).format(date);
  };
}
