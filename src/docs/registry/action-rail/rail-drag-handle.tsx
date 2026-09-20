import { Copy, Download, Trash2 } from "lucide-react";
import { RailButton, RailDivider, RailDragHandle, useDraggableRail, useRailPosition } from "@/components/action-rail";
import { cn } from "@/lib/utils";
import { defineEntry, definePlayground } from "../types";
import { RAIL_ICON, RailBar, RailFrame } from "./railDemo";

/**
 * Una barra mínima que se puede coger por el asa y soltar en cualquier punto,
 * con la misma mecánica que el shell: mientras no se ha arrastrado vive en
 * su dock; en cuanto hay `position`, pasa a `fixed` y se ancla por su centro.
 */
function DraggableBarDemo() {
  const { barRef, position, isDragging, gripHandlers, resetPosition } = useDraggableRail();
  const isFloating = position != null;
  return (
    <RailFrame height={260}>
      <div className="absolute inset-x-0 top-4 flex flex-col items-center gap-1 text-center">
        <p className="text-xs text-text-muted">Arrastra el asa; doble clic la devuelve a su sitio.</p>
        <p className="font-mono text-[11px] text-text-secondary">
          position = {position ? `{ x: ${Math.round(position.x)}, y: ${Math.round(position.y)} }` : "null"} · isDragging = {String(isDragging)}
        </p>
        {isFloating && (
          <button type="button" onClick={resetPosition} className="mt-1 rounded-lg border border-border/60 bg-surface px-2.5 py-1 text-[11px] font-semibold text-text-primary hover:bg-surface-subtle">
            resetPosition()
          </button>
        )}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-4">
        <div
          ref={barRef}
          className={cn("pointer-events-auto flex flex-col items-center", isFloating && "fixed z-[60]")}
          style={position ? { left: position.x, top: position.y, transform: "translateX(-50%)" } : undefined}
        >
          <RailBar className={cn(isDragging && "ring-2 ring-primary/40")}>
            <RailDragHandle isDragging={isDragging} {...gripHandlers} />
            <RailDivider />
            <RailButton icon={<Download className={RAIL_ICON} strokeWidth={2} />} label="Exportar" onClick={() => undefined} />
            <RailButton icon={<Copy className={RAIL_ICON} strokeWidth={2} />} label="Duplicar" onClick={() => undefined} />
            <RailButton icon={<Trash2 className={RAIL_ICON} strokeWidth={2} />} label="Eliminar" tone="danger" onClick={() => undefined} />
          </RailBar>
        </div>
      </div>
    </RailFrame>
  );
}

/** Lo que guarda el store compartido, leído desde fuera de cualquier barra. */
function PositionReadout() {
  const [position, setPosition] = useRailPosition();
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="font-mono text-[12px] text-text-primary">
        useRailPosition() → {position ? `{ x: ${Math.round(position.x)}, y: ${Math.round(position.y)} }` : "null"}
      </p>
      <p className="max-w-md text-center text-xs text-text-muted">
        Es la misma posición que lee cualquier otra barra montada: arrastra la del ejemplo anterior y este valor cambia. No se persiste: al recargar, la barra vuelve al dock.
      </p>
      <button type="button" onClick={() => setPosition(null)} disabled={!position} className="rounded-lg border border-border/60 bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary transition-colors hover:bg-surface-subtle disabled:opacity-50">
        setPosition(null)
      </button>
    </div>
  );
}

