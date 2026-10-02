import { feedbackSubmissionSchema } from "../../src/features/feedback/types.js";
import type { CampaignDefinition } from "../../src/features/feedback/campaignRegistry.js";
import { askClaude, buildPrompt, parseAnalysis, toSummaryRow } from "./analysis.js";
import { appendComment, appendSummary, ensureCampaignSheet, findCampaignSheet, readComments, readSummaries } from "./campaignSheet.js";
import type { FeedbackServerConfig } from "./config.js";
import { createGoogleClient, parseServiceAccount, type GoogleClient } from "./google.js";

/** Lo que el servicio responde, sin atarse a `Request`/`Response` para poder probarlo con datos. */
export interface Reply {
  status: number;
  body: Record<string, unknown>;
}

export interface FeedbackService {
  /** Guarda un comentario en la hoja de la campaña activa (creándola si falta). */
  submit(payload: unknown): Promise<Reply>;
  /** Crea la hoja de la campaña activa y la comparte, sin esperar al primer comentario. */
  activate(): Promise<Reply>;
  /** Resume con Claude los comentarios nuevos de la campaña activa y lo guarda en «Resumen». */
  analyze(): Promise<Reply>;
}

export interface FeedbackServiceOptions {
  config: FeedbackServerConfig;
  /** La campaña que está escuchando; `null` = cerrada. */
  campaign: CampaignDefinition | null;
  fetchImpl?: typeof fetch;
  now?: () => Date;
  log?: (message: string, error: unknown) => void;
}

const fail = (status: number, code: string, message: string): Reply => ({ status, body: { code, message } });
const NOT_OPEN = fail(404, "not_found", "Esta campaña ya no está abierta.");
const NOT_CONFIGURED = fail(503, "server", "El feedback todavía no está configurado en el servidor.");

export function createFeedbackService(options: FeedbackServiceOptions): FeedbackService {
  const { config, campaign, fetchImpl } = options;
  const now = options.now ?? (() => new Date());
  const log = options.log ?? ((message, error) => console.error(`[feedback] ${message}`, error));
  let client: GoogleClient | null = null;

  /** Un cliente de Google por instancia; `null` si falta la cuenta de servicio. */
  function google(): GoogleClient | null {
    if (client) return client;
    if (!config.googleServiceAccount) return null;
    client = createGoogleClient(parseServiceAccount(config.googleServiceAccount), { fetchImpl });
    return client;
  }

  async function guarded(step: string, run: (google: GoogleClient, campaign: CampaignDefinition) => Promise<Reply>, userMessage: string): Promise<Reply> {
    if (!campaign) return NOT_OPEN;
    try {
      const api = google();
      if (!api) return NOT_CONFIGURED;
      return await run(api, campaign);
    } catch (error) {
      log(step, error);
      return fail(502, "server", userMessage);
    }
  }

  return {
    async submit(payload) {
      const parsed = feedbackSubmissionSchema.safeParse(payload);
      if (!parsed.success) return fail(422, "validation_error", "El comentario necesita entre 5 y 1000 caracteres.");
      const submission = parsed.data;
      if (!campaign || submission.campaignId !== campaign.id) return NOT_OPEN;

      return guarded(
        "submit",
        async (api, active) => {
          const sheet = await ensureCampaignSheet(api, active, config.shareWith);
          await appendComment(api, sheet.id, {
            fecha_recibido: now().toISOString(),
            fecha_envio: submission.timestamp,
            campana_id: active.id,
            // El nombre sale del registro del servidor, no de lo que mande el navegador.
            campana: active.name,
            pagina: submission.pageLabel || submission.page,
            ruta: submission.page,
            seccion: submission.section,
            comentario: submission.comment,
            usuario: submission.user,
            correo: submission.email,
            rol: submission.role,
          });
          return { status: 200, body: { ok: true } };
        },
        "No pudimos guardar tu comentario. Inténtalo de nuevo."
      );
    },

    activate() {
      return guarded(
        "activate",
        async (api, active) => {
          const sheet = await ensureCampaignSheet(api, active, config.shareWith);
          const warning =
            sheet.created && sheet.sharedWith.length === 0
              ? "La hoja se creó pero nadie tiene acceso: define FEEDBACK_SHARE_WITH o compártela desde la cuenta de servicio."
              : undefined;
          return {
            status: 200,
            body: { ok: true, campaignId: active.id, spreadsheetUrl: sheet.url, created: sheet.created, sharedWith: sheet.sharedWith, shareErrors: sheet.shareErrors, warning },
          };
        },
        "No se pudo crear la hoja de la campaña."
      );
    },

    async analyze() {
      if (campaign && google() && !config.anthropicApiKey) return fail(503, "server", "Falta ANTHROPIC_API_KEY para analizar.");
      return guarded(
        "analyze",
        async (api, active) => {
          const sheet = await findCampaignSheet(api, active.id);
          if (!sheet) return { status: 200, body: { ok: true, status: "skipped-no-comments", total: 0 } };

          const rows = await readComments(api, sheet.id);
          if (rows.length === 0) return { status: 200, body: { ok: true, status: "skipped-no-comments", total: 0, spreadsheetUrl: sheet.url } };

          const summaries = await readSummaries(api, sheet.id);
          const last = summaries[summaries.length - 1];
          // Sin comentarios nuevos desde el último análisis no se gasta otra llamada.
          if (last && Number(last.total_comentarios) === rows.length) {
            return { status: 200, body: { ok: true, status: "skipped-unchanged", total: rows.length, spreadsheetUrl: sheet.url } };
          }

          const answer = await askClaude({ apiKey: config.anthropicApiKey as string, model: config.model, prompt: buildPrompt(active.name, rows), fetchImpl });
          const summary = toSummaryRow(parseAnalysis(answer.text), {
            campaignId: active.id,
            campaignName: active.name,
            rows,
            analyzedAt: now().toISOString(),
            model: answer.model,
          });
          await appendSummary(api, sheet.id, summary);
          return { status: 200, body: { ok: true, status: "analyzed", total: rows.length, spreadsheetUrl: sheet.url } };
        },
        "No se pudo generar el resumen."
      );
    },
  };
}
