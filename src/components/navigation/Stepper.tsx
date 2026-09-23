import * as React from "react";
import { AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepStatus = "complete" | "current" | "upcoming" | "error";

export interface StepperStep {
  id: string;
  label: string;
  description?: string;
  /** Sobrescribe el estado que se deriva de `current` (p. ej. para marcar un error). */
  status?: StepStatus;
}

export interface StepperProps extends Omit<React.HTMLAttributes<HTMLOListElement>, "onClick"> {
  steps: readonly StepperStep[];
  /** Índice (base 0) del paso activo. */
  current: number;
  orientation?: "horizontal" | "vertical";
  /** Si se pasa, los pasos completados, actuales o con error se vuelven botones. Los pendientes quedan deshabilitados. */
  onStepClick?: (index: number) => void;
  size?: "sm" | "default";
}

const CIRCLE_BY_STATUS: Record<StepStatus, string> = {
  current: "border-primary bg-primary text-primary-foreground",
  complete: "border-primary/30 bg-primary/10 text-primary",
  upcoming: "border-border bg-surface text-text-muted",
  error: "border-destructive/30 bg-destructive/10 text-destructive",
};

const LABEL_BY_STATUS: Record<StepStatus, string> = {
  current: "text-text-primary",
  complete: "text-text-primary",
  upcoming: "text-text-muted",
  error: "text-destructive",
};

/* Círculo de 28px (24px en `sm`). El conector se calcula a partir de estas medidas. */
const MARK_BY_SIZE = {
  default: {
    mark: "size-7 text-xs [&>svg]:size-3.5",
    horizontalLine: "top-3.5 left-9",
    verticalLine: "left-3.5 top-8",
  },
  sm: {
    mark: "size-6 text-[11px] [&>svg]:size-3",
    horizontalLine: "top-3 left-8",
    verticalLine: "left-3 top-7",
  },
} as const;

function resolveStatus(step: StepperStep, index: number, current: number): StepStatus {
  if (step.status) return step.status;
  if (index < current) return "complete";
  if (index === current) return "current";
  return "upcoming";
}

function StepMark({ status, index, size }: { status: StepStatus; index: number; size: "sm" | "default" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border font-semibold tabular-nums transition-colors",
        MARK_BY_SIZE[size].mark,
        CIRCLE_BY_STATUS[status]
      )}
    >
      {status === "complete" ? <Check strokeWidth={2.5} /> : status === "error" ? <AlertCircle /> : index + 1}
    </span>
  );
}

/**
 * Stepper
 *
 * Flujo por pasos: un círculo numerado por paso, unido por un conector que se
 * pinta en primario cuando el paso anterior ya está completo. El `<ol>` marca el
 * paso activo con `aria-current="step"`.
 */
export function Stepper({
  steps,
  current,
  orientation = "horizontal",
  onStepClick,
  size = "default",
  className,
  ...props
}: StepperProps) {
  const isVertical = orientation === "vertical";
  const sizing = MARK_BY_SIZE[size];

  return (
    <ol
      aria-label="Progreso"
      data-orientation={orientation}
      className={cn("flex", isVertical ? "flex-col" : "w-full items-start", className)}
      {...props}
    >
      {steps.map((step, index) => {
        const status = resolveStatus(step, index, current);
        const isLast = index === steps.length - 1;
        const isConnectorDone = status === "complete";
        const isClickable = Boolean(onStepClick) && status !== "upcoming";

        const stepClasses = cn(
          "relative flex min-w-0 text-left",
          isVertical ? "flex-row items-start gap-3" : "flex-col items-start gap-2",
          !isLast && !isVertical && "pr-4"
        );

        const content = (
          <>
            <StepMark status={status} index={index} size={size} />
            <span className={cn("flex min-w-0 flex-col gap-0.5", isVertical && "pt-1")}>
              <span className={cn("text-sm font-medium leading-tight", LABEL_BY_STATUS[status])}>{step.label}</span>
              {step.description && <span className="text-xs text-text-secondary">{step.description}</span>}
            </span>
          </>
        );

        return (
          <li
            key={step.id}
            aria-current={status === "current" ? "step" : undefined}
            data-status={status}
            className={cn("relative flex", isVertical ? "flex-col" : "flex-1 last:flex-none", isVertical && !isLast && "pb-6")}
          >
            {!isLast && (
              <span
                aria-hidden
                className={cn(
                  "absolute",
                  isVertical ? cn("bottom-0 w-px -translate-x-1/2", sizing.verticalLine) : cn("right-2 h-px", sizing.horizontalLine),
                  isConnectorDone ? "bg-primary" : "bg-border"
                )}
              />
            )}
            {onStepClick ? (
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => onStepClick(index)}
                className={cn(
                  stepClasses,
                  "rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed"
                )}
              >
                {content}
              </button>
            ) : (
              <span className={stepClasses}>{content}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
