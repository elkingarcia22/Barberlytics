import { beforeEach, describe, expect, test } from "vitest";
import type { CampaignDefinition } from "../../src/features/feedback/campaignRegistry.js";
import { COMMENT_COLUMNS } from "./campaignSheet.js";
import { readConfig } from "./config.js";
import { createFakeCloud, createFakeServiceAccountJson, type FakeCloud } from "./fakeGoogle.js";
import { createFeedbackService } from "./service.js";

const CAMPAIGN: CampaignDefinition = { id: "rediseno-2026-09", name: "Rediseño", sections: [{ value: "general", label: "General" }] };
const NOW = new Date("2026-09-30T15:00:00.000Z");

const submission = (over: Record<string, unknown> = {}) => ({
  campaignId: CAMPAIGN.id,
  campaign: "Lo que diga el navegador",
  page: "/dashboard",
  pageLabel: "Métricas",
  section: "Calendario y agenda",
  comment: "Falta la vista semanal",
  user: "Ana Ruiz",
  email: "ana@barberia.co",
  role: "Administrador",
  timestamp: "2026-09-30T14:59:00.000Z",
  ...over,
});

const ANALYSIS = JSON.stringify({
  resumen: "Piden la vista semanal",
  sentimiento: "mixto",
  temas: [{ tema: "Agenda", seccion: "Calendario", menciones: 2, citas: ["Falta la vista semanal"] }],
  prioridades: [{ prioridad: "alta", accion: "Añadir vista semanal", razon: "Se repite", impacto: "Menos fricción", owner_sugerido: "Producto" }],
  quick_wins: ["Atajo a hoy"],
  riesgos: [],
  metricas_sugeridas: ["Uso de la agenda"],
});

let cloud: FakeCloud;
let errors: string[];

function service(env: Record<string, string | undefined> = {}, campaign: CampaignDefinition | null = CAMPAIGN) {
  return createFeedbackService({
    config: readConfig({
      GOOGLE_SERVICE_ACCOUNT_JSON: createFakeServiceAccountJson(),
      ANTHROPIC_API_KEY: "sk-falsa",
      FEEDBACK_SHARE_WITH: "ana@barberia.co, dueno@barberia.co",
      ...env,
    }),
    campaign,
    fetchImpl: cloud.fetchImpl,
    now: () => NOW,
    log: (message) => errors.push(message),
  });
}

beforeEach(() => {
  cloud = createFakeCloud();
  errors = [];
});

describe("submit", () => {
  test("la primera vez crea la hoja, la comparte y guarda el comentario", async () => {
    const reply = await service().submit(submission());
    expect(reply).toEqual({ status: 200, body: { ok: true } });

    expect(cloud.sheets).toHaveLength(1);
    const [sheet] = cloud.sheets;
    expect(sheet.name).toBe("Feedback · Rediseño");
    expect(sheet.tabsBuilt).toBe(true);
    expect(sheet.shared).toEqual(["ana@barberia.co", "dueno@barberia.co"]);
    expect(sheet.comments).toHaveLength(1);
  });

  test("la fila respeta el orden de las columnas y toma el nombre de la campaña del servidor", async () => {
    await service().submit(submission());
    const row = Object.fromEntries(COMMENT_COLUMNS.map((column, index) => [column, cloud.sheets[0].comments[0][index]]));
    expect(row).toEqual({
      fecha_recibido: "2026-09-30T15:00:00.000Z",
      fecha_envio: "2026-09-30T14:59:00.000Z",
      campana_id: "rediseno-2026-09",
      campana: "Rediseño",
      pagina: "Métricas",
      ruta: "/dashboard",
      seccion: "Calendario y agenda",
      comentario: "Falta la vista semanal",
      usuario: "Ana Ruiz",
      correo: "ana@barberia.co",
      rol: "Administrador",
      tipo: "Mejora",
      contactar: "No",
      adjuntos: "",
    });
  });

  test("los siguientes comentarios reutilizan la hoja", async () => {
    const api = service();
    await api.submit(submission());
    await api.submit(submission({ comment: "Otro comentario distinto" }));
    expect(cloud.sheets).toHaveLength(1);
    expect(cloud.sheets[0].comments).toHaveLength(2);
    expect(cloud.sheets[0].shared).toHaveLength(2);
  });

  test("el comentario se escribe como texto (RAW), nunca como fórmula", async () => {
    await service().submit(submission({ comment: "=IMPORTXML(\"http://malo\")" }));
    const append = cloud.calls.find((call) => call.url.includes(":append"));
    expect(append?.url).toContain("valueInputOption=RAW");
    expect(cloud.sheets[0].comments[0][7]).toBe("=IMPORTXML(\"http://malo\")");
  });

  test("rechaza lo que no cuadra sin tocar Google", async () => {
    for (const bad of [submission({ comment: "no" }), submission({ comment: "x".repeat(1001) }), { campaignId: "x" }, null, "texto"]) {
      expect((await service().submit(bad)).status).toBe(422);
    }
    expect(cloud.calls).toHaveLength(0);
  });

  test("solo acepta la campaña activa", async () => {
    expect((await service().submit(submission({ campaignId: "otra-campana" }))).status).toBe(404);
    expect((await service({}, null).submit(submission())).status).toBe(404);
    expect(cloud.calls).toHaveLength(0);
  });

  test("sin cuenta de Google configurada avisa con un 503", async () => {
    const reply = await service({ GOOGLE_SERVICE_ACCOUNT_JSON: "" }).submit(submission());
    expect(reply.status).toBe(503);
    expect(reply.body.message).toMatch(/no está configurado/);
  });

  test("si Google falla, el usuario recibe un mensaje y el detalle va al log", async () => {
    cloud.fetchImpl = (async () => new Response("{}", { status: 500 })) as typeof fetch;
    const reply = await service().submit(submission());
    expect(reply).toEqual({ status: 502, body: { code: "server", message: "No pudimos guardar tu comentario. Inténtalo de nuevo." } });
    expect(errors).toEqual(["submit"]);
  });

  test("dos comentarios simultáneos no dejan dos hojas: gana la más antigua", async () => {
    cloud.raceOnCreate = true;
    await service().submit(submission());
    expect(cloud.sheets).toHaveLength(1);
    expect(cloud.sheets[0].id).toBe("hoja-001");
    expect(cloud.sheets[0].comments).toHaveLength(1);
  });

  test("pide el token una sola vez por instancia", async () => {
    const api = service();
    await api.submit(submission());
    await api.submit(submission());
    expect(cloud.calls.filter((call) => call.url === "https://oauth2.googleapis.com/token")).toHaveLength(1);
    expect(cloud.calls.find((call) => call.url.includes("/values/"))?.headers.Authorization).toBe("Bearer token-falso");
  });
});

