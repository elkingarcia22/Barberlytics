import * as React from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useDragReorder } from "@/hooks/useDragReorder";

/**
 * Kanban
 *
 * Tablero de columnas con tarjetas que cambian de etapa arrastrando: las fases
 * de una vacante (Nuevos → En revisión → Entrevista → Oferta) o el seguimiento
 * de tareas. Comparte el motor de arrastre con `Sortable` (`useDragReorder`) y
 * añade el movimiento lateral: con la tarjeta levantada, ← y → la pasan de
 * columna. El tablero es controlado: `onItemMove` decide el nuevo orden.
 */

export type KanbanTone = "default" | "primary" | "positive" | "warning" | "negative";

export interface KanbanColumn {
  id: string;
  title: string;
  description?: string;
  tone?: KanbanTone;
  /** Aviso cuando la columna supera este número de tarjetas (WIP). */
  limit?: number;
}

export interface KanbanItem {
  id: string;
  columnId: string;
  title: string;
  description?: string;
  /** Texto corto al pie de la tarjeta: una fecha, un responsable. */
  meta?: React.ReactNode;
  avatar?: React.ReactNode;
  badges?: React.ReactNode;
}

export interface KanbanProps extends React.HTMLAttributes<HTMLDivElement> {
  columns: KanbanColumn[];
  items: KanbanItem[];
  /** `toIndex` es la posición dentro de la columna destino, ya sin la tarjeta movida. */
  onItemMove?: (itemId: string, toColumnId: string, toIndex: number) => void;
  /** Sustituye el cuerpo de la tarjeta; el envoltorio arrastrable se mantiene. */
  renderItem?: (item: KanbanItem) => React.ReactNode;
  /** Ancho de cada columna en píxeles. */
  columnWidth?: number;
  emptyColumnLabel?: string;
}

/** Prefijo que distingue «soltar en la columna» de «soltar sobre una tarjeta». */
const COLUMN_TARGET = "kanban-column:";

const TONE_CLASSES: Record<KanbanTone, { dot: string; count: string }> = {
  default: { dot: "bg-text-muted", count: "" },
  primary: { dot: "bg-primary", count: "text-primary" },
  positive: { dot: "bg-success", count: "text-success" },
  warning: { dot: "bg-warning", count: "text-warning" },
  negative: { dot: "bg-destructive", count: "text-destructive" },
};

