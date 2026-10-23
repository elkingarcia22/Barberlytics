import { describe, expect, test, vi } from "vitest";
import type { CommentEvent } from "../../src/features/booking/comments/commentEvents.js";
import type { CommentsServerConfig } from "./config.js";
import { createCommentsService } from "./service.js";
import type { GoogleClient } from "../feedback/google.js";
import { createSheetStore, fromRow, toRow, type CommentsStore } from "./sheetStore.js";

const config: CommentsServerConfig = { googleServiceAccount: undefined, shareWith: [], linkAccess: undefined, sheetId: undefined };
const event = (overrides: Partial<CommentEvent> = {}): CommentEvent => ({ id: "e1", at: "2026-10-16T10:00:00.000Z", action: "create", threadId: "t1", messageId: "m1", authorId: "a", authorName: "Ana", body: "Hola", x: 10, y: 20, ...overrides });

function memoryStore(initial: CommentEvent[] = []): CommentsStore & { rows: CommentEvent[] } {
  const rows = [...initial];
  return {
    rows,
    read: async () => [...rows],
    append: async (events) => {
      rows.push(...events);
    },
    removeThreads: async (threadIds) => {
      for (let index = rows.length - 1; index >= 0; index -= 1) if (threadIds.includes(rows[index].threadId)) rows.splice(index, 1);
    },
  };
}

describe("servicio de comentarios", () => {
  test("guarda las acciones y las devuelve en orden", async () => {
    const store = memoryStore();
    const service = createCommentsService({ config, store });
    expect((await service.record({ events: [event(), event({ id: "e2", action: "reply", messageId: "m2", body: "Respuesta" })] })).body).toEqual({ saved: 2, removed: 0 });
    expect(((await service.list()).body.events as CommentEvent[]).map((item) => item.action)).toEqual(["create", "reply"]);
  });

  test("reintentar un envío no duplica filas", async () => {
    const store = memoryStore([event()]);
    const service = createCommentsService({ config, store });
    expect((await service.record({ events: [event(), event({ id: "e2", action: "resolve", messageId: undefined, body: undefined })] })).body).toEqual({ saved: 1, removed: 0 });
    expect(store.rows).toHaveLength(2);
  });

  test("eliminar quita de la hoja todas las filas del hilo, no agrega una fila «delete»", async () => {
    const store = memoryStore([event(), event({ id: "e2", action: "reply", messageId: "m2", body: "Respuesta" }), event({ id: "e3", threadId: "t2", messageId: "m3" })]);
    const service = createCommentsService({ config, store });
    expect((await service.record({ events: [event({ id: "e4", action: "delete", messageId: undefined, body: undefined })] })).body).toEqual({ saved: 0, removed: 1 });
    expect(store.rows.map((row) => row.id)).toEqual(["e3"]);
  });

  test("un comentario creado y borrado antes de llegar no deja nada en la hoja", async () => {
    const store = memoryStore();
    const service = createCommentsService({ config, store });
    await service.record({ events: [event(), event({ id: "e2", action: "delete", messageId: undefined, body: undefined })] });
    expect(store.rows).toHaveLength(0);
  });

  test("rechaza lo que no tiene el formato y los textos demasiado largos", async () => {
    const service = createCommentsService({ config, store: memoryStore() });
    expect((await service.record({ events: [{ id: "x" }] })).status).toBe(400);
    expect((await service.record({ events: [event({ body: "x".repeat(1001) })] })).status).toBe(400);
    expect((await service.record(undefined)).status).toBe(400);
  });

  test("sin cuenta de Google avisa que no está configurado, sin romper", async () => {
    const service = createCommentsService({ config });
    expect((await service.list()).status).toBe(503);
    expect((await service.record({ events: [event()] })).status).toBe(503);
  });

  test("si la hoja falla responde 502 y lo registra", async () => {
    const log = vi.fn();
    const store: CommentsStore = { read: async () => Promise.reject(new Error("caído")), append: async () => undefined };
    const service = createCommentsService({ config, store, log });
    expect((await service.list()).status).toBe(502);
    expect(log).toHaveBeenCalled();
  });
});

describe("cuota de Drive", () => {
  test("explica que la hoja la debe crear una persona", async () => {
    const store: CommentsStore = { read: async () => Promise.reject(new Error("The user's Drive storage quota has been exceeded.")), append: async () => undefined };
    const reply = await createCommentsService({ config, store, log: () => undefined }).list();
    expect(String(reply.body.message)).toContain("COMMENTS_SHEET_ID");
  });
});

describe("cuenta de Google inválida", () => {
  test("responde 502 diciendo qué falló, en vez de un 500 mudo", async () => {
    const log = vi.fn();
    const service = createCommentsService({ config: { ...config, googleServiceAccount: "esto no es json" }, log });
    const reply = await service.list();
    expect(reply.status).toBe(502);
    expect(String(reply.body.message)).toContain("GOOGLE_SERVICE_ACCOUNT_JSON");
    expect((await service.record({ events: [event()] })).status).toBe(502);
    expect(log).toHaveBeenCalled();
  });
});