describe("activate", () => {
  test("crea y comparte la hoja sin esperar a un comentario, y es idempotente", async () => {
    const api = service();
    const first = await api.activate();
    expect(first.body).toMatchObject({ ok: true, created: true, campaignId: CAMPAIGN.id, sharedWith: ["ana@barberia.co", "dueno@barberia.co"] });
    expect(first.body.spreadsheetUrl).toBe("https://docs.google.com/spreadsheets/d/hoja-001/edit");

    const second = await api.activate();
    expect(second.body).toMatchObject({ created: false });
    expect(cloud.sheets).toHaveLength(1);
  });

  test("avisa si nadie tiene acceso a la hoja o si un correo falló", async () => {
    const lonely = await service({ FEEDBACK_SHARE_WITH: "" }).activate();
    expect(lonely.body.warning).toMatch(/nadie tiene acceso/);

    cloud = createFakeCloud();
    cloud.failShareFor.add("dueno@barberia.co");
    const partial = await service().activate();
    expect(partial.body.sharedWith).toEqual(["ana@barberia.co"]);
    expect(partial.body.shareErrors).toEqual(["dueno@barberia.co: Dominio no permitido"]);
  });
});

describe("analyze", () => {
  test("sin hoja o sin comentarios no llama a Claude", async () => {
    expect((await service().analyze()).body).toMatchObject({ status: "skipped-no-comments" });
    await service().activate();
    expect((await service().analyze()).body).toMatchObject({ status: "skipped-no-comments" });
    expect(cloud.claude.requests).toHaveLength(0);
  });

  test("resume con Claude y escribe una fila en «Resumen»", async () => {
    const api = service();
    await api.submit(submission());
    await api.submit(submission({ comment: "Los botones son pequeños", section: "Métricas" }));
    cloud.claude.reply = "```json\n" + ANALYSIS + "\n```";

    const reply = await api.analyze();
    expect(reply.body).toMatchObject({ ok: true, status: "analyzed", total: 2 });

    const request = cloud.claude.requests[0];
    expect(request.model).toBe("claude-sonnet-5-5");
    expect(JSON.stringify(request.messages)).toContain("Falta la vista semanal");
    expect(JSON.stringify(request.messages)).toContain("Campaña: Rediseño");

    const [row] = cloud.sheets[0].summaries;
    expect(row).toHaveLength(14);
    expect(row.slice(0, 4)).toEqual(["2026-09-30T15:00:00.000Z", "rediseno-2026-09", "Rediseño", "2"]);
    expect(row[6]).toBe("Piden la vista semanal");
    expect(row[7]).toBe("mixto");
    expect(row[9]).toContain("[alta] Añadir vista semanal");
    expect(row[11]).toBe("—");
    expect(cloud.calls.find((call) => call.url === "https://api.anthropic.com/v1/messages")?.headers["x-api-key"]).toBe("sk-falsa");
  });

  test("sin comentarios nuevos desde el último análisis no gasta otra llamada", async () => {
    const api = service();
    await api.submit(submission());
    cloud.claude.reply = ANALYSIS;
    await api.analyze();
    expect((await api.analyze()).body).toMatchObject({ status: "skipped-unchanged" });
    expect(cloud.claude.requests).toHaveLength(1);

    await api.submit(submission({ comment: "Un comentario nuevo" }));
    expect((await api.analyze()).body).toMatchObject({ status: "analyzed", total: 2 });
    expect(cloud.sheets[0].summaries).toHaveLength(2);
  });

  test("si Claude falla o no devuelve JSON, no escribe nada y responde 502", async () => {
    const api = service();
    await api.submit(submission());

    cloud.claude.reply = new Error("overloaded");
    expect((await api.analyze()).status).toBe(502);
    cloud.claude.reply = "Lo siento, no puedo con eso";
    expect((await api.analyze()).status).toBe(502);

    expect(cloud.sheets[0].summaries).toHaveLength(0);
    expect(errors).toEqual(["analyze", "analyze"]);
  });

  test("sin clave de Claude lo dice en vez de fallar a medias", async () => {
    const api = service({ ANTHROPIC_API_KEY: "" });
    await api.submit(submission());
    const reply = await api.analyze();
    expect(reply.status).toBe(503);
    expect(reply.body.message).toMatch(/ANTHROPIC_API_KEY/);
  });
});

