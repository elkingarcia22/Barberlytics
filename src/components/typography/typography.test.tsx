import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { Heading } from "./Heading";
import { Text } from "./Text";

describe("Heading", () => {
  test("renderiza la etiqueta que corresponde a cada nivel", () => {
    render(
      <>
        <Heading level={1}>Uno</Heading>
        <Heading level={2}>Dos</Heading>
        <Heading level={6}>Seis</Heading>
      </>
    );
    expect(screen.getByText("Uno").tagName).toBe("H1");
    expect(screen.getByText("Dos").tagName).toBe("H2");
    expect(screen.getByText("Seis").tagName).toBe("H6");
  });

  test("con `as` cambia la etiqueta pero conserva el tamaño del nivel", () => {
    render(
      <Heading level={2} as="p">
        Cabecera visual
      </Heading>
    );
    const el = screen.getByText("Cabecera visual");
    expect(el.tagName).toBe("P");
    expect(el).toHaveAttribute("data-level", "2");
    expect(el).toHaveClass("text-3xl", "font-semibold", "text-text-primary");
  });

  test("aplica peso, tono y truncado", () => {
    render(
      <Heading level={3} weight="bold" tone="muted" truncate>
        Título
      </Heading>
    );
    expect(screen.getByText("Título")).toHaveClass("font-bold", "text-text-muted", "truncate");
  });
});

describe("Text", () => {
  test("por defecto es un párrafo de 14px con el color primario", () => {
    render(<Text>Cuerpo</Text>);
    const el = screen.getByText("Cuerpo");
    expect(el.tagName).toBe("P");
    expect(el).toHaveClass("text-sm", "text-text-primary");
  });

  test("el tono explícito gana al tono del variant", () => {
    render(
      <Text variant="caption" tone="negative">
        Error
      </Text>
    );
    const el = screen.getByText("Error");
    expect(el).toHaveClass("text-xs", "text-destructive");
    expect(el).not.toHaveClass("text-text-muted");
  });

  test("variant=\"code\" usa span y fuente monoespaciada", () => {
    render(<Text variant="code">npm run dev</Text>);
    const el = screen.getByText("npm run dev");
    expect(el.tagName).toBe("SPAN");
    expect(el).toHaveClass("font-mono", "text-xs");
  });

  test("`as` gana a la etiqueta del variant y `tabular` activa tabular-nums", () => {
    render(
      <Text variant="lead" as="span" tabular>
        1.024
      </Text>
    );
    const el = screen.getByText("1.024");
    expect(el.tagName).toBe("SPAN");
    expect(el).toHaveClass("text-base", "text-text-secondary", "tabular-nums");
  });
});
