import { z } from "zod";

/** Largo máximo de un comentario; el panel corta ahí y el backend lo vuelve a comprobar. */
export const FEEDBACK_MAX_LENGTH = 1000;
export const FEEDBACK_MIN_LENGTH = 5;
export const FEEDBACK_MAX_ATTACHMENTS = 4;
export const FEEDBACK_TYPES = ["improvement", "bug", "idea"] as const;
/** Lo que viaja en `page` cuando la persona desmarca «incluir la página». */
export const FEEDBACK_NO_PAGE = "-";
/** Como son los ids de archivo de Drive; lo demás no se intenta resolver. */
const DRIVE_ID_PATTERN = /^[\w-]{10,120}$/;

const MB = 1024 * 1024;
/** Qué se puede adjuntar y hasta cuánto pesa. Lo comprueban el navegador y el servidor. */
export const FEEDBACK_ATTACHMENT_LIMITS = {
  "image/png": 5 * MB,
  "image/jpeg": 5 * MB,
  "video/webm": 30 * MB,
  "video/mp4": 30 * MB,
} as const;
export type FeedbackAttachmentType = keyof typeof FEEDBACK_ATTACHMENT_LIMITS;
const ATTACHMENT_TYPES = Object.keys(FEEDBACK_ATTACHMENT_LIMITS) as [FeedbackAttachmentType, ...FeedbackAttachmentType[]];

/** Lo que el navegador pide antes de subir un adjunto: permiso para ese archivo concreto. */
export const feedbackUploadRequestSchema = z
  .object({
    campaignId: z.string().min(1).max(120),
    name: z.string().trim().min(1).max(160),
    mimeType: z.enum(ATTACHMENT_TYPES),
    size: z.number().int().positive(),
  })
  .refine((request) => request.size <= FEEDBACK_ATTACHMENT_LIMITS[request.mimeType], { message: "El archivo pesa demasiado.", path: ["size"] });
export type FeedbackUploadRequest = z.infer<typeof feedbackUploadRequestSchema>;

/** A dónde subir el archivo: una sesión de subida de Drive, válida solo para él. */
export const feedbackUploadTicketSchema = z.object({ ok: z.literal(true), uploadUrl: z.string().url() });
export type FeedbackUploadTicket = z.infer<typeof feedbackUploadTicketSchema>;

/** Lo que Drive contesta al terminar la subida. */
export const feedbackUploadedFileSchema = z.object({ id: z.string().regex(DRIVE_ID_PATTERN) });

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
  /** Qué clase de comentario es. Por defecto, una mejora. */
  type: z.enum(FEEDBACK_TYPES).default("improvement"),
  /** La persona acepta que la contacten sobre este comentario. */
  canContact: z.boolean().default(false),
  /** Los ids en Drive de las capturas y el video, ya subidos antes de enviar. */
  attachments: z.array(z.string().regex(DRIVE_ID_PATTERN)).max(FEEDBACK_MAX_ATTACHMENTS).default([]),
  user: z.string().max(160),
  email: z.string().max(200),
  role: z.string().max(80),
  /** ISO 8601 del navegador; el servidor añade su propia hora de recepción. */
  timestamp: z.string().datetime({ offset: true }),
});
export type FeedbackSubmission = z.infer<typeof feedbackSubmissionSchema>;

export const feedbackReceiptSchema = z.object({ ok: z.literal(true) });
export type FeedbackReceipt = z.infer<typeof feedbackReceiptSchema>;
