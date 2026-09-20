import * as React from "react";
import { cn } from "@/lib/utils";
import { RailOrientationContext, type RailOrientation } from "@/components/action-rail/railOrientation";
import { setRailPosition, useRailPosition } from "@/components/action-rail/railPosition";

/** El tamaño de icono que usan las piezas de la barra. */
export const RAIL_ICON = "h-[20px] w-[20px]";

/**
 * Marco acotado para las barras flotantes. `translateZ(0)` convierte al marco
 * en el bloque contenedor de cualquier `position: fixed` que haya dentro, así
 * la barra vertical se queda dentro del preview en vez de volar hasta el
 * borde del viewport de la documentación.
 *
 * Mientras la barra está arrastrada el marco suelta la transformación: el
 * arrastre trabaja en coordenadas del viewport, y con el marco como bloque
 * contenedor la barra saltaría lejos del puntero. El gesto se detecta en fase
 * de captura sobre el asa (`useDraggableRail` guarda la posición en el store
 * compartido solo al soltar). Al desmontar, devuelve la barra a su dock para
 * que otras páginas de la documentación la encuentren donde toca.
 */
export function RailFrame({
  children,
  className,
  height = 280,
}: {
  children: React.ReactNode;
  className?: string;
  height?: number;
}) {
  const [position] = useRailPosition();
  const grabbedRef = React.useRef(false);
  const [isGrabbing, setIsGrabbing] = React.useState(false);
  React.useEffect(() => () => setRailPosition(null), []);

  const endGrab = () => {
    grabbedRef.current = false;
    setIsGrabbing(false);
  };
  const isFloating = isGrabbing || position != null;

  return (
    <div
      className={cn("relative w-full overflow-hidden rounded-xl border border-border/60 bg-surface", className)}
      style={{ height, transform: isFloating ? undefined : "translateZ(0)" }}
      onPointerDownCapture={(event) => {
        const target = event.target instanceof Element ? event.target : null;
        grabbedRef.current = target?.closest(`[aria-label="${RAIL_GRIP_LABEL}"]`) != null;
      }}
      onPointerMoveCapture={() => {
        if (grabbedRef.current && !isGrabbing) setIsGrabbing(true);
      }}
      onPointerUpCapture={endGrab}
      onPointerCancelCapture={endGrab}
    >
      {children}
    </div>
  );
}

/** El `aria-label` de RailDragHandle, por el que el marco reconoce el asa. */
const RAIL_GRIP_LABEL = "Mover barra de acciones";

/**
 * Una barra oscura mínima —el mismo lienzo que dibuja `ActionRailShell`— para
 * mostrar piezas sueltas sin montar el shell completo. Fija la orientación por
 * contexto, así los ejemplos no dependen de la preferencia guardada.
 */
export function RailBar({
  children,
  orientation = "horizontal",
  className,
}: {
  children: React.ReactNode;
  orientation?: RailOrientation;
  className?: string;
}) {
  const isVertical = orientation === "vertical";
  return (
    <RailOrientationContext.Provider value={orientation}>
      <div
        className={cn(
          "dock-container flex items-center justify-center gap-2 rounded-3xl border border-white/10 bg-surface-nav shadow-rail",
          isVertical ? "w-14 flex-col py-3" : "h-14 px-3",
          className
        )}
      >
        {children}
      </div>
    </RailOrientationContext.Provider>
  );
}

/** Filas de una tabla ficticia, para que las acciones contextuales tengan algo que seleccionar. */
export const DEMO_ROWS = [
  { id: "r1", name: "Clima laboral Q3", status: "Activa" },
  { id: "r2", name: "Onboarding 2026", status: "Borrador" },
  { id: "r3", name: "Satisfacción de líderes", status: "Cerrada" },
] as const;

/** Estado de selección compartido por las demos: alternar una fila y limpiar. */
export function useDemoSelection(initial: readonly string[] = []) {
  const [selected, setSelected] = React.useState<readonly string[]>(initial);
  const toggle = React.useCallback((id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }, []);
  const clear = React.useCallback(() => setSelected([]), []);
  return { selected, toggle, clear } as const;
}

/** La tabla ficticia: tres filas con checkbox, sin más lógica que la selección. */
export function DemoTable({
  selected,
  onToggle,
  className,
}: {
  selected: readonly string[];
  onToggle: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">Encuestas</p>
      {DEMO_ROWS.map((row) => {
        const isChecked = selected.includes(row.id);
        return (
          <label
            key={row.id}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-[13px] transition-colors hover:bg-surface-subtle",
              isChecked && "bg-primary/5"
            )}
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => onToggle(row.id)}
              className="size-4 accent-[var(--color-brand)]"
            />
            <span className="flex-1 font-medium text-text-primary">{row.name}</span>
            <span className="text-xs text-text-muted">{row.status}</span>
          </label>
        );
      })}
    </div>
  );
}
