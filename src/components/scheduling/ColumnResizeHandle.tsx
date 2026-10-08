import * as React from "react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";
import { clampColumnWidth, SCHEDULE_COLUMN_MAX_PX, SCHEDULE_COLUMN_MIN_PX } from "./scheduleUtils";

/**
 * El asa del borde derecho de una columna, como la de una tabla: se arrastra
 * para ensancharla o estrecharla, se mueve con las flechas del teclado y con
 * doble clic vuelve a su ancho de siempre.
 *
 * Mientras se arrastra avisa por `onPreview` (un cambio por frame, sin
 * guardar) y al soltar por `onCommit`; `Escape` deshace el arrastre. El ancho
 * de partida se mide en el momento —la columna puede estar repartiendo el
 * sobrante de la rejilla—, así que el asa no necesita saber cuánto mide.
 */

/** Cuánto se mueve con una flecha, y con Mayús + flecha. */
const KEYBOARD_STEP_PX = 16;
const KEYBOARD_BIG_STEP_PX = 64;

export interface ColumnResizeHandleProps {
  /** El nombre de la columna, para el lector de pantalla. */
  label: string;
  /** Lo que mide ahora la columna en pantalla. */
  measure: () => number;
  /** El ancho guardado, si lo hay: es el valor que anuncia el asa. */
  width?: number;
  onPreview: (width: number | null) => void;
  /** El ancho nuevo, o `null` para volver al de siempre. */
  onCommit: (width: number | null) => void;
}

interface DragState {
  pointerId: number;
  origin: number;
  start: number;
  latest: number;
}

export function ColumnResizeHandle({ label, measure, width, onPreview, onCommit }: ColumnResizeHandleProps) {
  const t = useT();
  const dragRef = React.useRef<DragState | null>(null);
  const [dragging, setDragging] = React.useState(false);

  const finish = (target: HTMLElement, pointerId: number) => {
    dragRef.current = null;
    setDragging(false);
    if (target.hasPointerCapture?.(pointerId)) target.releasePointerCapture(pointerId);
  };

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-orientation="vertical"
      aria-label={t("schedule.columnResize", { name: label })}
      aria-valuemin={SCHEDULE_COLUMN_MIN_PX}
      aria-valuemax={SCHEDULE_COLUMN_MAX_PX}
      aria-valuenow={width === undefined ? undefined : Math.round(width)}
      title={t("schedule.columnResizeHint")}
      data-testid="schedule-column-resize"
      data-dragging={dragging || undefined}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture?.(event.pointerId);
        const start = measure();
        dragRef.current = { pointerId: event.pointerId, origin: event.clientX, start, latest: start };
        setDragging(true);
      }}
      onPointerMove={(event) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        drag.latest = clampColumnWidth(drag.start + event.clientX - drag.origin);
        onPreview(drag.latest);
      }}
      onPointerUp={(event) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        finish(event.currentTarget, event.pointerId);
        onPreview(null);
        // Un clic sin mover no cambia nada: así el doble clic no deja un ancho fijo por el camino.
        if (Math.abs(drag.latest - drag.start) >= 1) onCommit(drag.latest);
      }}
      onPointerCancel={(event) => {
        if (!dragRef.current) return;
        finish(event.currentTarget, event.pointerId);
        onPreview(null);
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        onCommit(null);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && dragRef.current) {
          finish(event.currentTarget, dragRef.current.pointerId);
          onPreview(null);
          return;
        }
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        const step = (event.shiftKey ? KEYBOARD_BIG_STEP_PX : KEYBOARD_STEP_PX) * (event.key === "ArrowRight" ? 1 : -1);
        onCommit(clampColumnWidth(measure() + step));
      }}
      className={cn(
        // Solo con puntero fino: en pantalla estrecha la agenda va de un barbero a la vez.
        "group/resize absolute inset-y-0 right-0 z-raised hidden w-2 cursor-col-resize touch-none select-none md:block",
        "focus-visible:outline-none"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-1.5 right-0 w-0.5 rounded-full bg-primary opacity-0",
          "transition-opacity duration-fast ease-out-expo motion-reduce:transition-none",
          "group-hover/resize:opacity-60 group-focus-visible/resize:opacity-100",
          dragging && "opacity-100"
        )}
      />
    </div>
  );
}
