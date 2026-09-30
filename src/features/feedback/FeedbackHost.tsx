import * as React from "react";
import { FeedbackCampaign, type FeedbackValues } from "@/components/feedback-loop";
import { describeError } from "@/lib/api";
import { useAuth } from "@/features/auth";
import { ACTIVE_FEEDBACK_CAMPAIGN } from "./campaigns";
import { buildSubmission } from "./buildSubmission";
import { useSubmitFeedback } from "./queries";

export interface FeedbackHostProps {
  /** La ruta actual (`location.pathname`). */
  page: string;
  /** El nombre de esa página en el menú; si no hay, se usa la ruta. */
  pageLabel?: string;
  /** El rótulo del rol de la persona, tal como lo ve ella. */
  roleLabel?: string;
}

/**
 * Monta la campaña activa sobre la app: añade a cada comentario la campaña, la
 * página y la persona, y lo envía al webhook. Sin campaña activa no pinta nada.
 */
export function FeedbackHost({ page, pageLabel, roleLabel }: FeedbackHostProps) {
  const { user } = useAuth();
  const { mutateAsync } = useSubmitFeedback();
  const campaign = ACTIVE_FEEDBACK_CAMPAIGN;
  const label = pageLabel ?? page;

  const submit = React.useCallback(
    async (values: FeedbackValues) => {
      if (!campaign) return;
      const submission = buildSubmission(values, {
        campaign,
        page,
        pageLabel: label,
        user: user ? { name: user.name, email: user.email, role: roleLabel ?? user.role } : null,
      });
      try {
        await mutateAsync(submission);
      } catch (error) {
        // El panel enseña este texto y conserva el comentario para reintentar.
        throw new Error(describeError(error).description, { cause: error });
      }
    },
    [campaign, page, label, user, roleLabel, mutateAsync]
  );

  if (!campaign) return null;
  return <FeedbackCampaign campaign={campaign} context={label} onSubmit={submit} />;
}
