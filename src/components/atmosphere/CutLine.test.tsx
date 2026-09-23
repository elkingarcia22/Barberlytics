import { describe, expect, test } from "vitest";
import { render } from "@testing-library/react";
import { CutLine } from "./CutLine";

describe("CutLine", () => {
  test("se revela de inmediato sin IntersectionObserver y mide su ancho para la animación", () => {
    // Arrange · jsdom no trae IntersectionObserver: useReveal marca el nodo al montar.
    const { container } = render(<CutLine />);
    const line = container.querySelector('[data-slot="cut-line"]') as HTMLElement;

    // Assert
    expect(line).toHaveAttribute("aria-hidden", "true");
    expect(line.dataset.revealed).toBe("true");
    expect(line.style.getPropertyValue("--cut-w")).toMatch(/px$/);
    expect(line.querySelector(".cut-solid")).not.toBeNull();
    expect(line.querySelector(".cut-scissors svg")).not.toBeNull();
  });
});