export function Kanban({
  columns,
  items,
  onItemMove,
  renderItem,
  columnWidth = 288,
  emptyColumnLabel = "Sin tarjetas",
  className,
  ...props
}: KanbanProps) {
  const byColumn = React.useMemo(() => {
    const map = new Map<string, KanbanItem[]>(columns.map((column) => [column.id, []]));
    for (const item of items) map.get(item.columnId)?.push(item);
    return map;
  }, [columns, items]);

  const [liftedId, setLiftedId] = React.useState<string | null>(null);
  const [announcement, setAnnouncement] = React.useState("");
  const originRef = React.useRef<{ columnId: string; index: number } | null>(null);
  const refs = React.useRef(new Map<string, HTMLElement>());

  const columnTitle = (columnId: string) => columns.find((column) => column.id === columnId)?.title ?? columnId;

  const announceMove = (item: KanbanItem, toColumnId: string, toIndex: number) => {
    const total = (byColumn.get(toColumnId)?.length ?? 0) + (item.columnId === toColumnId ? 0 : 1);
    setAnnouncement(`${item.title} movida a ${columnTitle(toColumnId)}, posición ${toIndex + 1} de ${total}`);
  };

  const moveTo = (item: KanbanItem, toColumnId: string, toIndex: number) => {
    const destination = byColumn.get(toColumnId) ?? [];
    const max = item.columnId === toColumnId ? destination.length - 1 : destination.length;
    const index = Math.max(0, Math.min(toIndex, max));
    const currentIndex = destination.findIndex((candidate) => candidate.id === item.id);
    if (item.columnId === toColumnId && currentIndex === index) return;
    onItemMove?.(item.id, toColumnId, index);
    announceMove(item, toColumnId, index);
  };

  const handleDrop = (fromId: string, toId: string) => {
    const item = items.find((candidate) => candidate.id === fromId);
    if (!item) return;

    if (toId.startsWith(COLUMN_TARGET)) {
      const toColumnId = toId.slice(COLUMN_TARGET.length);
      moveTo(item, toColumnId, (byColumn.get(toColumnId)?.length ?? 0));
      return;
    }

    const target = items.find((candidate) => candidate.id === toId);
    if (!target) return;
    const destination = byColumn.get(target.columnId) ?? [];
    moveTo(item, target.columnId, destination.findIndex((candidate) => candidate.id === target.id));
  };

  const { draggingId, overId, getHandleProps, getDropTargetProps } = useDragReorder(handleDrop);

  // Al cambiar de columna la tarjeta se desmonta y se vuelve a montar: hay que
  // devolverle el foco para no dejar al teclado sin punto de partida.
  React.useEffect(() => {
    if (liftedId) refs.current.get(liftedId)?.focus();
  }, [items, liftedId]);

  const handleKeyDown = (item: KanbanItem, event: React.KeyboardEvent<HTMLElement>) => {
    const list = byColumn.get(item.columnId) ?? [];
    const index = list.findIndex((candidate) => candidate.id === item.id);
    const columnIndex = columns.findIndex((column) => column.id === item.columnId);
    const isLifted = liftedId === item.id;

    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      if (isLifted) {
        setLiftedId(null);
        originRef.current = null;
        setAnnouncement(`${item.title} soltada en ${columnTitle(item.columnId)}, posición ${index + 1} de ${list.length}.`);
        return;
      }
      originRef.current = { columnId: item.columnId, index };
      setLiftedId(item.id);
      setAnnouncement(`${item.title} levantada. Usa las flechas para moverla y Espacio para soltarla.`);
      return;
    }

    if (event.key === "Escape" && isLifted) {
      event.preventDefault();
      const origin = originRef.current;
      setLiftedId(null);
      originRef.current = null;
      if (origin) {
        onItemMove?.(item.id, origin.columnId, origin.index);
        setAnnouncement(`Movimiento cancelado. ${item.title} vuelve a ${columnTitle(origin.columnId)}.`);
      }
      return;
    }

    if (!isLifted) return;

    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      moveTo(item, item.columnId, index + (event.key === "ArrowDown" ? 1 : -1));
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const target = columns[columnIndex + (event.key === "ArrowRight" ? 1 : -1)];
      if (target) moveTo(item, target.id, index);
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      {/* La barra horizontal es la del tema (ver `globals.css`); ScrollArea solo
          dibuja la vertical, así que aquí no encaja. */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-start gap-4">
          {columns.map((column) => {
            const list = byColumn.get(column.id) ?? [];
            const tone = TONE_CLASSES[column.tone ?? "default"];
            const isOverLimit = typeof column.limit === "number" && list.length > column.limit;

            return (
              <section
                key={column.id}
                aria-label={column.title}
                style={{ width: columnWidth }}
                className="flex shrink-0 flex-col rounded-2xl border border-border bg-surface-subtle"
              >
                <header className="flex flex-col gap-1 border-b border-border/60 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span aria-hidden className={cn("size-2 shrink-0 rounded-full", tone.dot)} />
                    <h3 className={cn("min-w-0 flex-1 truncate text-sm font-medium text-text-primary")}>{column.title}</h3>
                    <Badge variant="neutral" className={cn("shrink-0 tabular-nums", tone.count)}>
                      {typeof column.limit === "number" ? `${list.length}/${column.limit}` : list.length}
                    </Badge>
                  </div>
                  {column.description && <p className="text-xs text-text-muted">{column.description}</p>}
                  {isOverLimit && (
                    <p role="status" className="text-xs font-medium text-warning">
                      Supera el límite de {column.limit} tarjetas.
                    </p>
                  )}
                </header>

                <ul
                  role="list"
                  className={cn(
                    "flex min-h-24 flex-col gap-2 p-2 transition-colors duration-fast ease-standard motion-reduce:transition-none",
                    overId === `${COLUMN_TARGET}${column.id}` && draggingId && "bg-primary/5"
                  )}
                  {...getDropTargetProps(`${COLUMN_TARGET}${column.id}`)}
                >
                  {list.length === 0 && (
                    <li className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-text-muted">
                      {emptyColumnLabel}
                    </li>
                  )}

                  {list.map((item) => {
                    const isDragging = draggingId === item.id;
                    const isOver = overId === item.id && !isDragging;
                    const isLifted = liftedId === item.id;

                    return (
                      <li key={item.id} {...getDropTargetProps(item.id)}>
                        <div
                          ref={(element) => {
                            if (element) refs.current.set(item.id, element);
                            else refs.current.delete(item.id);
                          }}
                          tabIndex={0}
                          aria-roledescription="tarjeta reordenable"
                          aria-label={item.title}
                          data-lifted={isLifted || undefined}
                          onKeyDown={(event) => handleKeyDown(item, event)}
                          className={cn(
                            "group/card cursor-grab rounded-xl text-left outline-none transition-[box-shadow,opacity] duration-fast ease-out-expo",
                            "focus-visible:ring-2 focus-visible:ring-ring/50 active:cursor-grabbing motion-reduce:transition-none",
                            !renderItem && "border border-border bg-surface p-3 shadow-card",
                            isDragging && "opacity-50",
                            isOver && "ring-2 ring-primary/40",
                            isLifted && "ring-2 ring-primary/60"
                          )}
                          {...getHandleProps(item.id)}
                        >
                          {renderItem ? (
                            renderItem(item)
                          ) : (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-start gap-2">
                                <GripVertical aria-hidden className="mt-0.5 size-4 shrink-0 text-text-muted opacity-0 transition-opacity duration-fast group-hover/card:opacity-100 motion-reduce:transition-none" />
                                <span className="min-w-0 flex-1 text-sm font-medium leading-tight text-text-primary">{item.title}</span>
                                {item.avatar && <span className="shrink-0">{item.avatar}</span>}
                              </div>
                              {item.description && <p className="text-xs leading-relaxed text-text-secondary">{item.description}</p>}
                              {item.badges && <div className="flex flex-wrap items-center gap-1">{item.badges}</div>}
                              {item.meta && <div className="text-xs text-text-muted">{item.meta}</div>}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </div>

      <div aria-live="polite" role="status" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
