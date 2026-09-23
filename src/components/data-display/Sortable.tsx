import * as React from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDragReorder } from "@/hooks/useDragReorder";
import { moveItem } from "@/lib/reorder";

/**
 * Sortable
 *
 * Lista que se reordena arrastrando: las lecciones de un plan de formación, las
 * preguntas de una encuesta, los pasos de un proceso. El arrastre con ratón usa
 * el motor compartido (`useDragReorder` + `moveItem`); el teclado levanta el
 * elemento con Espacio, lo mueve con las flechas y lo suelta con Espacio, y
 * cada cambio se anuncia en una región `aria-live`.
 */

export type SortableOrientation = "vertical" | "horizontal";

export interface SortableItemState {
  /** Se está arrastrando con el puntero. */
  isDragging: boolean;
  /** El puntero está encima de este elemento con algo agarrado. */
  isOver: boolean;
  /** Se levantó con el teclado y las flechas lo mueven. */
  isLifted: boolean;
  index: number;
  total: number;
}

interface SortableContextValue {
  ids: readonly string[];
  orientation: SortableOrientation;
  disabled: boolean;
  handle: boolean;
  draggingId: string | null;
  overId: string | null;
  liftedId: string | null;
  labels: ReadonlyMap<string, string>;
  registerRef: (id: string, element: HTMLElement | null) => void;
  getHandleProps: ReturnType<typeof useDragReorder>["getHandleProps"];
  getDropTargetProps: ReturnType<typeof useDragReorder>["getDropTargetProps"];
  onItemKeyDown: (id: string, event: React.KeyboardEvent<HTMLElement>) => void;
}

const SortableContext = React.createContext<SortableContextValue | null>(null);

function useSortableContext(component: string): SortableContextValue {
  const context = React.useContext(SortableContext);
  if (!context) throw new Error(`${component} debe usarse dentro de <Sortable>.`);
  return context;
}

/** Etiqueta legible de un item para los anuncios de lectores de pantalla. */
function defaultLabel(item: unknown, index: number): string {
  if (item && typeof item === "object") {
    const record = item as Record<string, unknown>;
    for (const key of ["label", "title", "name"]) {
      if (typeof record[key] === "string") return record[key] as string;
    }
  }
  return `Elemento ${index + 1}`;
}

export interface SortableProps<T> extends Omit<React.HTMLAttributes<HTMLUListElement>, "children" | "onDrop"> {
  items: T[];
  getId: (item: T) => string;
  /** Recibe la lista completa ya reordenada; nunca muta la original. */
  onReorder: (items: T[]) => void;
  /** Texto del item en los anuncios («Lección 3 movida a…»). */
  getLabel?: (item: T) => string;
  /** Alternativa a componer los hijos con `SortableItem`. */
  renderItem?: (item: T, state: SortableItemState) => React.ReactNode;
  children?: React.ReactNode;
  /** Agarre dedicado con el icono `GripVertical`; sin él arrastra la fila entera. */
  handle?: boolean;
  orientation?: SortableOrientation;
  disabled?: boolean;
}

