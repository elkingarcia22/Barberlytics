import { CalendarX2, Pill, TriangleAlert, type LucideIcon } from "lucide-react";
import { useAppT, type AppMessageKey } from "@/app/i18n";
import { Text } from "@/components/typography";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Appointment } from "../types";
import type { AppointmentModel } from "./useAppointmentModel";

/**
 * Lo que hay que cuidar con esta cita, junto y con la misma cara: el riesgo
 * de que no venga, las alergias y los medicamentos. Cada cosa es una píldora
 * corta (qué es y el comienzo del texto); lo completo —las razones del
 * riesgo y qué hacer, la nota entera— sale en su tooltip, para que no ocupe
 * media pantalla. El riesgo bajo no es una alerta y no se muestra.
 */

type Tone = "warning" | "negative";

interface CareItem {
  id: string;
  icon: LucideIcon;
  tone: Tone;
  label: string;
  /** El comienzo del texto, en la píldora; se corta si no cabe. */
  hint?: string;
  /** Lo completo, en el tooltip. */
  detail: string;
  extra?: string;
}

const TONE: Record<Tone, string> = {
  warning: "border-status-warning/30 bg-status-warning/10 text-status-warning",
  negative:
    "border-status-negative/30 bg-status-negative/10 text-status-negative",
};

const RISK_LABEL: Record<"medium" | "high", AppMessageKey> = {
  medium: "calendar.risk.short.medium",
  high: "calendar.risk.short.high",
};
const RISK_LEVEL_KEYS: Record<
  NonNullable<Appointment["risk"]>["level"],
  AppMessageKey
> = {
  low: "calendar.risk.level.low",
  medium: "calendar.risk.level.medium",
  high: "calendar.risk.level.high",
};
const RISK_REASON_KEYS: Record<
  NonNullable<Appointment["risk"]>["reasons"][number],
  AppMessageKey
> = {
  pastNoShows: "calendar.risk.reason.pastNoShows",
  cancels: "calendar.risk.reason.cancels",
  newClient: "calendar.risk.reason.newClient",
  farAhead: "calendar.risk.reason.farAhead",
  unconfirmed: "calendar.risk.reason.unconfirmed",
  prepaid: "calendar.risk.reason.prepaid",
  confirmed: "calendar.risk.reason.confirmed",
};
/** Cuántas razones del riesgo se cuentan en el tooltip. */
const REASONS_SHOWN = 3;

function careItems(
  model: AppointmentModel,
  t: ReturnType<typeof useAppT>,
): CareItem[] {
  const items: CareItem[] = model.critical.map((note) => ({
    id: note.id,
    icon: note.kind === "allergy" ? TriangleAlert : Pill,
    tone: note.kind === "allergy" ? "negative" : "warning",
    label: t(
      note.kind === "allergy"
        ? "calendar.detail.allergy"
        : "calendar.detail.medication",
    ),
    hint: note.text,
    detail: note.text,
  }));
  const { risk, status } = model.appointment;
  if (risk && status === "scheduled" && risk.level !== "low") {
    const percent = Math.round(risk.probability * 100);
    items.unshift({
      id: "risk",
      icon: CalendarX2,
      tone: risk.level === "high" ? "negative" : "warning",
      label: t(RISK_LABEL[risk.level], { percent }),
      detail: `${t(RISK_LEVEL_KEYS[risk.level], { percent })}: ${risk.reasons
        .slice(0, REASONS_SHOWN)
        .map((reason) => t(RISK_REASON_KEYS[reason]))
        .join(", ")}.`,
      extra:
        risk.level === "high"
          ? t("calendar.risk.action")
          : t("calendar.risk.estimate"),
    });
  }
  return items;
}

export function CareAlerts({
  model,
  className,
}: {
  model: AppointmentModel;
  className?: string;
}) {
  const t = useAppT();
  const items = careItems(model, t);
  if (items.length === 0) return null;
  return (
    <ul
      className={cn("flex flex-wrap gap-1.5", className)}
      aria-label={t("calendar.detail.alerts")}
      data-testid="appointment-alerts"
    >
      {items.map((item) => (
        <li key={item.id} className="min-w-0 max-w-full">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex h-7 min-w-0 max-w-full items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium outline-none transition-colors duration-fast focus-visible:ring-2 focus-visible:ring-ring/50",
                  TONE[item.tone],
                )}
                aria-label={`${item.label}. ${item.detail}${item.extra ? ` ${item.extra}` : ""}`}
                data-testid={
                  item.id === "risk" ? "appointment-risk" : "appointment-alert"
                }
              >
                <item.icon className="size-3.5 shrink-0" aria-hidden />
                <span className="shrink-0">{item.label}</span>
                {item.hint && (
                  <span className="min-w-0 max-w-[12rem] truncate font-normal opacity-80">
                    · {item.hint}
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-72">
              <span className="flex flex-col gap-0.5 text-left">
                <Text
                  as="span"
                  size="xs"
                  weight="semibold"
                  className="block text-inherit"
                >
                  {item.label}
                </Text>
                <Text as="span" size="xs" className="block text-inherit">
                  {item.detail}
                </Text>
                {item.extra && (
                  <Text
                    as="span"
                    size="xs"
                    className="mt-1 block text-inherit opacity-80"
                  >
                    {item.extra}
                  </Text>
                )}
              </span>
            </TooltipContent>
          </Tooltip>
        </li>
      ))}
    </ul>
  );
}
