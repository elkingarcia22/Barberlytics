import * as React from "react";
import { FeedbackCampaign, FeedbackDialog, type FeedbackValues } from "@/components/feedback-loop";
import { describeError, isApiError } from "@/lib/api";
import { publishProcess, updateProcess } from "@/components/app-shell";
import { useAppT } from "@/app/i18n";
import { useAuth } from "@/features/auth";
import { ACTIVE_FEEDBACK_CAMPAIGN } from "./campaigns";
import { feedbackApi } from "./api";
import { buildSubmission } from "./buildSubmission";
import { useSubmitFeedback } from "./queries";

export interface FeedbackHostProps {
  /** La ruta actual (`location.pathname`). */
  page: string;
  /** El nombre de esa página en el menú; si no hay, se usa la ruta. */
  pageLabel?: string;
  /** El rótulo del rol de la persona, tal como lo ve ella. */
  roleLabel?: string;
  /** El diálogo, controlado desde fuera para que el menú lateral abra este mismo. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * El recorrido y el botón flotante de la campaña. Apagados, queda solo el
   * diálogo: se sigue escuchando, pero sin salir a pedir la opinión.
   */
  showCampaign?: boolean;
}

/**
 * Sube los adjuntos y devuelve sus ids. Un video tarda, así que la subida se
 * publica en el Centro de procesos: se ve cuánto lleva y, si algo falla, queda
 * dicho ahí aunque el diálogo ya se haya cerrado.
 */
async function uploadAttachments(files: readonly File[], campaignId: string, t: ReturnType<typeof useAppT>): Promise<string[]> {
  if (files.length === 0) return [];
  const id = `feedback-upload-${Date.now()}`;
  const total = files.length;
  let uploaded = 0;
  publishProcess({ id, icon: "upload", title: t("feedback.upload.title"), meta: t("feedback.upload.progress", { done: 0, total }), progress: 0 });
  try {
    const ids = await Promise.all(
      files.map(async (file) => {
        const fileId = await feedbackApi.upload(file, campaignId);
        uploaded += 1;
        updateProcess(id, { meta: t("feedback.upload.progress", { done: uploaded, total }), progress: (uploaded / total) * 100 });
        return fileId;
      })
    );
    updateProcess(id, { done: true, progress: undefined, meta: t("feedback.upload.done", { total }) });
    return ids;
  } catch (error) {
    updateProcess(id, { failed: true, progress: undefined, meta: t("feedback.upload.failed") });
    throw error;
  }
}

/**
 * Monta la campaña activa sobre la app: añade a cada comentario la campaña, la
 * página y la persona, y lo envía al webhook. Sin campaña activa no pinta nada.
 *
 * El diálogo es uno solo: lo abre el botón flotante de la campaña y, con
 * `open`/`onOpenChange`, también «Enviar feedback» del menú lateral.
 */
export function FeedbackHost({ page, pageLabel, roleLabel, open, onOpenChange, showCampaign = true }: FeedbackHostProps) {
  const { user } = useAuth();
  const { mutateAsync } = useSubmitFeedback();
  const t = useAppT();
  const campaign = ACTIVE_FEEDBACK_CAMPAIGN;
  const label = pageLabel ?? page;

  const submit = React.useCallback(
    async (values: FeedbackValues) => {
      if (!campaign) return;
      try {
        // Primero los archivos: un comentario que promete una captura y no la trae vale menos que uno que falla.
        const attachmentIds = await uploadAttachments(values.attachments, campaign.id, t);
        const submission = buildSubmission(values, {
          campaign,
          page,
          pageLabel: label,
          user: user ? { name: user.name, email: user.email, role: roleLabel ?? user.role } : null,
          attachmentIds,
        });
        await mutateAsync(submission);
      } catch (error) {
        // El panel enseña este texto y conserva el comentario para reintentar.
        // Un fallo al subir ya trae su frase —dice qué archivo fue—; el resto se traduce.
        const message = error instanceof Error && !isApiError(error) && error.name !== "AbortError" ? error.message : describeError(error).description;
        throw new Error(message, { cause: error });
      }
    },
    [campaign, page, label, user, roleLabel, mutateAsync, t]
  );

  if (!campaign) return null;
  if (!showCampaign) {
    return <FeedbackDialog open={open ?? false} onOpenChange={onOpenChange ?? (() => undefined)} sections={campaign.sections} context={label} onSubmit={submit} />;
  }
  return <FeedbackCampaign campaign={campaign} context={label} onSubmit={submit} dialogOpen={open} onDialogOpenChange={onOpenChange} />;
}
