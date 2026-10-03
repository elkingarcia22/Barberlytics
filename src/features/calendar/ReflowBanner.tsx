import { Check, Shuffle, X } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { AttentionStrip } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { AiGeneratedBadge } from "@/components/ai-interaction";
import { formatClock } from "@/components/scheduling";
import { findClient, type ModelContext } from "./calendarModel";
import { moveStart, planShiftMinutes, type ReflowPlan } from "./reflowModel";

/**
 * La franja que acompaña a un plan de reacomodo mientras se ve en la agenda:
 * cuántas citas se corren, cuánto, si alguna queda después del cierre, y los
 * dos botones que importan —aplicar o descartar—. Nada se mueve hasta que se
 * aplica; mientras tanto la rejilla enseña a dónde iría cada una.
 */

export interface ReflowBannerProps {
  plan: ReflowPlan;
  ctx: ModelContext;
  busy?: boolean;
  onApply: () => void;
  onDiscard: () => void;
}

export function ReflowBanner({ plan, ctx, busy = false, onApply, onDiscard }: ReflowBannerProps) {
  const t = useAppT();
  const overflow = plan.moves.filter((move) => move.overflow).length;
  const first = plan.moves[0];
  const firstClient = first ? (findClient(ctx.catalog, first.appointment.clientId)?.name ?? "") : "";
  const detail = [
    t("calendar.reflow.because", { name: findClient(ctx.catalog, plan.anchor.clientId)?.name ?? "" }),
    first ? t("calendar.reflow.firstMove", { name: firstClient, time: formatClock(moveStart(plan, first), ctx.intl) }) : null,
    overflow > 0 ? t("calendar.reflow.overflow", { count: overflow }) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="shrink-0" data-testid="calendar-reflow">
      <AttentionStrip
        label={t("calendar.reflow.aria")}
        icon={Shuffle}
        tone={overflow > 0 ? "negative" : "brand"}
        title={t("calendar.reflow.title", { count: plan.moves.length, minutes: planShiftMinutes(plan), barber: plan.barber.name.split(" ")[0] })}
        detail={detail}
      >
        <AiGeneratedBadge />
        <Button size="sm" variant="outline" onClick={onDiscard} disabled={busy} data-testid="calendar-reflow-discard">
          <X /> {t("calendar.reflow.discard")}
        </Button>
        <Button size="sm" onClick={onApply} disabled={busy} data-testid="calendar-reflow-apply">
          <Check /> {t("calendar.reflow.apply")}
        </Button>
      </AttentionStrip>
    </div>
  );
}
