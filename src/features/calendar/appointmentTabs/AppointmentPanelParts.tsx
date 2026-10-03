import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Text, type TextTone } from "@/components/typography";
import type { AppointmentStage } from "../appointmentPlaybook";

/**
 * La frase de estado del panel de una cita. Habla el mismo idioma que la
 * tarjeta de la agenda: un punto de color (o el check de cobrada) y el texto.
 */

/** El punto del estado, con los mismos tonos que la píldora de la tarjeta. */
const STAGE_DOT: Record<AppointmentStage, string> = {
  late: "bg-destructive",
  upcoming: "bg-text-muted",
  waiting: "bg-info",
  seated: "bg-primary",
  toCollect: "bg-warning",
  paid: "bg-success",
  noShow: "bg-text-muted",
  cancelled: "bg-text-muted",
};

/** Solo lo que pide moverse lleva color en el texto. */
const STAGE_TONE: Partial<Record<AppointmentStage, TextTone>> = { late: "negative", toCollect: "warning", paid: "positive" };

export function StageHeadline({ stage, children }: { stage: AppointmentStage; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      {stage === "paid" ? (
        <span aria-hidden="true" className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
          <Check className="size-2.5" />
        </span>
      ) : (
        <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", STAGE_DOT[stage])} />
      )}
      <Text weight="semibold" tone={STAGE_TONE[stage] ?? "default"} className="min-w-0 leading-snug" data-testid="appointment-headline">
        {children}
      </Text>
    </div>
  );
}
