import { describe, expect, test } from "vitest";
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

describe("buildSubmission", () => {
  test("añade campaña, página y persona, y envía la sección con su rótulo", () => {
    expect(buildSubmission({ section: "agenda", comment: "  Falta la vista semanal " }, context)).toEqual({
      campaignId: "rediseno-barberlytics-2026-09",
      campaign: "Rediseño de Barberlytics",
      page: "/dashboard",
      pageLabel: "Métricas",
      section: "Calendario y agenda",
      comment: "Falta la vista semanal",
      user: "Ana Ruiz",
      email: "ana@barberia.co",
      role: "Administrador",
      timestamp: "2026-09-29T15:00:00.000Z",
    });
  });

  test("sin sesión va como anónimo", () => {
    const submission = buildSubmission({ section: "general", comment: "Todo bien" }, { ...context, user: null });
    expect(submission.user).toBe("Anónimo");
    expect(submission.email).toBe("");
  });

  test("un comentario que no cuadra no sale del navegador", () => {
    expect(() => buildSubmission({ section: "general", comment: "no" }, context)).toThrow();
  });
});

describe("feedbackApi.submit (sin webhook: POST /feedback)", () => {
  test("el backend lo recibe y contesta ok", async () => {
    const submission = buildSubmission({ section: "general", comment: "Me gusta el nuevo menú" }, context);
    await expect(feedbackApi.submit(submission)).resolves.toEqual({ ok: true });
    expect(db.feedback).toHaveLength(1);
    expect(db.feedback[0]).toMatchObject({ comment: "Me gusta el nuevo menú", page: "/dashboard" });
  });

  test("un error del backend llega como ApiError", async () => {
    server.use(http.post("*/api/feedback", () => HttpResponse.json({ code: "server", message: "Caído" }, { status: 500 })));
    const submission = buildSubmission({ section: "general", comment: "Me gusta el nuevo menú" }, context);
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
