import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@/themes";
import { BrandSlot } from "./BrandSlot";
import { logoShape } from "./brandLogo";

const renderSlot = (ui: React.ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

describe("logoShape", () => {
  test.each([
    [512, 512, "compact"],
    [300, 400, "compact"],
    [400, 200, "compact"],
    [880, 400, "wide"],
    [1000, 200, "wide"],
  ] as const)("%i × %i es %s", (width, height, shape) => {
    expect(logoShape(width, height)).toBe(shape);
  });

  test("una imagen sin alto no es horizontal", () => {
    expect(logoShape(100, 0)).toBe("compact");
  });
});

describe("BrandSlot", () => {
  test("isologo: nombre al lado y la línea debajo", () => {
    const { container } = renderSlot(<BrandSlot name="La Esquina" tagline="Barbería" display="isologo" />);
    expect(screen.getByText("La Esquina")).toBeTruthy();
    expect(screen.getByText("Barbería")).toBeTruthy();
    // Sin isologo propio va la flecha de Barberlytics, decorativa: el nombre ya dice de quién es.
    expect(container.querySelector('[aria-hidden] svg[aria-label="Barberlytics"]')).toBeTruthy();
  });

  test("wordmark sin logo propio: logotipo Barberlytics y la línea, sin repetir el nombre", () => {
    renderSlot(<BrandSlot name="Thema" tagline="Sistema de diseño" display="wordmark" />);
    expect(screen.queryByText("Thema")).toBeNull();
    expect(screen.getByText("Sistema de diseño")).toBeTruthy();
  });

  test("con logo de empresa siempre es isologo, aunque pidan wordmark", () => {
    renderSlot(<BrandSlot name="La Esquina" display="wordmark" logo={{ src: "data:image/png;base64,AAAA" }} />);
    expect(screen.getByText("La Esquina")).toBeTruthy();
  });
});