describe("adjuntos", () => {
  const FOLDER = "carpeta-compartida-01";
  const upload = (over: Record<string, unknown> = {}) => ({ campaignId: CAMPAIGN.id, name: "captura.png", mimeType: "image/png", size: 120_000, ...over });
  const ORIGIN = "https://app.barberlytics.com";

  test("abre una sesión de subida en la carpeta, atada al tipo, al tamaño y al origen", async () => {
    const reply = await service({ FEEDBACK_DRIVE_FOLDER_ID: FOLDER }).createUpload(upload(), ORIGIN);
    expect(reply.status).toBe(200);
    expect(reply.body.uploadUrl).toMatch(/^https:\/\/www\.googleapis\.com\/upload\/drive\/v3\/files\?upload_id=/);

    const call = cloud.calls.find((item) => item.url.includes("/upload/drive/v3/files"));
    expect(call?.url).toContain("supportsAllDrives=true");
    expect(call?.headers).toMatchObject({ "X-Upload-Content-Type": "image/png", "X-Upload-Content-Length": "120000", Origin: ORIGIN });
    expect(call?.body).toMatchObject({ name: "2026-09-30-15-00-00 · captura.png", parents: [FOLDER] });
  });

  test("sin carpeta configurada no acepta adjuntos y lo dice", async () => {
    const reply = await service().createUpload(upload(), ORIGIN);
    expect(reply.status).toBe(503);
    expect(cloud.calls).toHaveLength(0);
  });

  test("rechaza tipos no permitidos, archivos que pesan de más y campañas cerradas", async () => {
    const api = service({ FEEDBACK_DRIVE_FOLDER_ID: FOLDER });
    expect((await api.createUpload(upload({ mimeType: "application/pdf" }), ORIGIN)).status).toBe(422);
    expect((await api.createUpload(upload({ size: 6 * 1024 * 1024 }), ORIGIN)).status).toBe(422);
    expect((await api.createUpload(upload({ campaignId: "otra" }), ORIGIN)).status).toBe(404);
    expect(cloud.calls).toHaveLength(0);
  });

  test("la fila enlaza solo los adjuntos que están en la carpeta de feedback", async () => {
    cloud.files.push(
      { id: "archivo-bueno-0001", parents: [FOLDER], webViewLink: "https://drive.google.com/file/d/archivo-bueno-0001/view" },
      { id: "archivo-ajeno-0001", parents: ["otra-carpeta"], webViewLink: "https://drive.google.com/file/d/archivo-ajeno-0001/view" }
    );
    const reply = await service({ FEEDBACK_DRIVE_FOLDER_ID: FOLDER }).submit(
      submission({ type: "bug", canContact: true, attachments: ["archivo-bueno-0001", "archivo-ajeno-0001", "archivo-inventado-1"] })
    );
    expect(reply.status).toBe(200);
    const row = Object.fromEntries(COMMENT_COLUMNS.map((column, index) => [column, cloud.sheets[0].comments[0][index]]));
    expect(row).toMatchObject({ tipo: "Error", contactar: "Sí", adjuntos: "https://drive.google.com/file/d/archivo-bueno-0001/view" });
  });
});
