import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocaleProvider } from "./LocaleProvider";
import { LanguageSelector } from "./LanguageSelector";
import { useLocale } from "./localeContext";
import { resolveLocalized } from "./localized";
import { en, es } from "./messages";
import { LOCALE_STORAGE_KEY } from "./locales";

function Probe() {
  const { t, formatNumber, locale } = useLocale();
  return (
    <ul>
      <li data-testid="locale">{locale}</li>
      <li data-testid="cancel">{t("common.cancel")}</li>
      <li data-testid="one">{t("table.selected", { count: 1 })}</li>
      <li data-testid="many">{t("table.selected", { count: 4 })}</li>
      <li data-testid="number">{formatNumber(1284)}</li>
    </ul>
  );
}

/**
 * El inglés tiene que estar completo: es el recambio de todos los demás
 * idiomas, así que un hueco suyo se ve en francés y en cualquiera que venga.
 */
describe("diccionarios", () => {
  test("el inglés traduce todas las claves del español", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort());
  });

  test("ninguna traducción se quedó en blanco", () => {
    for (const [key, value] of Object.entries(en)) {
      expect(value, `en.${key}`).not.toBe("");
    }
  });
});

describe("LocaleProvider", () => {
  test("arranca en español y traduce con el diccionario fuente", () => {
    render(
      <LocaleProvider defaultLocale="es">
        <Probe />
      </LocaleProvider>
    );
    expect(screen.getByTestId("cancel").textContent).toBe("Cancelar");
  });

  test("cambiar de idioma cambia el texto y el formato de los números", async () => {
    window.localStorage.removeItem(LOCALE_STORAGE_KEY);
    render(
      <LocaleProvider defaultLocale="es">
        <LanguageSelector />
        <Probe />
      </LocaleProvider>
    );
    expect(screen.getByTestId("number").textContent).toBe("1.284");

    await userEvent.click(screen.getByRole("button", { name: /cambiar de idioma/i }));
    await userEvent.click(screen.getByRole("radio", { name: /English/ }));

    expect(screen.getByTestId("cancel").textContent).toBe("Cancel");
    // El separador de miles es del idioma, no del diccionario: lo pone `Intl`.
    expect(screen.getByTestId("number").textContent).toBe("1,284");
  });

  test("el plural usa la variante `_plural` solo cuando toca", () => {
    render(
      <LocaleProvider defaultLocale="es">
        <Probe />
      </LocaleProvider>
    );
    expect(screen.getByTestId("one").textContent).toBe("1 seleccionado");
    expect(screen.getByTestId("many").textContent).toBe("4 seleccionados");
  });

  test("un idioma a medio traducir cae al recambio en vez de dejar huecos", () => {
    // El francés está declarado pero vacío: debe leerse en inglés, no en la clave.
    render(
      <LocaleProvider defaultLocale="fr">
        <Probe />
      </LocaleProvider>
    );
    expect(screen.getByTestId("locale").textContent).toBe("fr");
    expect(screen.getByTestId("cancel").textContent).toBe("Cancel");
  });
});

describe("resolveLocalized", () => {
  test("una cadena suelta se devuelve tal cual", () => {
    expect(resolveLocalized("La acción del sistema.", "en")).toBe("La acción del sistema.");
  });

  test("un objeto por idioma devuelve el que toca", () => {
    const value = { es: "Botones", en: "Buttons" };
    expect(resolveLocalized(value, "es")).toBe("Botones");
    expect(resolveLocalized(value, "en")).toBe("Buttons");
  });

  test("sin traducción al idioma pedido, cae al inglés y luego al español", () => {
    expect(resolveLocalized({ es: "Botones", en: "Buttons" }, "fr")).toBe("Buttons");
    expect(resolveLocalized({ es: "Botones" }, "fr")).toBe("Botones");
  });
});
