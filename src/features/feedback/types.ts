import { z } from "zod";

/** Largo máximo de un comentario; el panel corta ahí y el backend lo vuelve a comprobar. */
export const FEEDBACK_MAX_LENGTH = 1000;
export const FEEDBACK_MIN_LENGTH = 5;

/**
 * Un comentario de una campaña, tal como viaja al webhook y se escribe como
 * fila en la hoja «Comentarios». Los nombres de campo son las columnas.
 */
export const feedbackSubmissionSchema = z.object({
  campaignId: z.string().min(1).max(120),
  campaign: z.string().min(1).max(160),
  /** La ruta en la que estaba la persona (`/dashboard`). */
  page: z.string().min(1).max(300),
  /** El nombre de esa página en el menú («Métricas»). */
  pageLabel: z.string().max(160),
  section: z.string().min(1).max(160),
  comment: z.string().trim().min(FEEDBACK_MIN_LENGTH).max(FEEDBACK_MAX_LENGTH),
  user: z.string().max(160),
  email: z.string().max(200),
  role: z.string().max(80),
  /** ISO 8601 del navegador; el servidor añade su propia hora de recepción. */
  timestamp: z.string().datetime({ offset: true }),
});
export type FeedbackSubmission = z.infer<typeof feedbackSubmissionSchema>;

export const feedbackReceiptSchema = z.object({ ok: z.literal(true) });
export type FeedbackReceipt = z.infer<typeof feedbackReceiptSchema>;
