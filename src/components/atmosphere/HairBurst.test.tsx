import { afterEach, describe, expect, test, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { HairBurst } from "./HairBurst";

function stubMatchMedia(matches: boolean) {
  window.matchMedia = (query: string) =>
    ({ matches, media: query, onchange: null, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false }) as MediaQueryList;
}

function stubCanvas(width = 400, height = 600) {
  const context = {
    setTransform: vi.fn(), clearRect: vi.fn(), save: vi.fn(), restore: vi.fn(), translate: vi.fn(), rotate: vi.fn(),
    beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(), strokeStyle: "", lineWidth: 0, lineCap: "butt", lineJoin: "miter", globalAlpha: 1,
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width, height, top: 0, left: 0, right: width, bottom: height, x: 0, y: 0, toJSON: () => ({}) });
  return context;
}

describe("HairBurst", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    stubMatchMedia(false);
  });

  test("estalla con pelos que se afinan hacia la punta al montarse", async () => {
    // Arrange
    stubMatchMedia(false);
    const context = stubCanvas();

    // Act
    const { container, unmount } = render(
      <div className="relative">
        <HairBurst count={12} />
      </div>
    );

    // Assert
    expect(container.querySelector("canvas")).toHaveAttribute("aria-hidden", "true");
    await waitFor(() => expect(context.stroke).toHaveBeenCalled());
    expect(context.lineTo).toHaveBeenCalled();
    // Colores de pelo de verdad, no los del tema.
    expect(context.strokeStyle).toMatch(/^#[0-9a-f]{6}$/);
    unmount();
  });

  test("avisa al terminar la ráfaga", async () => {
    // Arrange
    stubMatchMedia(false);
    stubCanvas();
    let now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      now += 400;
      return window.setTimeout(() => callback(now), 0);
    });
    const onDone = vi.fn();

    // Act
    render(
      <div className="relative">
        <HairBurst count={4} onDone={onDone} />
      </div>
    );

    // Assert
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
  });

  test("en una pantalla ancha sale de varios focos repartidos a lo ancho", () => {
    // Arrange: 1080 px son tres tramos de 360 px; un pelo por foco.
    stubMatchMedia(false);
    const context = stubCanvas(1080, 700);
    let frame: FrameRequestCallback | null = null;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      frame = callback;
      return 1;
    });

    // Act: el primer fotograma, recién nacidos.
    render(
      <div className="relative">
        <HairBurst count={1} />
      </div>
    );
    (frame as FrameRequestCallback | null)?.(performance.now());

    // Assert: tres pelos, uno por foco, cada uno cerca de su tercio del ancho.
    const starts = context.translate.mock.calls.map(([x]) => x as number);
    expect(starts).toHaveLength(3);
    expect(starts.map((x) => Math.floor(x / 360)).sort()).toEqual([0, 1, 2]);
  });

  test("con prefers-reduced-motion no se monta y termina enseguida", () => {
    // Arrange
    stubMatchMedia(true);
    const onDone = vi.fn();

    // Act
    const { container } = render(<HairBurst onDone={onDone} />);

    // Assert
    expect(container.querySelector("canvas")).toBeNull();
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
