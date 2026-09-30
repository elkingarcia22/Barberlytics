import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { LocaleProvider } from "@/i18n";
import { APP_MESSAGES } from "@/app/i18n";
import { HelpMarkdown } from "./HelpMarkdown";
import { prepareBody } from "./prepareBody";
import type { HelpIndex } from "@/lib/help";

function renderMarkdown(body: string) {
  return render(
    <LocaleProvider messages={APP_MESSAGES}>
      <MemoryRouter>
        <HelpMarkdown body={body} />
      </MemoryRouter>
    </LocaleProvider>
  );
}

describe("HelpMarkdown", () => {
  test("un aviso `> [!TIP]` se vuelve un Alert sin la marca", () => {
    renderMarkdown("> [!TIP]\n> Pide un código nuevo antes de reintentar.");
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Pide un código nuevo antes de reintentar.");
    expect(alert).not.toHaveTextContent("[!TIP]");
  });

  test("una imagen se vuelve una figura con su pie", () => {
    renderMarkdown("![La pantalla de código](/assets/es/acceso/ingresar/codigo.png)");
    const image = screen.getByRole("img", { name: "La pantalla de código" });
    expect(image.getAttribute("src")).toMatch(/\/assets\/es\/acceso\/ingresar\/codigo\.png$/);
    expect(screen.getByText("La pantalla de código", { selector: "figcaption" })).toBeInTheDocument();
  });

  test("los encabezados llevan ancla y los enlaces internos son del router", () => {
    renderMarkdown("## Errores que puedes ver\n\nMira [este artículo](/ayuda/acceso/otro).");
    expect(screen.getByRole("heading", { level: 2 })).toHaveAttribute("id", "errores-que-puedes-ver");
    expect(screen.getByRole("link", { name: "este artículo" })).toHaveAttribute("href", "/ayuda/acceso/otro");
  });

  test("una tecla en código corto se pinta como Kbd y el código largo no", () => {
    renderMarkdown("Pulsa `⌘K` o escribe `npm run dev`.");
    expect(document.querySelector("kbd")).toHaveTextContent("⌘K");
    expect(screen.getByText("npm run dev").tagName).toBe("CODE");
  });

  test("una tabla usa la tabla del sistema", () => {
    renderMarkdown("| Pantalla | Qué hacer |\n|---|---|\n| «Error» | Reintenta |");
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Pantalla" })).toBeInTheDocument();
  });
});

describe("prepareBody", () => {
  const index = { articles: { "a/b": { title: "Artículo B" } } } as unknown as HelpIndex;

  test("quita el título y resuelve los enlaces [[id]] con el título del índice", () => {
    expect(prepareBody("# Título\n\nMira [[a/b]] y [[c/d|otro]].", index)).toBe("Mira [Artículo B](/ayuda/a/b) y [otro](/ayuda/c/d).");
  });
});
