import { describe, expect, test } from "vitest";
import { cutPointAt, OPEN_DEG, openingAt, scissorsAt, SNIP_COUNT, snipTimes, SWEEP_MS } from "./scissorsPath";

describe("scissorsPath", () => {
  test("los cortes caen dentro del cruce, en orden y repartidos", () => {
    // Act
    const snips = snipTimes();

    // Assert
    expect(snips).toHaveLength(SNIP_COUNT);
    expect(snips.every((at, index) => at > 0 && at < SWEEP_MS && (index === 0 || at > snips[index - 1]))).toBe(true);
  });

  test("cruzan de fuera a fuera por arriba de la pantalla", () => {
    // Arrange
    const width = 400;
    const height = 700;

    // Act
    const start = scissorsAt(0, width, height);
    const end = scissorsAt(SWEEP_MS, width, height);

    // Assert
    expect(start.x).toBeLessThan(0);
    expect(end.x).toBeGreaterThan(width);
    expect(start.y).toBeLessThan(height / 4);
  });

  test("las hojas se cierran del todo en cada corte y van abiertas entre cortes", () => {
    // Arrange
    const snips = snipTimes();

    // Act / Assert
    expect(openingAt(snips[0], snips)).toBeCloseTo(0);
    expect(openingAt(0, snips)).toBe(OPEN_DEG);
    expect(openingAt(snips[2] - 30, snips)).toBeGreaterThan(0);
    expect(openingAt(snips[2] - 30, snips)).toBeLessThan(OPEN_DEG);
  });

  test("el pelo sale por delante del tornillo, donde se cruzan las hojas", () => {
    // Act
    const pivot = scissorsAt(900, 400, 700);
    const cut = cutPointAt(900, 400, 700);

    // Assert
    expect(cut.x).toBeGreaterThan(pivot.x);
    expect(cut.y).toBe(pivot.y);
  });

  test("con una línea que cortar, van rectas sobre ella", () => {
    // Act
    const ys = [0, 500, 1000, SWEEP_MS].map((elapsed) => scissorsAt(elapsed, 400, 700, 56.5).y);

    // Assert
    expect(ys.every((y) => y === 56.5)).toBe(true);
    expect(cutPointAt(800, 400, 700, 56.5).y).toBe(56.5);
  });
});
