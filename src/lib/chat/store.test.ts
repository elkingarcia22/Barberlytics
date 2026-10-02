import { beforeEach, describe, expect, test, vi } from "vitest";
import { createChatStore } from "./store";
import type { ChatBackend, ChatReply } from "./types";

const reply = (partial: Partial<ChatReply> = {}): ChatReply => ({ text: "Hola.", ...partial });

function backendWith(result: ChatReply | Error = reply(), delay = 0): ChatBackend {
  return {
    reply: (_question, _history, signal) =>
      new Promise((resolve, reject) => {
        const timer = setTimeout(() => (result instanceof Error ? reject(result) : resolve(result)), delay);
        signal.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(new DOMException("Aborted", "AbortError"));
        });
      }),
  };
}

describe("createChatStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  test("enviar crea la conversación, guarda la pregunta y deja la respuesta pendiente", () => {
    const store = createChatStore({ now: () => 1000 });

    const id = store.send("¿Cómo creo una cita?", backendWith());

    const conversation = store.getState().conversations[0];
    expect(store.getState().activeId).toBe(id);
    expect(conversation.title).toBe("¿Cómo creo una cita?");
    expect(conversation.messages.map((message) => [message.role, message.status])).toEqual([
      ["user", "done"],
      ["agent", "pending"],
    ]);
  });

  test("cuando llega la respuesta el mensaje pasa a escribirse y se marca como leído si se está mirando", async () => {
    const store = createChatStore({ now: () => 1000 });
    store.send("Hola", backendWith(reply({ text: "Qué tal.", followups: ["Sigue"] })));

    await vi.runAllTimersAsync();

    const agent = store.getState().conversations[0].messages[1];
    expect(agent.status).toBe("streaming");
    expect(agent.text).toBe("Qué tal.");
    expect(agent.followups).toEqual(["Sigue"]);
    expect(store.getState().conversations[0].unread).toBe(false);
  });

  test("una respuesta que llega a una conversación que no se mira queda sin leer", async () => {
    const store = createChatStore({ now: () => 1000 });
    const first = store.send("Uno", backendWith(reply(), 50));
    store.setActive(null);
    store.send("Dos", backendWith(reply(), 10));

    await vi.runAllTimersAsync();

    const byId = Object.fromEntries(store.getState().conversations.map((conversation) => [conversation.id, conversation]));
    expect(byId[first].unread).toBe(true);
    store.setActive(first);
    expect(store.getState().conversations.find((c) => c.id === first)?.unread).toBe(false);
  });

  test("detener recorta el texto a lo que se vio y deja de esperar la respuesta", async () => {
    const store = createChatStore({ now: () => 1000 });
    store.send("Hola", backendWith(reply({ text: "Una respuesta larga que se corta." })));
    await vi.runAllTimersAsync();
    const agentId = store.getState().conversations[0].messages[1].id;

    store.stop(agentId, "Una respuesta");

    const agent = store.getState().conversations[0].messages[1];
    expect(agent.status).toBe("stopped");
    expect(agent.text).toBe("Una respuesta");
  });

  test("detener mientras aún se espera aborta la petición", async () => {
    const store = createChatStore({ now: () => 1000 });
    const backend = backendWith(reply(), 500);
    store.send("Hola", backend);
    const agentId = store.getState().conversations[0].messages[1].id;

    store.stop(agentId, "");
    await vi.runAllTimersAsync();

    expect(store.getState().conversations[0].messages[1].status).toBe("stopped");
  });

  test("un error deja el mensaje en error, sin tirar la conversación", async () => {
    const store = createChatStore({ now: () => 1000 });
    store.send("Hola", backendWith(new Error("boom")));

    await vi.runAllTimersAsync();

    expect(store.getState().conversations[0].messages[1].status).toBe("error");
  });

  test("regenerar vuelve a preguntar lo último sin repetir la pregunta", async () => {
    const store = createChatStore({ now: () => 1000 });
    store.send("Hola", backendWith(reply({ text: "Primera" })));
    await vi.runAllTimersAsync();

    store.regenerate(backendWith(reply({ text: "Segunda" })));
    await vi.runAllTimersAsync();

    const messages = store.getState().conversations[0].messages;
    expect(messages).toHaveLength(2);
    expect(messages[1].text).toBe("Segunda");
  });

  test("editar un mensaje descarta lo que venía después y pide una respuesta nueva", async () => {
    const store = createChatStore({ now: () => 1000 });
    store.send("Uno", backendWith(reply({ text: "R1" })));
    await vi.runAllTimersAsync();
    store.send("Dos", backendWith(reply({ text: "R2" })));
    await vi.runAllTimersAsync();
    const firstUser = store.getState().conversations[0].messages[0];

    store.edit(firstUser.id, "Uno corregido", backendWith(reply({ text: "R1 bis" })));
    await vi.runAllTimersAsync();

    const messages = store.getState().conversations[0].messages;
    expect(messages.map((message) => message.text)).toEqual(["Uno corregido", "R1 bis"]);
  });

  test("responder una pregunta con opciones la deja respondida y envía la opción", () => {
    const store = createChatStore({ now: () => 1000 });
    store.send("Plan", backendWith(reply({ question: { options: ["1", "2"] } })));
    const agentId = store.getState().conversations[0].messages[1].id;
    store.setState((state) => ({
      ...state,
      conversations: state.conversations.map((c) => ({
        ...c,
        messages: c.messages.map((m) => (m.id === agentId ? { ...m, status: "done" as const, question: { options: ["1", "2"] } } : m)),
      })),
    }));

    store.answer(agentId, "2", backendWith());

    const messages = store.getState().conversations[0].messages;
    expect(messages[1].question?.answer).toBe("2");
    expect(messages[2].text).toBe("2");
  });

  test("lo guardado se recupera, y una respuesta que quedó a medias se marca como error", () => {
    const storage = new Map<string, string>();
    const persistence = { get: (key: string) => storage.get(key) ?? null, set: (key: string, value: string) => void storage.set(key, value) };
    const first = createChatStore({ now: () => 1000, persistence, storageKey: "test" });
    first.send("Hola", backendWith(reply(), 10_000));

    const second = createChatStore({ now: () => 2000, persistence, storageKey: "test" });

    const messages = second.getState().conversations[0].messages;
    expect(messages[0].text).toBe("Hola");
    expect(messages[1].status).toBe("error");
  });

  test("borrar una conversación activa deja una conversación nueva", () => {
    const store = createChatStore({ now: () => 1000 });
    const id = store.send("Hola", backendWith());

    store.remove(id);

    expect(store.getState().conversations).toHaveLength(0);
    expect(store.getState().activeId).toBeNull();
  });
});
