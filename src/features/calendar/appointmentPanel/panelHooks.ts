import * as React from "react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { agentFocus } from "@/lib/chat";
import type { ModelContext } from "../calendarModel";
import { appointmentAgentFocus } from "./appointmentAgent";
import type { AppointmentModel } from "./useAppointmentModel";

/** Abre el panel de Clipper hablando de esta cita y este cliente. */
export function useAskClipper(model: AppointmentModel, ctx: ModelContext): () => void {
  const t = useAppT();
  const { formatDate } = useLocale();
  return React.useCallback(() => agentFocus.open(appointmentAgentFocus({ model, ctx, t, formatDate })), [model, ctx, t, formatDate]);
}

export interface PanelPages<T extends string> {
  page: T | null;
  open: (page: T) => void;
  back: () => void;
}

/** Ir y volver entre las páginas del panel; volver siempre lleva al inicio de la cita. Puede abrir ya en una (el recibo, recién cobrada). */
export function usePanelPages<T extends string>(initial: T | null = null): PanelPages<T> {
  const [page, setPage] = React.useState<T | null>(initial);
  return { page, open: setPage, back: () => setPage(null) };
}
