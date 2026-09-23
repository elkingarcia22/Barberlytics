import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { Enter } from "./Enter";
import { Reveal } from "./Reveal";

describe("Reveal y Enter", () => {
  test("Reveal se marca visible al montar sin observador y aplica el retardo como transición", () => {
    // Act
    render(
      <ul>
        <Reveal as="li" delay={120}>
          Etapa
        </Reveal>
      </ul>
    );
    const item = screen.getByText("Etapa");

    // Assert
    expect(item.tagName).toBe("LI");
    expect(item).toHaveClass("reveal");
    expect(item.dataset.revealed).toBe("true");
    expect(item.style.transitionDelay).toBe("120ms");
  });

  test("Enter no depende de ningún observador y escalona con animationDelay", () => {
    // Act
    render(<Enter delay={80}>Titular</Enter>);
    const block = screen.getByText("Titular");

    // Assert
    expect(block).toHaveClass("enter");
    expect(block.style.animationDelay).toBe("80ms");
    expect(block.dataset.revealed).toBeUndefined();
  });
});