export function Sortable<T>({
  items,
  getId,
  onReorder,
  getLabel,
  renderItem,
  children,
  handle = true,
  orientation = "vertical",
  disabled = false,
  className,
  ...props
}: SortableProps<T>) {
  const ids = React.useMemo(() => items.map(getId), [items, getId]);
  const labels = React.useMemo(
    () => new Map(items.map((item, index) => [getId(item), getLabel ? getLabel(item) : defaultLabel(item, index)])),
    [items, getId, getLabel]
  );

  const [liftedId, setLiftedId] = React.useState<string | null>(null);
  const [announcement, setAnnouncement] = React.useState("");
  const snapshotRef = React.useRef<T[] | null>(null);
  const refs = React.useRef(new Map<string, HTMLElement>());

  const registerRef = React.useCallback((id: string, element: HTMLElement | null) => {
    if (element) refs.current.set(id, element);
    else refs.current.delete(id);
  }, []);

  const move = (fromId: string, toId: string) => {
    const from = ids.indexOf(fromId);
    const to = ids.indexOf(toId);
    if (from === -1 || to === -1 || from === to) return;
    onReorder(moveItem(items, from, to));
  };

  const { draggingId, overId, getHandleProps, getDropTargetProps } = useDragReorder(move);

  const moveBy = (id: string, delta: number) => {
    const from = ids.indexOf(id);
    const to = from + delta;
    if (from === -1 || to < 0 || to >= ids.length) return;
    onReorder(moveItem(items, from, to));
    setAnnouncement(`${labels.get(id) ?? "Elemento"} movida a la posición ${to + 1} de ${ids.length}`);
  };

  const onItemKeyDown = (id: string, event: React.KeyboardEvent<HTMLElement>) => {
    if (disabled) return;
    const isLifted = liftedId === id;
    const previousKey = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
    const nextKey = orientation === "vertical" ? "ArrowDown" : "ArrowRight";
    const label = labels.get(id) ?? "Elemento";
    const index = ids.indexOf(id);

    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      if (isLifted) {
        setLiftedId(null);
        snapshotRef.current = null;
        setAnnouncement(`${label} soltada en la posición ${index + 1} de ${ids.length}.`);
        return;
      }
      snapshotRef.current = [...items];
      setLiftedId(id);
      setAnnouncement(`${label} levantada. Usa las flechas para moverla y Espacio para soltarla.`);
      return;
    }

    if (event.key === "Escape" && isLifted) {
      event.preventDefault();
      const snapshot = snapshotRef.current;
      setLiftedId(null);
      snapshotRef.current = null;
      if (snapshot) onReorder(snapshot);
      const original = snapshot ? snapshot.map(getId).indexOf(id) : index;
      setAnnouncement(`Movimiento cancelado. ${label} vuelve a la posición ${original + 1} de ${ids.length}.`);
      return;
    }

    if (event.key !== previousKey && event.key !== nextKey) return;
    event.preventDefault();
    const delta = event.key === nextKey ? 1 : -1;

    if (isLifted) {
      moveBy(id, delta);
      return;
    }

    // Sin nada levantado las flechas solo mueven el foco entre agarres.
    refs.current.get(ids[index + delta])?.focus();
  };

  const contextValue: SortableContextValue = {
    ids,
    orientation,
    disabled,
    handle,
    draggingId,
    overId,
    liftedId,
    labels,
    registerRef,
    getHandleProps,
    getDropTargetProps,
    onItemKeyDown,
  };

  return (
    <SortableContext.Provider value={contextValue}>
      <ul
        className={cn("flex gap-2", orientation === "vertical" ? "flex-col" : "flex-row flex-wrap items-stretch", className)}
        {...props}
      >
        {renderItem
          ? items.map((item, index) => {
              const id = getId(item);
              return (
                <SortableItem key={id} id={id}>
                  {renderItem(item, {
                    isDragging: draggingId === id,
                    isOver: overId === id && draggingId !== id,
                    isLifted: liftedId === id,
                    index,
                    total: items.length,
                  })}
                </SortableItem>
              );
            })
          : children}
      </ul>
      <div aria-live="polite" role="status" className="sr-only">
        {announcement}
      </div>
    </SortableContext.Provider>
  );
}

export interface SortableItemProps extends Omit<React.LiHTMLAttributes<HTMLLIElement>, "id"> {
  id: string;
  children?: React.ReactNode;
}

export function SortableItem({ id, children, className, ...props }: SortableItemProps) {
  const context = useSortableContext("SortableItem");
  const { disabled, handle, draggingId, overId, liftedId, labels } = context;

  const isDragging = draggingId === id;
  const isOver = overId === id && !isDragging;
  const isLifted = liftedId === id;
  const label = labels.get(id) ?? "Elemento";

  const dragProps = disabled ? undefined : context.getHandleProps(id);
  const dropProps = disabled ? undefined : context.getDropTargetProps(id);

  const grabberClasses = cn(
    "flex shrink-0 cursor-grab items-center justify-center rounded-md p-1 text-text-muted transition-colors duration-fast ease-standard",
    "hover:bg-surface-subtle hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
    "motion-reduce:transition-none active:cursor-grabbing",
    disabled && "pointer-events-none opacity-50",
    isLifted && "bg-primary/10 text-primary"
  );

  const rowClasses = cn(
    "group/sortable relative flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2",
    "transition-[box-shadow,opacity,transform] duration-fast ease-out-expo motion-reduce:transition-none",
    isDragging && "opacity-50",
    isLifted && "shadow-card ring-2 ring-primary/40",
    isOver && "border-primary/60 shadow-card",
    className
  );

  if (!handle) {
    return (
      <li
        ref={(element) => context.registerRef(id, element)}
        tabIndex={disabled ? -1 : 0}
        aria-roledescription="elemento reordenable"
        aria-label={label}
        data-lifted={isLifted || undefined}
        onKeyDown={(event) => context.onItemKeyDown(id, event)}
        className={cn(rowClasses, !disabled && "cursor-grab active:cursor-grabbing", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50")}
        {...dragProps}
        {...dropProps}
        {...props}
      >
        {children}
      </li>
    );
  }

  return (
    <li className={rowClasses} {...dropProps} {...props}>
      <button
        type="button"
        ref={(element) => context.registerRef(id, element)}
        disabled={disabled}
        aria-label={`Reordenar ${label}`}
        aria-roledescription="agarre de reordenación"
        aria-pressed={isLifted}
        onKeyDown={(event) => context.onItemKeyDown(id, event)}
        className={grabberClasses}
        {...dragProps}
      >
        <GripVertical className="size-4" />
      </button>
      {children}
    </li>
  );
}