describe("filas de la hoja", () => {
  test("una acción se guarda como fila y se lee igual", () => {
    const original = event({ context: "mixed:tablet", contextLabel: "Según el cliente · Tablet" });
    expect(fromRow(toRow(original))).toEqual(original);
  });

  test("la ubicación del comentario va en sus columnas y vuelve igual", () => {
    const original = event({
      context: "app:/configuracion/agendamiento?vista=apariencia",
      route: "/configuracion/agendamiento?vista=apariencia",
      module: "Configuración › Negocio › Reservas online",
      section: "Reservas online › Apariencia › Apariencia de la reserva",
      element: "Opción «Usar la apariencia general»",
    });
    const row = toRow(original);
    expect(row.slice(-4)).toEqual([original.route, original.module, original.section, original.element]);
    expect(fromRow(row)).toEqual(original);
  });

  test("una fila de antes, sin las columnas de ubicación, se sigue leyendo", () => {
    expect(fromRow(toRow(event()).slice(0, 12))).toEqual(event());
  });

  test("una fila rota o con una acción desconocida se descarta", () => {
    expect(fromRow(["", "create"])).toBeNull();
    expect(fromRow(["2026-10-16", "inventar", "t1", "", "a", "Ana", "", "", "", "", "", "e1"])).toBeNull();
  });
});

describe("abrir la hoja al enlace", () => {
  const fakeClient = (calls: { url: string; body: unknown }[]): GoogleClient => ({
    raw: async () => new Response(),
    json: async <T,>(url: string, init?: { method?: string; body?: unknown }) => {
      calls.push({ url, body: init?.body });
      return { values: [["cabecera"]], files: [] } as T;
    },
  });

  test("con linkAccess da permiso «anyone» a la hoja, una vez por instancia", async () => {
    const calls: { url: string; body: unknown }[] = [];
    const store = createSheetStore(fakeClient(calls), { sheetId: "hoja1", linkAccess: "reader" });
    await store.read();
    await store.read();
    const permissions = calls.filter((call) => call.url.includes("/permissions"));
    expect(permissions).toHaveLength(1);
    expect(permissions[0].body).toEqual({ type: "anyone", role: "reader" });
  });

  test("en una hoja ya creada por una persona agrega la pestaña «Acciones» con su cabecera, una vez", async () => {
    const calls: { url: string; body: unknown }[] = [];
    const client: GoogleClient = {
      raw: async () => new Response(),
      json: async <T,>(url: string, init?: { method?: string; body?: unknown }) => {
        calls.push({ url, body: init?.body });
        if (url.includes("fields=sheets.properties")) return { sheets: [{ properties: { sheetId: 0, title: "Hoja 1" } }] } as T;
        if (url.endsWith(":batchUpdate")) return { replies: [{ addSheet: { properties: { sheetId: 7 } } }] } as T;
        return { values: [["cabecera"]] } as T;
      },
    };
    const store = createSheetStore(client, { sheetId: "hoja1" });
    await store.read();
    await store.read();
    expect(calls.filter((call) => JSON.stringify(call.body ?? "").includes("addSheet"))).toHaveLength(1);
    expect(calls.some((call) => call.url.includes("Acciones!A1") && JSON.stringify(call.body).includes("evento_id"))).toBe(true);
  });

  test("si la pestaña ya existe no la vuelve a crear", async () => {
    const calls: { url: string; body: unknown }[] = [];
    const client: GoogleClient = {
      raw: async () => new Response(),
      json: async <T,>(url: string, init?: { method?: string; body?: unknown }) => {
        calls.push({ url, body: init?.body });
        if (url.includes("fields=sheets.properties")) return { sheets: [{ properties: { sheetId: 3, title: "Acciones" } }] } as T;
        return { values: [["cabecera"]] } as T;
      },
    };
    await createSheetStore(client, { sheetId: "hoja1" }).read();
    expect(calls.some((call) => JSON.stringify(call.body ?? "").includes("addSheet"))).toBe(false);
  });

  test("sin linkAccess no cambia los permisos", async () => {
    const calls: { url: string; body: unknown }[] = [];
    await createSheetStore(fakeClient(calls), { sheetId: "hoja1" }).read();
    expect(calls.some((call) => call.url.includes("/permissions"))).toBe(false);
  });
});

describe("eliminar en la hoja", () => {
  test("borra las filas del hilo de abajo hacia arriba, en la pestaña «Acciones»", async () => {
    const calls: { url: string; body: unknown }[] = [];
    const client: GoogleClient = {
      raw: async () => new Response(),
      json: async <T,>(url: string, init?: { method?: string; body?: unknown }) => {
        calls.push({ url, body: init?.body });
        if (url.includes("fields=sheets.properties")) return { sheets: [{ properties: { sheetId: 7, title: "Acciones" } }] } as T;
        if (url.includes(encodeURIComponent("Acciones!C:C"))) return { values: [["hilo"], ["t1"], ["t2"], ["t1"]] } as T;
        return { values: [["cabecera"]] } as T;
      },
    };
    await createSheetStore(client, { sheetId: "hoja1" }).removeThreads?.(["t1"]);
    const update = calls.find((call) => call.url.endsWith(":batchUpdate") && JSON.stringify(call.body).includes("deleteDimension"));
    const ranges = (update?.body as { requests: { deleteDimension: { range: { sheetId: number; startIndex: number } } }[] }).requests.map((request) => request.deleteDimension.range);
    expect(ranges.map((range) => [range.sheetId, range.startIndex])).toEqual([
      [7, 3],
      [7, 1],
    ]);
  });
});
