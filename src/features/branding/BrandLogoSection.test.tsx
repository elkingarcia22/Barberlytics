import { describe, expect, test, vi } from "vitest";
import { renderWithProviders, screen, userEvent } from "@/test/render";
import { BrandLogoSection } from "./BrandLogoSection";

const LOGO = { src: "data:image/png;base64,AAAA" };

describe("BrandLogoSection", () => {
  test("restablecer pide confirmación antes de quitar el logo", async () => {
    const onReset = vi.fn();
    renderWithProviders(<BrandLogoSection logo={LOGO} name="La Esquina" onChange={vi.fn()} onReset={onReset} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Restablecer logo de Barberlytics" }));
    expect(onReset).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onReset).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Restablecer logo de Barberlytics" }));
    await user.click(screen.getByRole("button", { name: "Restablecer" }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  test("sin logo propio no ofrece restablecer", () => {
    renderWithProviders(<BrandLogoSection logo={null} name="La Esquina" onChange={vi.fn()} onReset={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Restablecer logo de Barberlytics" })).toBeNull();
  });
});
