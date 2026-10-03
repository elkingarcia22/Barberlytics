import type { FeedbackCampaignConfig, FeedbackValues } from "@/components/feedback-loop";
import { FEEDBACK_NO_PAGE, feedbackSubmissionSchema, type FeedbackSubmission } from "./types";

export interface SubmissionContext {
  campaign: Pick<FeedbackCampaignConfig, "id" | "name" | "sections">;
  page: string;
  pageLabel: string;
  user: { name: string; email: string; role: string } | null;
  now?: Date;
  /** Los ids en Drive de los adjuntos, ya subidos. */
  attachmentIds?: readonly string[];
}

/**
 * Arma la fila que se envía: lo que escribió la persona más lo que la app ya
 * sabe (campaña, página, quién). La sección viaja con su rótulo legible, que
 * es lo que se lee en la hoja y en el resumen. Valida con el esquema: un
 * comentario que no cuadra no sale del navegador.
 *
 * Los adjuntos se suben antes (ver `feedbackApi.upload`); aquí solo viajan sus
 * ids, que el servidor convierte en enlaces en la hoja.
 */
export function buildSubmission(values: FeedbackValues, context: SubmissionContext): FeedbackSubmission {
  const sectionLabel = context.campaign.sections.find((option) => option.value === values.section)?.label ?? values.section;
  return feedbackSubmissionSchema.parse({
    campaignId: context.campaign.id,
    campaign: context.campaign.name,
    page: values.includePage ? context.page : FEEDBACK_NO_PAGE,
    pageLabel: values.includePage ? context.pageLabel : "",
    section: sectionLabel,
    comment: values.comment.trim(),
    type: values.type,
    canContact: values.canContact,
    attachments: [...(context.attachmentIds ?? [])],
    user: context.user?.name ?? "Anónimo",
    email: context.user?.email ?? "",
    role: context.user?.role ?? "",
    timestamp: (context.now ?? new Date()).toISOString(),
  });
}
