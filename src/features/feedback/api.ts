import { api } from "@/lib/api";
import {
  feedbackReceiptSchema,
  feedbackUploadTicketSchema,
  feedbackUploadedFileSchema,
  type FeedbackReceipt,
  type FeedbackSubmission,
  type FeedbackUploadRequest,
  type FeedbackUploadTicket,
} from "./types";

/** El tipo sin parámetros: el grabador entrega `video/webm;codecs=vp9`. */
const baseType = (file: File) => file.type.split(";")[0];

/**
 * `POST /feedback`: en producción lo atiende la función de servidor
 * `api/feedback` (guarda el comentario en la hoja de la campaña); en
 * desarrollo, el mock de `src/mocks/handlers.ts`.
 */
export const feedbackApi = {
  submit: (submission: FeedbackSubmission): Promise<FeedbackReceipt> =>
    api.post<FeedbackReceipt>("/feedback", submission, { schema: feedbackReceiptSchema }),

  /**
   * Sube un adjunto y devuelve su id en Drive. Va en dos pasos porque un video
   * no cabe en el cuerpo de una función: el servidor abre una sesión de subida
   * para ese archivo y el navegador le manda los bytes directamente a Drive.
   */
  async upload(file: File, campaignId: string): Promise<string> {
    const request = { campaignId, name: file.name, mimeType: baseType(file), size: file.size } as FeedbackUploadRequest;
    const ticket = await api.post<FeedbackUploadTicket>("/feedback/attachments", request, { schema: feedbackUploadTicketSchema });
    const response = await fetch(ticket.uploadUrl, { method: "PUT", headers: { "Content-Type": request.mimeType }, body: file });
    const uploaded = feedbackUploadedFileSchema.safeParse(await response.json().catch(() => null));
    if (!response.ok || !uploaded.success) throw new Error(`No se pudo subir ${file.name}. Inténtalo de nuevo o quítalo del comentario.`);
    return uploaded.data.id;
  },
};
