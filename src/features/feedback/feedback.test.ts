import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { db } from "@/mocks/db";
import { REDESIGN_CAMPAIGN } from "./campaigns";
import { buildSubmission } from "./buildSubmission";
import { feedbackApi } from "./api";
import { findNavLabel } from "./pageLabel";
import type { LucideIcon } from "lucide-react";
import type { NavEntry } from "@/components/app-shell";

const NOW = new Date("2026-09-29T15:00:00.000Z");
const context = {
  campaign: REDESIGN_CAMPAIGN,
  page: "/dashboard",
  pageLabel: "Métricas",
  user: { name: "Ana Ruiz", email: "ana@barberia.co", role: "Administrador" },
  now: NOW,
};

const VALUES = { type: "improvement", section: "general", comment: "", attachments: [], includePage: true, canContact: false } as const;

describe("buildSubmission", () => {
  test("lleva el tipo, el permiso de contacto y los ids de los adjuntos ya subidos", () => {
    const submission = buildSubmission({ ...VALUES, type: "bug", comment: "El botón no guarda", canContact: true }, { ...context, attachmentIds: ["1AbCdEfGhIjKlMnOp"] });
    expect(submission).toMatchObject({ type: "bug", canContact: true, attachments: ["1AbCdEfGhIjKlMnOp"] });
  });

  test("si desmarca la página, no viaja", () => {
    const submission = buildSubmission({ ...VALUES, comment: "Todo bien", includePage: false }, context);
    expect(submission).toMatchObject({ page: "-", pageLabel: "" });
  });

  test("añade campaña, página y persona, y envía la sección con su rótulo", () => {
    expect(buildSubmission({ ...VALUES, section: "agenda", comment: "  Falta la vista semanal " }, context)).toEqual({
      campaignId: "rediseno-barberlytics-2026-09",
      campaign: "Rediseño de Barberlytics",
      page: "/dashboard",
      pageLabel: "Métricas",
      section: "Calendario y agenda",
      comment: "Falta la vista semanal",
      type: "improvement",
      canContact: false,
      attachments: [],
      user: "Ana Ruiz",
      email: "ana@barberia.co",
      role: "Administrador",
      timestamp: "2026-09-29T15:00:00.000Z",
    });
  });

  test("sin sesión va como anónimo", () => {
    const submission = buildSubmission({ ...VALUES, section: "general", comment: "Todo bien" }, { ...context, user: null });
    expect(submission.user).toBe("Anónimo");
    expect(submission.email).toBe("");
  });

  test("un comentario que no cuadra no sale del navegador", () => {
    expect(() => buildSubmission({ ...VALUES, comment: "no" }, context)).toThrow();
  });
});

describe("feedbackApi.submit (sin webhook: POST /feedback)", () => {
  test("el backend lo recibe y contesta ok", async () => {
    const submission = buildSubmission({ ...VALUES, comment: "Me gusta el nuevo menú" }, context);
    await expect(feedbackApi.submit(submission)).resolves.toEqual({ ok: true });
    expect(db.feedback).toHaveLength(1);
    expect(db.feedback[0]).toMatchObject({ comment: "Me gusta el nuevo menú", page: "/dashboard" });
  });

  test("un error del backend llega como ApiError", async () => {
    server.use(http.post("*/api/feedback", () => HttpResponse.json({ code: "server", message: "Caído" }, { status: 500 })));
    const submission = buildSubmission({ ...VALUES, comment: "Me gusta el nuevo menú" }, context);
    await expect(feedbackApi.submit(submission)).rejects.toMatchObject({ code: "server" });
  });
});

describe("findNavLabel", () => {
  const icon = (() => null) as unknown as LucideIcon;
  const navigation: NavEntry[] = [
    { kind: "group", label: "Gestión" },
    { kind: "item", id: "home", label: "Métricas", icon, path: "/dashboard" },
    { kind: "item", id: "people", label: "Personas", icon, children: [{ id: "team", label: "Equipo", path: "/equipo" }] },
  ];

  test("encuentra el rótulo en cualquier nivel", () => {
    expect(findNavLabel(navigation, "home")).toBe("Métricas");
    expect(findNavLabel(navigation, "team")).toBe("Equipo");
    expect(findNavLabel(navigation, "nada")).toBeUndefined();
    expect(findNavLabel(navigation, undefined)).toBeUndefined();
  });
});

describe("feedbackApi.upload", () => {
  // El `File` de jsdom no siempre es un cuerpo válido para el `fetch` de Node;
  // en el navegador sí. Aquí los bytes dan igual: se manda un texto en su lugar.
  beforeEach(() => {
    const realFetch = globalThis.fetch;
    vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => realFetch(input, init?.method === "PUT" ? { ...init, body: "bytes" } : init));
  });
  afterEach(() => vi.restoreAllMocks());

  test("pide la sesión, sube el archivo y devuelve su id", async () => {
    const file = new File(["x".repeat(20)], "captura.png", { type: "image/png" });
    await expect(feedbackApi.upload(file, REDESIGN_CAMPAIGN.id)).resolves.toBe("adjunto-mock-0001");
    expect(db.feedbackUploads).toEqual([{ id: "adjunto-mock-0001", name: "captura.png", size: 20 }]);
  });

  test("manda el tipo sin parámetros: el grabador entrega `video/webm;codecs=vp9`", async () => {
    let received: unknown;
    server.use(
      http.post("*/api/feedback/attachments", async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({ code: "server", message: "Sin carpeta" }, { status: 503 });
      })
    );
    const file = new File(["x"], "grabacion.webm", { type: "video/webm;codecs=vp9" });
    await expect(feedbackApi.upload(file, REDESIGN_CAMPAIGN.id)).rejects.toMatchObject({ code: "server" });
    expect(received).toMatchObject({ mimeType: "video/webm", name: "grabacion.webm" });
  });

  test("si Drive no acepta el archivo, lo dice con su nombre", async () => {
    server.use(http.put("*/api/feedback/attachments/upload/:id", () => HttpResponse.json({ error: {} }, { status: 500 })));
    const file = new File(["x"], "captura.png", { type: "image/png" });
    await expect(feedbackApi.upload(file, REDESIGN_CAMPAIGN.id)).rejects.toThrow("No se pudo subir captura.png");
  });
});
