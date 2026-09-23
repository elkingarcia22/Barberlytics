import { describe, expect, test } from "vitest";
import { render } from "@testing-library/react";
import { RotatingSeal } from "./RotatingSeal";

describe("RotatingSeal", () => {
  test("pone el texto en el anillo y la flecha del logo en el centro", () => {
    // Act
    const { container } = render(<RotatingSeal text="Cohorte 02 · Invitación ·" size={96} />);
    const seal = container.querySelector('[data-slot="rotating-seal"]') as HTMLElement;

    // Assert
    expect(seal).toHaveAttribute("aria-hidden", "true");
    expect(seal.style.width).toBe("96px");
    expect(seal.querySelector("textPath")?.textContent).toBe("Cohorte 02 · Invitación ·");
    expect(seal.querySelector('svg[data-slot="barberlytics-logo"], span svg')).not.toBeNull();
  });

  test("admite otra pieza central", () => {
    // Act
    const { getByText } = render(
      <RotatingSeal>
        <strong>01</strong>
      </RotatingSeal>
    );

    // Assert
    expect(getByText("01")).toBeInTheDocument();
  });
});
