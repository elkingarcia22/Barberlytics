import { describe, expect, test, vi } from "vitest";
import { createDemoBackend } from "./demoBackend";

describe("createDemoBackend", () => {
  test("un pedido abierto contesta con una pregunta con opciones para acotarlo", async () => {
    vi.useFakeTimers();
    const backend = createDemoBackend({ delay: 0 });

    const promise = backend.reply("Prepárame un plan corto de feedback para los líderes de Ventas.", [], new AbortController().signal);
    await vi.runAllTimersAsync();
    const reply = await promise;

    expect(reply.question?.options.length).toBeGreaterThanOrEqual(3);
    expect(reply.question?.otherPlaceholder).toBeTruthy();
  });

  test("con la opción ya elegida en el historial contesta con el plan y sugerencias", async () => {
    vi.useFakeTimers();
    const backend = createDemoBackend({ delay: 0 });
    const history = [
      { id: "1", role: "user" as const, text: "Prepárame un plan corto de feedback", createdAt: 1, status: "done" as const },
      { id: "2", role: "agent" as const, text: "¿Cuántas sesiones?", createdAt: 2, status: "done" as const, question: { options: ["1", "2", "3 sesiones"], answer: "3 sesiones" } },
      { id: "3", role: "user" as const, text: "3 sesiones", createdAt: 3, status: "done" as const },
    ];

    const promise = backend.reply("3 sesiones", history, new AbortController().signal);
    await vi.runAllTimersAsync();
    const reply = await promise;

    expect(reply.question).toBeUndefined();
    expect(reply.text).toMatch(/3/);
    expect(reply.followups?.length).toBeGreaterThan(0);
  });

  test("participación trae una tarjeta de barras", async () => {
    vi.useFakeTimers();
    const backend = createDemoBackend({ delay: 0 });

    const promise = backend.reply("Dime cómo va la participación de Ventas Bogotá este mes", [], new AbortController().signal);
    await vi.runAllTimersAsync();
    const reply = await promise;

    expect(reply.card?.kind).toBe("bars");
    expect(reply.sources?.length).toBeGreaterThan(0);
  });

  test("respeta la cancelación", async () => {
    vi.useFakeTimers();
    const backend = createDemoBackend({ delay: 1000 });
    const controller = new AbortController();

    const promise = backend.reply("hola", [], controller.signal);
    controller.abort();

    await expect(promise).rejects.toThrow();
  });
});
