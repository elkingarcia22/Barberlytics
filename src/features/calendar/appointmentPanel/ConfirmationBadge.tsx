import { useAppT } from "@/app/i18n";
import { StatusBadge, type StatusType } from "@/components/data-display/StatusBadge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Appointment } from "../types";
import { confirmationOf, type ConfirmationKind } from "./confirmation";

/**
 * Si el cliente confirmó, como un badge de estado junto al título de la cita:
 * «Confirmada», «Sin confirmar», «Pidió otra hora», «No puede venir». Cómo se
 * llegó ahí va en el tooltip; confirmarla o quitarlo, en el «⋯» de la cita.
 */

const TONE: Record<ConfirmationKind, StatusType> = { confirmed: "completed", pending: "neutral", reschedule: "warning", declined: "error" };

export function ConfirmationBadge({ appointment }: { appointment: Pick<Appointment, "status" | "confirmation"> }) {
  const t = useAppT();
  const state = confirmationOf(appointment);
  const badge = <StatusBadge status={TONE[state.kind]} label={t(state.label)} data-testid="appointment-confirmation" data-confirmation={state.kind} />;
  if (!state.hint) return badge;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex" tabIndex={0}>
          {badge}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">{t(state.hint)}</TooltipContent>
    </Tooltip>
  );
}
