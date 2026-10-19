import { Feather, Flame, Minus, type LucideIcon } from "lucide-react";
import { useAppT, type AppMessageKey } from "@/app/i18n";
import { Text } from "@/components/typography";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { DayWeight, DayWeightLevel } from "./dayWeight";

/**
 * La píldora de «día pesado» / «día suave»: sale en la cabecera de la semana,
 * en el mes, en la lista y en el panel del día. Lo de por qué (cuántas citas
 * suele tener ese día frente a uno cualquiera) va en su tooltip. Un día normal
 * no se marca, salvo donde se pide con `showNormal`.
 */

const LEVEL: Record<DayWeightLevel, { icon: LucideIcon; label: AppMessageKey; tone: string }> = {
  heavy: { icon: Flame, label: "calendar.weight.heavy", tone: "border-status-warning/30 bg-status-warning/10 text-status-warning" },
  light: { icon: Feather, label: "calendar.weight.light", tone: "border-status-info/30 bg-status-info/10 text-status-info" },
  normal: { icon: Minus, label: "calendar.weight.normal", tone: "border-border bg-surface-muted text-text-secondary" },
};

export interface DayWeightBadgeProps {
  weight: DayWeight | null;
  /** Cuántas citas lleva ya el día, para decirlo en el tooltip. */
  booked?: number;
  /** Solo el icono (para la celda del mes, que es estrecha). */
  compact?: boolean;
  showNormal?: boolean;
  className?: string;
}

export function DayWeightBadge({ weight, booked, compact = false, showNormal = false, className }: DayWeightBadgeProps) {
  const t = useAppT();
  if (!weight || (weight.level === "normal" && !showNormal)) return null;
  const level = LEVEL[weight.level];
  const Icon = level.icon;
  const label = t(level.label);
  const detail = t("calendar.weight.hint", { expected: weight.expected, average: weight.average });
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="img"
          aria-label={`${label}. ${detail}`}
          data-testid={`day-weight-${weight.level}`}
          className={cn("inline-flex shrink-0 items-center gap-1 rounded-full border font-medium", compact ? "size-5 justify-center" : "h-6 px-2 text-xs", level.tone, className)}
        >
          <Icon className="size-3" aria-hidden="true" />
          {!compact && label}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        <span className="flex flex-col gap-0.5 text-left">
          <Text as="span" size="xs" weight="semibold" className="block text-inherit">
            {label}
          </Text>
          <Text as="span" size="xs" className="block text-inherit">
            {detail}
          </Text>
          {booked !== undefined && (
            <Text as="span" size="xs" className="mt-1 block text-inherit opacity-80">
              {t("calendar.weight.booked", { booked, expected: weight.expected })}
            </Text>
          )}
        </span>
      </TooltipContent>
    </Tooltip>
  );
}