export const railDragHandleEntry = defineEntry({
  id: "rail-drag-handle",
  name: "RailDragHandle",
  group: "action-rail",
  description:
    "El asa con la que se recoloca la barra flotante, y el hook useDraggableRail que hace el trabajo: sigue al puntero, guarda el punto de soltado en un store compartido (useRailPosition) y limita la barra al viewport si la ventana se encoge. Doble clic en el asa devuelve la barra a su dock.",
  importPath: 'import { RailDragHandle, useDraggableRail, useRailPosition } from "@/components/action-rail"',
  sourcePath: "src/components/action-rail/RailDragHandle.tsx",
  status: "stable",
  tags: ["pointer-events", "shared-store", "tooltip"],
  playground: definePlayground({
    controls: {
      isDragging: { type: "boolean", label: "isDragging", default: false },
      vertical: { type: "boolean", label: "Barra vertical", default: false },
    },
    render: ({ isDragging, vertical }) => (
      <RailBar orientation={vertical ? "vertical" : "horizontal"}>
        <RailDragHandle isDragging={isDragging} onPointerDown={() => undefined} onPointerMove={() => undefined} onPointerUp={() => undefined} onPointerCancel={() => undefined} onDoubleClick={() => undefined} />
        <RailDivider />
        <RailButton icon={<Download className={RAIL_ICON} strokeWidth={2} />} label="Exportar" onClick={() => undefined} />
      </RailBar>
    ),
    code: ({ isDragging }) => `const { barRef, position, isDragging, gripHandlers } = useDraggableRail();

<RailDragHandle isDragging={${isDragging ? "true /* durante el gesto */" : "isDragging"}} {...gripHandlers} />`,
  }),
  examples: [
    {
      id: "draggable",
      title: "Barra arrastrable con useDraggableRail",
      description:
        "`barRef` va en la caja que se mueve; cuando `position` deja de ser null, esa caja pasa a `fixed` y se ancla por su centro (`left` + `translateX(-50%)`), así recogerse a la pastilla no la desplaza. Al arrastrar, la barra sale del marco y flota sobre la página, como en la app.",
      layout: "stretch",
      code: `const { barRef, position, isDragging, gripHandlers } = useDraggableRail();
const isFloating = position != null;

<div
  ref={barRef}
  className={cn("flex flex-col items-center", isFloating && "fixed z-[60]")}
  style={position ? { left: position.x, top: position.y, transform: "translateX(-50%)" } : undefined}
>
  <RailBar>
    <RailDragHandle isDragging={isDragging} {...gripHandlers} />
    <RailDivider />
    <RailButton icon={<Download />} label="Exportar" onClick={exportAll} />
  </RailBar>
</div>`,
      render: () => <DraggableBarDemo />,
    },
    {
      id: "shared-position",
      title: "useRailPosition: un solo sitio para todas las barras",
      description: "La posición vive fuera de React para que la barra de una pantalla y la del drawer sean, para la persona, la misma barra dejada en el mismo sitio.",
      code: `const [position, setPosition] = useRailPosition();
// position: { x, y } | null — x es el centro horizontal de la barra
setPosition(null); // de vuelta al dock`,
      render: () => <PositionReadout />,
    },
  ],
  props: [
    { name: "isDragging", type: "boolean", description: "Estado del gesto; pinta el asa como agarrada." },
    { name: "onPointerDown / onPointerMove / onPointerUp / onPointerCancel", type: "(event: React.PointerEvent<HTMLButtonElement>) => void", description: "Los manejadores del gesto. Pásalos con `{...gripHandlers}`." },
    { name: "onDoubleClick", type: "() => void", description: "Devuelve la barra al dock; `gripHandlers` lo conecta con `resetPosition`." },
    { name: "useDraggableRail()", type: "{ barRef; position; isDragging; resetPosition; gripHandlers }", description: "`barRef` va en la caja que se recoloca; `position` es null hasta el primer arrastre." },
    { name: "useRailPosition()", type: "readonly [RailPosition | null, (value) => void]", description: "El store compartido, sin persistencia. `x` es el centro de la barra, no su borde izquierdo." },
  ],
  guidelines: {
    do: [
      "Mantén la barra abierta mientras `isDragging` sea true: el shell suspende su temporizador de auto-ocultar durante el gesto.",
      "Pon el asa en cabeza de la barra, junto al menú de ajustes: son los controles de la barra, no de la pantalla.",
      "Aplica `position` con `left` + `translateX(-50%)`; la barra cambia de ancho al recogerse y el centro es lo que la persona soltó.",
    ],
    dont: [
      "No persistas la posición en storage: una recarga debe devolver la barra a su dock.",
      "No montes dos barras arrastrables a la vez en la misma pantalla; comparten posición y se pisarían.",
      "No pongas el asa en un elemento sin `touch-action: none`; el componente ya lo trae, no lo sobrescribas.",
    ],
  },
  related: ["action-rail-shell", "rail-settings-menu", "drawer-action-rail"],
});
