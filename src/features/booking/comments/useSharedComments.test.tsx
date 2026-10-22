import { afterEach, describe, expect, test, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { isPlatformThread } from "@/lib/comments/scope";
import type { CommentEvent } from "./commentEvents";
import { useSharedComments } from "./useSharedComments";

const author = { id: "a", name: "Ana" };
const create = (threadId: string, context: string): CommentEvent => ({ id: `e-${threadId}`, at: "2026-10-21T10:00:00.000Z", action: "create", threadId, messageId: `m-${threadId}`, authorId: "l", authorName: "Luis", body: "Hola", x: 1, y: 2, context });

afterEach(() => vi.restoreAllMocks());

describe("useSharedComments con alcance", () => {
  test("la plataforma solo ve sus hilos y comentar no borra los de la reserva", async () => {
    const posted: CommentEvent[][] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
      if (init?.method === "POST") {
        posted.push((JSON.parse(String(init.body)) as { events: CommentEvent[] }).events);
        return Response.json({ saved: 1 });
      }
      return Response.json({ events: [create("t-app", "app:/metricas"), create("t-booking", "mixed:tablet")] });
    });

    const { result } = renderHook(() => useSharedComments(author, { include: isPlatformThread }));
    await waitFor(() => expect(result.current.threads.map((thread) => thread.id)).toEqual(["t-app"]));

    // Se resuelve el de la plataforma: se manda solo eso, sin ningún «delete» del de la reserva.
    act(() => result.current.onThreadsChange(result.current.threads.map((thread) => ({ ...thread, resolved: true }))));
    await waitFor(() => expect(posted.length).toBe(1));
    expect(posted[0].map((event) => [event.action, event.threadId])).toEqual([["resolve", "t-app"]]);
  });
});
