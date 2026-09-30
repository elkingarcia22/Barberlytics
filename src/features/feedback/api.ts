import { api } from "@/lib/api";
import { feedbackReceiptSchema, type FeedbackReceipt, type FeedbackSubmission } from "./types";

/**
 * `POST /feedback`: en producción lo atiende la función de servidor
 * `api/feedback` (guarda el comentario en la hoja de la campaña); en
 * desarrollo, el mock de `src/mocks/handlers.ts`.
 */
export const feedbackApi = {
  submit: (submission: FeedbackSubmission): Promise<FeedbackReceipt> =>
    api.post<FeedbackReceipt>("/feedback", submission, { schema: feedbackReceiptSchema }),
};
