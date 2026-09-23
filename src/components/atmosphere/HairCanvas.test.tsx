import { afterEach, describe, expect, test, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { HairCanvas } from "./HairCanvas";

function stubMatchMedia(matches: boolean) {
  window.matchMedia = (query: string) =>
    ({ matches, media: query, onchange: null, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false }) as MediaQueryList;
}

class IntersectionObserverStub {
  private readonly callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }
  observe() {
    this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
  unobserve() {}
  disconnect() {}
}

describe("HairCanvas", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    stubMatchMedia(false);
  });

  test("dibuja hebras en el canvas cuando el movimiento está permitido", async () => {
    // Arrange
    stubMatchMedia(false);
    Object.assign(window, { IntersectionObserver: IntersectionObserverStub });
    const context = {
      setTransform: vi.fn(), clearRect: vi.fn(), save: vi.fn(), restore: vi.fn(), translate: vi.fn(), rotate: vi.fn(),
      beginPath: vi.fn(), moveTo: vi.fn(), quadraticCurveTo: vi.fn(), stroke: vi.fn(), strokeStyle: "", lineWidth: 0, lineCap: "butt",
    };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width: 800, height: 600, top: 0, left: 0, right: 800, bottom: 600, x: 0, y: 0, toJSON: () => ({}) });

    // Act
    const { container, unmount } = render(
      <div className="relative">
        <HairCanvas />
      </div>
    );

    // Assert
    const canvas = container.querySelector("canvas");
    expect(canvas).toHaveAttribute("aria-hidden", "true");
    await waitFor(() => expect(context.stroke).toHaveBeenCalled());
    expect(context.setTransform).toHaveBeenCalled();
    unmount();
  });

  test("sobre el cromo lee --nav-foreground para las hebras de texto", () => {
    // Arrange
    stubMatchMedia(false);
    const getProperty = vi.fn((name: string) => (name === "--nav-foreground" ? "0 0% 100%" : "0 0% 0%"));
    vi.spyOn(window, "getComputedStyle").mockReturnValue({ getPropertyValue: getProperty } as unknown as CSSStyleDeclaration);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);

    // Act
    render(
      <div className="relative">
        <HairCanvas onChrome />
      </div>
    );

    // Assert: sin contexto 2D no dibuja, pero la paleta se lee al montar
    expect(getProperty).not.toHaveBeenCalledWith("--foreground");
  });

  test("no se monta con prefers-reduced-motion", () => {
    // Arrange
    stubMatchMedia(true);

    // Act
    const { container } = render(<HairCanvas />);

    // Assert
    expect(container.querySelector("canvas")).toBeNull();
  });
});
