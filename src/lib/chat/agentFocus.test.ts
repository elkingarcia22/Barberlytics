import { describe, expect, test, vi } from "vitest";
import { agentFocus, withAgentFocus, type AgentFocus } from "./agentFocus";
import type { ChatBackend } from "./types";

const focus: AgentFocus = {
  title: "Cita de Marcela",
  suggestions: ["¿Alergias?"],
  answer: (question) => (question.includes("alerg") ? { text: "Sin alergias." } : null),
};

describe("withAgentFocus", () => {
  test("answers what the focus knows and leaves the rest to the usual backend", async () => {
    const base: ChatBackend = { reply: vi.fn(async () => ({ text: "De la ayuda." })) };
    const backend = withAgentFocus(base, focus);
    const signal = new AbortController().signal;
    await expect(backend.reply("¿tiene alergias?", [], signal)).resolves.toEqual({ text: "Sin alergias." });
    await expect(backend.reply("¿cómo exporto?", [], signal)).resolves.toEqual({ text: "De la ayuda." });
    expect(base.reply).toHaveBeenCalledTimes(1);
  });
});

describe("agentFocus", () => {
  test("each open is a new request, and clearing forgets the focus", () => {
    const listener = vi.fn();
    const unsubscribe = agentFocus.subscribe(listener);
    const before = agentFocus.getState().request;
    agentFocus.open(focus);
    agentFocus.open(focus);
    expect(agentFocus.getState().request).toBe(before + 2);
    agentFocus.clear();
    expect(agentFocus.getState().focus).toBeNull();
    expect(listener).toHaveBeenCalledTimes(3);
    unsubscribe();
  });
});
