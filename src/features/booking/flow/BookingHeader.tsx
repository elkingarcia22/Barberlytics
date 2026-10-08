import { useAppT, type AppMessageKey } from "@/app/i18n";
import { Stepper } from "@/components/navigation/Stepper";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { PROGRESS_STEPS, progressIndex } from "../bookingState";
import { useBookingFlow } from "./BookingContext";

const STEP_LABELS: Record<(typeof PROGRESS_STEPS)[number], AppMessageKey> = {
  branch: "booking.step.branch",
  services: "booking.step.services",
  barber: "booking.step.barber",
  time: "booking.step.time",
  review: "booking.step.review",
  payment: "booking.step.payment",
};

interface BookingHeaderProps {
  onBack: (() => void) | null;
  /** El widget trae su propio cierre en la esquina. */
  trailing?: React.ReactNode;
}

/**
 * La cabecera de la reserva: quién es la barbería (y en qué sede), volver y
 * cuánto falta. El progreso solo aparece mientras se arma la cita; en el
 * celular y la confirmación no hace falta contar pasos.
 */
export function BookingHeader({ onBack, trailing }: BookingHeaderProps) {
  const t = useAppT();
  const { shop, state, dispatch, layout } = useBookingFlow();
  const branch = shop.branches.find((item) => item.id === state.branchId);
  const index = progressIndex(state.step);
  const showProgress = index >= 0 && index < PROGRESS_STEPS.length;
  const steps = PROGRESS_STEPS.map((id) => ({ id, label: t(STEP_LABELS[id]) }));

  return (
    <header className="relative z-sticky shrink-0 border-b border-border bg-surface/90 backdrop-blur">
      <div className={cn("flex h-14 items-center gap-2 px-3", layout === "wide" && "h-16 px-6")}>
        <div className="flex w-10 shrink-0 justify-start">
          {onBack && (
            <Button type="button" variant="ghost" size="icon-sm" onClick={onBack} aria-label={t("booking.header.back")}>
              <ThemaIcon name="chevronLeft" />
            </Button>
          )}
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2.5">
          <IconTile size="sm" shape="circle" src={shop.logoUrl} icon={<ThemaIcon name="scissors" />} />
          <div className="flex min-w-0 flex-col leading-tight">
            <Text size="sm" weight="semibold" truncate>
              {shop.name}
            </Text>
            {branch && (
              <Text size="xs" tone="muted" truncate>
                {branch.name}
              </Text>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-1">
          {state.step !== "manage" && state.step !== "confirmed" && (
            <Button type="button" variant="ghost" size={layout === "wide" ? "sm" : "icon-sm"} onClick={() => dispatch({ type: "openManage" })} aria-label={t("booking.header.myAppointments")}>
              <ThemaIcon name="calendar" />
              {layout === "wide" && t("booking.header.myAppointments")}
            </Button>
          )}
          {trailing}
        </div>
      </div>
      {showProgress && layout === "compact" && (
        <div className="flex items-center gap-3 px-5 pb-3">
          <Progress value={((index + 1) / PROGRESS_STEPS.length) * 100} className="flex-1" aria-label={t("booking.header.stepOf", { current: index + 1, total: PROGRESS_STEPS.length })} />
          <Text size="xs" tone="muted" tabular className="shrink-0">
            {t("booking.header.stepOf", { current: index + 1, total: PROGRESS_STEPS.length })} · {steps[index]?.label}
          </Text>
        </div>
      )}
      {showProgress && layout === "wide" && (
        <div className="px-8 pb-4">
          <Stepper size="sm" steps={steps} current={index} />
        </div>
      )}
    </header>
  );
}
