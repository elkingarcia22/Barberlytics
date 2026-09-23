import { describe, expect, test } from "vitest";
import { render } from "@testing-library/react";
import { Marquee } from "./Marquee";

describe("Marquee", () => {
  test("duplica los items para que el bucle no tenga costura y es decorativo", () => {
    // Arrange
    const items = ["Fade", "Navaja", "Agenda"];

    // Act
    const { container } = render(<Marquee items={items} duration={30} />);
    const marquee = container.querySelector('[data-slot="marquee"]') as HTMLElement;

    // Assert
    expect(marquee).toHaveAttribute("aria-hidden", "true");
    expect(marquee.style.getPropertyValue("--marquee-duration")).toBe("30s");
    expect(marquee.querySelectorAll(".marquee-track > span")).toHaveLength(items.length * 2);
    expect(marquee.textContent).toContain("Navaja");
  });
});
