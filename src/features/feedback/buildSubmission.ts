import type { FeedbackCampaignConfig, FeedbackValues } from "@/components/feedback-loop";
import { feedbackSubmissionSchema, type FeedbackSubmission } from "./types";

export interface SubmissionContext {
  campaign: Pick<FeedbackCampaignConfig, "id" | "name" | "sections">;
  page: string;
  pageLabel: string;
  user: { name: string; email: string; role: string } | null;
  now?: Date;
}

/**
 * Arma la fila que se envía: lo que escribió la persona más lo que la app ya
 * sabe (campaña, página, quién). La sección viaja con su rótulo legible, que
 * es lo que se lee en la hoja y en el resumen. Valida con el esquema: un
 * comentario que no cuadra no sale del navegador.
 */
export function buildSubmission(values: FeedbackValues, context: SubmissionContext): FeedbackSubmission {
  const sectionLabel = context.campaign.sections.find((option) => option.value === values.section)?.label ?? values.section;
  return feedbackSubmissionSchema.parse({
    campaignId: context.campaign.id,
    campaign: context.campaign.name,
    page: context.page,
    pageLabel: context.pageLabel,
    section: sectionLabel,
    comment: values.comment.trim(),
    user: context.user?.name ?? "Anónimo",
    email: context.user?.email ?? "",
    role: context.user?.role ?? "",
    timestamp: (context.now ?? new Date()).toISOString(),
  });
}
