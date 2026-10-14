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
        <HairBurst />
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
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      now += 400;
      return window.setTimeout(() => callback(now), 0);
    });
    const onDone = vi.fn();

    // Act
    render(
      <div className="relative">
        <HairBurst density={1} onDone={onDone} />
      </div>
    );

    // Assert
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
  });

  test("cae desde arriba a todo lo ancho, con más pelos en una pantalla ancha", () => {
    // Arrange: 1000 px de ancho a 2 pelos por cada 100 px son 20 pelos.
    stubMatchMedia(false);
    const context = stubCanvas(1000, 700);
    let frame: FrameRequestCallback | null = null;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      frame = callback;
      return 1;
    });
    const tick = (now: number) => (frame as FrameRequestCallback | null)?.(now);

    // Act: el primer fotograma arranca el reloj; el segundo llega cuando ya se soltaron todos.
    render(
      <div className="relative">
        <HairBurst density={2} />
      </div>
    );
    tick(0);
    context.translate.mockClear();
    tick(1500);

    // Assert: veinte pelos, todos todavía en la mitad de arriba y repartidos a lo ancho.
    const positions = context.translate.mock.calls.map(([x, y]) => [x as number, y as number]);
    expect(positions).toHaveLength(20);
    expect(positions.every(([, y]) => y < 350)).toBe(true);
    expect(Math.max(...positions.map(([x]) => x)) - Math.min(...positions.map(([x]) => x))).toBeGreaterThan(400);
  });

  test("con tijeras, el pelo sale de los cortes y las tijeras cruzan encima", () => {
    // Arrange
    stubMatchMedia(false);
    const context = stubCanvas(1000, 700);
    let frame: FrameRequestCallback | null = null;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      frame = callback;
      return 1;
    });
    const tick = (now: number) => (frame as FrameRequestCallback | null)?.(now);

    // Act: a los 2,1 s ya cortaron las seis veces.
    const { container } = render(
      <div className="relative">
        <HairBurst density={2} scissors />
      </div>
    );
    tick(0);
    context.translate.mockClear();
    tick(2100);

    // Assert: las tijeras están montadas y los veinte pelos salieron de la franja de arriba, a lo ancho.
    expect(container.querySelector('[data-slot="cutting-scissors"]')).not.toBeNull();
    const positions = context.translate.mock.calls.map(([x, y]) => [x as number, y as number]);
    expect(positions).toHaveLength(20);
    expect(positions.every(([, y]) => y < 350)).toBe(true);
    expect(Math.max(...positions.map(([x]) => x)) - Math.min(...positions.map(([x]) => x))).toBeGreaterThan(400);
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
