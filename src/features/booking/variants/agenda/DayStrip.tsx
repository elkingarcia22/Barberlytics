import * as React from "react";
import { addDays } from "date-fns";
import { useAppT } from "@/app/i18n";
import { Text } from "@/components/typography";
import { useDragScroll } from "@/hooks/useDragScroll";
import { useLocale } from "@/i18n";
import { cn } from "@/lib/utils";
import { dayKeyOf, isSameDayAs } from "../../bookingFormat";

interface DayStripProps {
  /** El primer día que se ofrece (hoy, o mañana si hoy ya cerró). */
  first: Date;
  count: number;
  value: Date;
  onChange: (day: Date) => void;
  /** Días con citas en el carrito: llevan un punto. */
  marked?: ReadonlySet<string>;
  size?: "default" | "lg";
}

/**
 * La tira de días de la agenda: el día de la semana arriba y el número grande,
 * en fila y deslizable. Lo que se toca aquí cambia todo el tablero de horas.
 */
export function DayStrip({ first, count, value, onChange, marked, size = "default" }: DayStripProps) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const row = useDragScroll<HTMLDivElement>({ follow: dayKeyOf(value) });
  const days = React.useMemo(() => Array.from({ length: count }, (_, index) => addDays(first, index)), [first, count]);
  const today = new Date();

  return (
    <div ref={row} role="radiogroup" aria-label={t("booking.agenda.dayLabel")} className="-mx-1 flex gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {days.map((day) => {
        const selected = isSameDayAs(day, value);
        const isToday = isSameDayAs(day, today);
        return (
          <button
            key={dayKeyOf(day)}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-pressed={selected}
            aria-label={formatDate(day, { weekday: "long", day: "numeric", month: "long" })}
            onClick={() => onChange(day)}
            className={cn(
              "relative flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl border transition-[background-color,border-color,transform] duration-fast ease-out-expo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.97] motion-reduce:transition-none",
              size === "lg" ? "h-20 w-16" : "h-16 w-14",
              selected ? "border-primary bg-primary shadow-md" : "border-border bg-surface hover:border-primary/40 hover:bg-surface-subtle"
            )}
          >
            {/* Sobre el color principal va su propio texto (`primary-foreground`), no el «inverso»: así contrasta en todo tema. */}
            <Text as="span" size="xs" weight="medium" tone={selected ? undefined : "muted"} className={cn("uppercase tracking-wide", selected && "text-primary-foreground/80")}>
              {isToday ? t("booking.earliest.today") : formatDate(day, { weekday: "short" }).replace(".", "")}
            </Text>
            <Text as="span" size="xl" weight="semibold" tabular className={selected ? "text-primary-foreground" : undefined}>
              {day.getDate()}
            </Text>
            {marked?.has(dayKeyOf(day)) && <span aria-hidden className={cn("absolute bottom-1.5 size-1.5 rounded-full", selected ? "bg-primary-foreground" : "bg-primary")} />}
          </button>
        );
      })}
    </div>
  );
}
