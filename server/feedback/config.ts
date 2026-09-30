/**
 * La configuración del servidor de feedback, leída del entorno de la función.
 * Nada de esto llega al navegador: son credenciales.
 */
export interface FeedbackServerConfig {
  /** JSON de la cuenta de servicio de Google (o ese JSON en base64). */
  googleServiceAccount: string | undefined;
  /** Clave de la API de Claude para el resumen. */
  anthropicApiKey: string | undefined;
  /** Correos que reciben acceso de edición a la hoja de cada campaña. */
  shareWith: readonly string[];
  /** Clave con la que una persona activa la campaña o pide un análisis a mano. */
  adminKey: string | undefined;
  /** La que Vercel manda en las invocaciones del cron (`Authorization: Bearer`). */
  cronSecret: string | undefined;
  model: string;
}

export const DEFAULT_MODEL = "claude-sonnet-5-5";

export function readConfig(env: Record<string, string | undefined> = process.env): FeedbackServerConfig {
  const list = (value: string | undefined) =>
    (value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  return {
    googleServiceAccount: env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() || undefined,
    anthropicApiKey: env.ANTHROPIC_API_KEY?.trim() || undefined,
    shareWith: list(env.FEEDBACK_SHARE_WITH),
    adminKey: env.FEEDBACK_ADMIN_KEY?.trim() || undefined,
    cronSecret: env.CRON_SECRET?.trim() || undefined,
    model: env.FEEDBACK_MODEL?.trim() || DEFAULT_MODEL,
  };
}
