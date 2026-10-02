import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SegmentedControl } from "@/components/selection/SegmentedControl"
import { cn } from "@/lib/utils"
import {
  formatPeriodLabel,
  isCurrentPeriod,
  shiftPeriod,
  type PeriodGranularity,
} from "./periodRange"

export interface PeriodNavigatorLabels {
  day: string
  week: string
  month: string
  /** El botón que vuelve al periodo de hoy. */
  today: string
  previous: string
  next: string
  /** Cómo se anuncia el grupo a un lector de pantalla. */
  aria: string
}

export interface PeriodNavigatorProps {
  granularity: PeriodGranularity
  onGranularityChange: (granularity: PeriodGranularity) => void
  /** La fecha ancla: cualquier día dentro del periodo que se está mirando. */
  date: Date
  onDateChange: (date: Date) => void
  /** Los rótulos, traducidos por quien monta. */
  labels: PeriodNavigatorLabels
  /** El idioma con el que se escribe el periodo (`es-CO`, `en-US`). */
  locale?: string
  /** Bloquea el avance más allá del periodo de hoy. Activo por defecto. */
  clampToToday?: boolean
  className?: string
}

const GRANULARITIES: readonly PeriodGranularity[] = ["day", "week", "month"]

/**
 * PeriodNavigator
 *
 * La barra de tiempo de un tablero: el grano (día, semana, mes), el periodo
 * que se está mirando y las flechas para moverlo. Cambiar de grano conserva
 * la fecha ancla, así que pasar de «esta semana» a «este mes» aterriza en el
 * mes de esa misma semana, no en hoy.
 *
 * El rótulo del periodo sale de `Intl` con el idioma que se le pase, y el
 * salto adelante se frena en hoy: un tablero de lo que pasó no tiene nada que
 * enseñar de la semana que viene.
 *
 * @example
 * <PeriodNavigator
 *   granularity={granularity}
 *   onGranularityChange={setGranularity}
 *   date={date}
 *   onDateChange={setDate}
 *   locale="es-CO"
 *   labels={{ day: "Hoy", week: "Semana", month: "Mes", today: "Ir a hoy", previous: "Anterior", next: "Siguiente", aria: "Periodo" }}
 * />
 */
export function PeriodNavigator({
  granularity,
  onGranularityChange,
  date,
  onDateChange,
  labels,
  locale = "es-CO",
  clampToToday = true,
  className,
}: PeriodNavigatorProps) {
  const isCurrent = isCurrentPeriod(date, granularity)
  const nextBlocked = clampToToday && isCurrent

  return (
    /* En una sola línea a propósito: el grano, las flechas pegadas al rótulo y
       «ir a hoy» son un solo control, no tres. Lo que se pliega en una pantalla
       estrecha es la fila que lo contiene, no la barra por dentro. */
    <div role="group" aria-label={labels.aria} className={cn("flex flex-nowrap items-center gap-inline", className)}>
      <SegmentedControl
        size="sm"
        ariaLabel={labels.aria}
        value={granularity}
        onChange={(value) => onGranularityChange(value as PeriodGranularity)}
        options={GRANULARITIES.map((value) => ({ value, label: labels[value] }))}
      />

      <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-surface py-0.5 pl-0.5 pr-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={labels.previous}
          onClick={() => onDateChange(shiftPeriod(date, granularity, -1))}
        >
          <ChevronLeft />
        </Button>
        <span className="whitespace-nowrap px-2 text-sm font-semibold text-text-primary" aria-live="polite">
          {formatPeriodLabel(date, granularity, locale)}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={labels.next}
          disabled={nextBlocked}
          onClick={() => onDateChange(shiftPeriod(date, granularity, 1))}
        >
          <ChevronRight />
        </Button>
      </div>

      {!isCurrent && (
        <Button type="button" variant="outline" size="sm" onClick={() => onDateChange(new Date())}>
          {labels.today}
        </Button>
      )}
    </div>
  )
}
