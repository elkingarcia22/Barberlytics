import { describe, expect, test } from "vitest";
import type { CommentThread } from "@/components/comments";
import { diffThreads, freshThreadIds, reduceEvents, type CommentEvent } from "./commentEvents";

const ana = { id: "a", name: "Ana" };
const luis = { id: "l", name: "Luis" };
const at = (minute: number) => `2026-10-16T10:${String(minute).padStart(2, "0")}:00.000Z`;

const thread = (overrides: Partial<CommentThread> = {}): CommentThread => ({
  id: "t1",
  x: 10,
  y: 20,
  context: "mixed:tablet",
  contextLabel: "Según el cliente · Tablet",
  resolved: false,
  unread: false,
  messages: [{ id: "m1", author: ana, body: "El botón no se ve", createdAt: at(0) }],
  ...overrides,
});

describe("diffThreads", () => {
  test("un hilo nuevo es una acción «create» con su primer mensaje", () => {
    const events = diffThreads([], [thread()], ana, at(0));
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ action: "create", threadId: "t1", messageId: "m1", authorName: "Ana", body: "El botón no se ve", x: 10, y: 20, context: "mixed:tablet" });
  });

  test("responder, resolver, reabrir y eliminar son acciones aparte", () => {
    const base = thread();
    const replied = thread({ messages: [...base.messages, { id: "m2", author: luis, body: "Ya lo arreglo", createdAt: at(1) }] });
    expect(diffThreads([base], [replied], luis, at(1)).map((event) => [event.action, event.authorName])).toEqual([["reply", "Luis"]]);
    expect(diffThreads([replied], [{ ...replied, resolved: true }], luis, at(2)).map((event) => event.action)).toEqual(["resolve"]);
    expect(diffThreads([{ ...replied, resolved: true }], [replied], luis, at(3)).map((event) => event.action)).toEqual(["reopen"]);
    expect(diffThreads([replied], [], luis, at(4)).map((event) => event.action)).toEqual(["delete"]);
  });

  test("marcar leído o no leído no genera nada: es de cada navegador", () => {
    expect(diffThreads([thread()], [thread({ unread: true })], ana)).toEqual([]);
  });
});

describe("reduceEvents", () => {
  test("reconstruye el hilo con sus respuestas y su estado, en orden", () => {
    const base = thread();
    const replied = thread({ messages: [...base.messages, { id: "m2", author: luis, body: "Ya lo arreglo", createdAt: at(1) }] });
    const events = [...diffThreads([], [base], ana, at(0)), ...diffThreads([base], [replied], luis, at(1)), ...diffThreads([replied], [{ ...replied, resolved: true }], luis, at(2))];
    const [result] = reduceEvents(events);
    expect(result.messages.map((message) => message.body)).toEqual(["El botón no se ve", "Ya lo arreglo"]);
    expect(result.resolved).toBe(true);
  });

  test("una acción repetida (mismo id) no se cuenta dos veces", () => {
    const events = diffThreads([], [thread()], ana, at(0));
    expect(reduceEvents([...events, ...events])).toHaveLength(1);
  });

  test("eliminar quita el hilo y una respuesta sin hilo se ignora", () => {
    const created = diffThreads([], [thread()], ana, at(0));
    const removed = diffThreads([thread()], [], ana, at(1));
    expect(reduceEvents([...created, ...removed])).toEqual([]);
    const orphan: CommentEvent = { id: "x", at: at(2), action: "reply", threadId: "nada", messageId: "m9", authorId: "l", authorName: "Luis", body: "¿?" };
    expect(reduceEvents([orphan])).toEqual([]);
  });
});

describe("freshThreadIds", () => {
  const reply = (author: typeof ana, id: string) => ({ id, author, body: "…", createdAt: at(5) });

  test("lo que llega de otra persona queda sin leer; lo propio nunca", () => {
    const { fresh } = freshThreadIds([thread({ id: "de-ana" }), thread({ id: "mio", messages: [reply(luis, "m9")] })], new Map(), luis.id, true);
    expect(fresh).toEqual(["de-ana"]);
  });

  test("solo cuenta como nuevo si el hilo tiene más mensajes que la vez anterior", () => {
    const first = freshThreadIds([thread()], new Map(), luis.id, true);
    // La misma llegada otra vez: nada nuevo.
    expect(freshThreadIds([thread()], first.known, luis.id, true).fresh).toEqual([]);
    // Ana responde: vuelve a quedar sin leer.
    const answered = thread({ messages: [...thread().messages, reply(ana, "m2")] });
    expect(freshThreadIds([answered], first.known, luis.id, true).fresh).toEqual(["t1"]);
    // Si el último mensaje es mío, no.
    const mine = thread({ messages: [...thread().messages, reply(luis, "m3")] });
    expect(freshThreadIds([mine], first.known, luis.id, true).fresh).toEqual([]);
  });

  test("antes de la primera llegada del servidor solo se anota el recuento", () => {
    const { fresh, known } = freshThreadIds([thread()], new Map(), luis.id, false);
    expect(fresh).toEqual([]);
    expect(known.get("t1")).toBe(1);
  });

  test("no toca el recuento que recibe: devuelve uno nuevo", () => {
    const known = new Map<string, number>();
    freshThreadIds([thread()], known, luis.id, true);
    expect(known.size).toBe(0);
  });
});
