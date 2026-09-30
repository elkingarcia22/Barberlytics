import { afterEach, describe, expect, test, vi } from "vitest";
import { ACTIVE_CAMPAIGN_DEFINITION } from "../../src/features/feedback/campaignRegistry.js";
import { POST as activate } from "./activate.js";
import { GET as analyzeCron, POST as analyzeManual } from "./analyze.js";
import { POST as submit } from "./index.js";

const URL_BASE = "https://app.barberlytics.com/api/feedback";
const call = (handler: (request: Request) => Promise<Response>, init: { headers?: Record<string, string>; body?: unknown; method?: string } = {}) =>
  handler(new Request(URL_BASE, { method: init.method ?? "POST", headers: init.headers, body: init.body === undefined ? undefined : JSON.stringify(init.body) }));

const body = {
  campaignId: ACTIVE_CAMPAIGN_DEFINITION?.id,
  campaign: "x",
  page: "/dashboard",
  pageLabel: "Métricas",
  section: "General",
  comment: "Falta la vista semanal",
  user: "Ana",
  email: "",
  role: "",
  timestamp: "2026-09-30T14:59:00.000Z",
};

afterEach(() => vi.unstubAllEnvs());

describe("POST /api/feedback", () => {
  test("sin credenciales configuradas contesta 503 con el formato de error de la app", async () => {
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_JSON", "");
    const response = await call(submit, { body });
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: "server" });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  test("bloquea otro origen y rechaza un cuerpo que no es JSON", async () => {
    expect((await call(submit, { body, headers: { origin: "https://malo.example" } })).status).toBe(403);
    const notJson = await submit(new Request(URL_BASE, { method: "POST", body: "texto" }));
    expect(notJson.status).toBe(422);
  });
});

describe("endpoints de administración", () => {
  test("exigen la clave de administración o el secreto del cron", async () => {
    vi.stubEnv("FEEDBACK_ADMIN_KEY", "clave");
    vi.stubEnv("CRON_SECRET", "cron");
    expect((await call(activate)).status).toBe(401);
    expect((await call(analyzeManual, { headers: { authorization: "Bearer mala" } })).status).toBe(401);
    expect((await call(analyzeCron, { method: "GET" })).status).toBe(401);
  });

  test("con la clave correcta llegan al servicio (aquí, sin Google configurado: 503)", async () => {
    vi.stubEnv("FEEDBACK_ADMIN_KEY", "clave");
    vi.stubEnv("CRON_SECRET", "cron");
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_JSON", "");
    expect((await call(activate, { headers: { authorization: "Bearer clave" } })).status).toBe(503);
    expect((await call(analyzeCron, { method: "GET", headers: { authorization: "Bearer cron" } })).status).toBe(503);
  });
});
