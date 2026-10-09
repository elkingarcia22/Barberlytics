import { useAppT, type AppMessageKey } from "@/app/i18n";
import { Stepper } from "@/components/navigation/Stepper";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { defaultBranchId, PROGRESS_STEPS, progressIndex, progressSteps } from "../bookingState";
import { useBookingFlow } from "./BookingContext";
import { ShopBrand } from "./ShopBrand";

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
  const flow = progressSteps(defaultBranchId(state.customer, shop.branches.map((item) => item.id)) === null);
  const index = progressIndex(state.step, flow);
  const showProgress = index >= 0 && index < flow.length;
  const steps = flow.map((id) => ({ id, label: t(STEP_LABELS[id]) }));

  const isWide = layout === "wide";
  /**
   * Volver a un paso ya hecho desde los pasos de arriba. Armando la cita, se va directo; ya en el
   * resumen o el pago, volver a servicios, barbero u hora edita la última cita en ese paso.
   */
  const goToStep = (target: number) => {
    const step = flow[target];
    if (!step || target >= index) return;
    const editsAppointment = step === "services" || step === "barber" || step === "time";
    if (editsAppointment && !state.draft && state.items.length > 0) dispatch({ type: "editItem", index: state.items.length - 1 });
    dispatch({ type: "goTo", step });
  };
  const back = (
    <div className={cn("flex shrink-0 justify-start", !isWide && "w-10")}>
      {onBack && (
        <Button type="button" variant="ghost" size="icon-sm" onClick={onBack} aria-label={t("booking.header.back")}>
          <ThemaIcon name="chevronLeft" />
        </Button>
      )}
    </div>
  );
  const end = (
    <div className="flex shrink-0 items-center justify-end gap-1">
      {state.step !== "manage" && state.step !== "confirmed" && (
        <Button type="button" variant="ghost" size={isWide && !showProgress ? "sm" : "icon-sm"} onClick={() => dispatch({ type: "openManage" })} aria-label={t("booking.header.myAppointments")}>
          <ThemaIcon name="calendar" />
          {isWide && !showProgress && t("booking.header.myAppointments")}
        </Button>
      )}
      {trailing}
    </div>
  );

  // En monitor todo va en una sola fila: volver y la marca a la izquierda, los pasos al centro y «Mis citas» a la derecha.
  if (isWide) {
    return (
      <header className="relative z-sticky shrink-0 border-b border-border bg-surface/90 backdrop-blur">
        <div className="flex h-[4.5rem] items-center gap-4 px-6">
          {back}
          {/* Con los pasos a la vista basta el logo: el nombre les quitaría el ancho. */}
          <ShopBrand shop={shop} tagline={branch?.name} iconOnly={showProgress} className="shrink-0" />
          <div className="flex min-w-0 flex-1 justify-center">
            {showProgress && <Stepper size="sm" steps={steps} current={index} onStepClick={goToStep} className="w-full max-w-3xl" />}
          </div>
          {end}
        </div>
      </header>
    );
  }

  return (
    <header className="relative z-sticky shrink-0 border-b border-border bg-surface/90 backdrop-blur">
      <div className="flex h-14 items-center gap-2 px-3">
        {back}
        <div className="flex min-w-0 flex-1 items-center justify-center">
          <ShopBrand shop={shop} tagline={branch?.name} />
        </div>
        {end}
      </div>
      {showProgress && (
        <div className="flex items-center gap-3 px-5 pb-3">
          <Progress value={((index + 1) / flow.length) * 100} className="flex-1" aria-label={t("booking.header.stepOf", { current: index + 1, total: flow.length })} />
          <Text size="xs" tone="muted" tabular className="shrink-0">
            {t("booking.header.stepOf", { current: index + 1, total: flow.length })} · {steps[index]?.label}
          </Text>
        </div>
      )}
    </header>
  );
}
