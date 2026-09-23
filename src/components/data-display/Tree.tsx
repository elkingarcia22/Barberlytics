import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ThemaIcon } from "@/icons/ThemaIcon";

/**
 * Tree
 *
 * Árbol jerárquico para estructuras anidadas: empresa → áreas → equipos →
 * personas, o la selección de una audiencia. Implementa el patrón ARIA
 * completo (`tree`/`treeitem`/`group`, `aria-level`, foco itinerante) para que
 * se pueda recorrer entero con el teclado.
 */

export interface TreeNode {
  id: string;
  label: string;
  /** Icono a la izquierda de la etiqueta; se dibuja a 16px. */
  icon?: React.ReactNode;
  /** Contador a la derecha, p. ej. cuántas personas cuelgan del nodo. */
  count?: number;
  /** El nodo no se puede seleccionar ni enfocar; sus hijos tampoco cuentan. */
  disabled?: boolean;
  children?: TreeNode[];
}

export type TreeSelectable = "none" | "single" | "multiple";

export interface TreeProps extends Omit<React.HTMLAttributes<HTMLUListElement>, "onSelect"> {
  nodes: TreeNode[];
  /** Ids expandidos en modo controlado. */
  expandedIds?: string[];
  defaultExpandedIds?: string[];
  onExpandedChange?: (ids: string[]) => void;
  /** Ids seleccionados en modo controlado. */
  selectedIds?: string[];
  defaultSelectedIds?: string[];
  onSelectedChange?: (ids: string[]) => void;
  /** `multiple` añade casilla por nodo, con indeterminado y propagación. */
  selectable?: TreeSelectable;
  size?: "sm" | "default";
  /** Texto cuando `nodes` viene vacío. */
  emptyLabel?: string;
}

type CheckState = "checked" | "indeterminate" | "unchecked";

interface FlatNode {
  node: TreeNode;
  level: number;
  parentId: string | null;
}

const SIZE_CLASSES = {
  default: { row: "gap-2 py-1.5 text-sm", icon: "size-4", chevron: "size-4" },
  sm: { row: "gap-1.5 py-1 text-xs", icon: "size-3.5", chevron: "size-3.5" },
} as const;

/** Nodos visibles en orden de lectura: lo que recorren ↑ y ↓. */
function flatten(nodes: readonly TreeNode[], expanded: ReadonlySet<string>, level = 1, parentId: string | null = null): FlatNode[] {
  return nodes.flatMap((node) => {
    const row: FlatNode = { node, level, parentId };
    const hasChildren = Boolean(node.children?.length);
    if (!hasChildren || !expanded.has(node.id)) return [row];
    return [row, ...flatten(node.children ?? [], expanded, level + 1, node.id)];
  });
}

/** Ids del nodo y de toda su descendencia, saltando las ramas deshabilitadas. */
function collectEnabledIds(node: TreeNode, out: string[] = []): string[] {
  if (node.disabled) return out;
  out.push(node.id);
  for (const child of node.children ?? []) collectEnabledIds(child, out);
  return out;
}

/** Un padre está marcado si lo están todos sus hijos activos; a medias, indeterminado. */
function resolveCheckState(node: TreeNode, selected: ReadonlySet<string>): CheckState {
  const children = (node.children ?? []).filter((child) => !child.disabled);
  if (children.length === 0) return selected.has(node.id) ? "checked" : "unchecked";

  const states = children.map((child) => resolveCheckState(child, selected));
  if (states.every((state) => state === "checked")) return "checked";
  if (states.every((state) => state === "unchecked")) return selected.has(node.id) ? "indeterminate" : "unchecked";
  return "indeterminate";
}

/** Reescribe los ancestros: quedan marcados solo si todos sus hijos activos lo están. */
function syncAncestors(nodes: readonly TreeNode[], selected: Set<string>): Set<string> {
  const next = new Set(selected);

  const visit = (node: TreeNode): void => {
    const children = (node.children ?? []).filter((child) => !child.disabled);
    if (children.length === 0) return;
    children.forEach(visit);
    if (children.every((child) => next.has(child.id))) next.add(node.id);
    else next.delete(node.id);
  };

  nodes.forEach(visit);
  return next;
}

function useControllableSet(
  controlled: string[] | undefined,
  defaultValue: string[] | undefined,
  onChange: ((ids: string[]) => void) | undefined
): [ReadonlySet<string>, (next: Set<string>) => void] {
  const [uncontrolled, setUncontrolled] = React.useState<string[]>(() => defaultValue ?? []);
  const value = controlled ?? uncontrolled;
  const asSet = React.useMemo(() => new Set(value), [value]);

  const commit = (next: Set<string>) => {
    if (controlled === undefined) setUncontrolled([...next]);
    onChange?.([...next]);
  };

  return [asSet, commit];
}

export function Tree({
  nodes,
  expandedIds,
  defaultExpandedIds,
  onExpandedChange,
  selectedIds,
  defaultSelectedIds,
  onSelectedChange,
  selectable = "none",
  size = "default",
  emptyLabel = "Sin elementos",
  className,
  ...props
}: TreeProps) {
  const [expanded, commitExpanded] = useControllableSet(expandedIds, defaultExpandedIds, onExpandedChange);
  const [selected, commitSelected] = useControllableSet(selectedIds, defaultSelectedIds, onSelectedChange);

  const labelBaseId = React.useId();
  const rows = React.useMemo(() => flatten(nodes, expanded), [nodes, expanded]);
  const focusableRows = rows.filter((row) => !row.node.disabled);
  const itemRefs = React.useRef(new Map<string, HTMLLIElement>());

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const currentId = activeId && focusableRows.some((row) => row.node.id === activeId) ? activeId : (focusableRows[0]?.node.id ?? null);

  const focusNode = (id: string | undefined) => {
    if (!id) return;
    setActiveId(id);
    itemRefs.current.get(id)?.focus();
  };

  const toggleExpanded = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    commitExpanded(next);
  };

  const toggleSelected = (node: TreeNode) => {
    if (selectable === "none" || node.disabled) return;

    if (selectable === "single") {
      commitSelected(selected.has(node.id) ? new Set() : new Set([node.id]));
      return;
    }

    const branch = collectEnabledIds(node);
    const next = new Set(selected);
    const shouldSelect = resolveCheckState(node, selected) !== "checked";
    branch.forEach((id) => (shouldSelect ? next.add(id) : next.delete(id)));
    commitSelected(syncAncestors(nodes, next));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    if (!currentId) return;
    const index = focusableRows.findIndex((row) => row.node.id === currentId);
    if (index === -1) return;

    const row = focusableRows[index];
    const hasChildren = Boolean(row.node.children?.length);
    const isExpanded = expanded.has(row.node.id);

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusNode(focusableRows[index + 1]?.node.id);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusNode(focusableRows[index - 1]?.node.id);
        break;
      case "ArrowRight":
        event.preventDefault();
        if (hasChildren && !isExpanded) toggleExpanded(row.node.id);
        else if (hasChildren) focusNode(focusableRows[index + 1]?.node.id);
        break;
      case "ArrowLeft":
        event.preventDefault();
        if (hasChildren && isExpanded) toggleExpanded(row.node.id);
        else focusNode(focusableRows.find((candidate) => candidate.node.id === row.parentId)?.node.id);
        break;
      case "Home":
        event.preventDefault();
        focusNode(focusableRows[0]?.node.id);
        break;
      case "End":
        event.preventDefault();
        focusNode(focusableRows[focusableRows.length - 1]?.node.id);
        break;
      case " ":
      case "Enter":
        event.preventDefault();
        if (selectable === "none") {
          if (hasChildren) toggleExpanded(row.node.id);
        } else {
          toggleSelected(row.node);
        }
        break;
      default:
        break;
    }
  };

  if (nodes.length === 0) {
    return <p className="px-2 py-6 text-center text-sm text-text-muted">{emptyLabel}</p>;
  }

  const renderLevel = (levelNodes: readonly TreeNode[], level: number) =>
    levelNodes.map((node) => {
      const hasChildren = Boolean(node.children?.length);
      const isExpanded = hasChildren && expanded.has(node.id);
      const checkState = selectable === "multiple" ? resolveCheckState(node, selected) : undefined;
      const isSelected = selectable === "multiple" ? checkState === "checked" : selected.has(node.id);
      const sizing = SIZE_CLASSES[size];

      return (
        <li
          key={node.id}
          ref={(element) => {
            if (element) itemRefs.current.set(node.id, element);
            else itemRefs.current.delete(node.id);
          }}
          role="treeitem"
          // Sin `aria-labelledby` el nombre del nodo incluiría el de toda su
          // descendencia: el <li> también envuelve al grupo de hijos.
          aria-labelledby={`${labelBaseId}-${node.id}`}
          aria-level={level}
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-selected={selectable === "none" ? undefined : isSelected}
          aria-disabled={node.disabled || undefined}
          tabIndex={node.disabled ? -1 : node.id === currentId ? 0 : -1}
          onFocus={(event) => {
            if (event.target === event.currentTarget) setActiveId(node.id);
          }}
          className={cn(
            // El anillo de foco se dibuja sobre la fila, no sobre el <li>, que
            // también envuelve a los hijos cuando el nodo está abierto.
            "rounded-lg outline-none [&:focus-visible>[data-tree-row]]:ring-2 [&:focus-visible>[data-tree-row]]:ring-ring/50",
            node.disabled && "opacity-50"
          )}
        >
          <div
            data-tree-row
            onClick={() => {
              if (node.disabled) return;
              setActiveId(node.id);
              itemRefs.current.get(node.id)?.focus();
              if (selectable === "none") {
                if (hasChildren) toggleExpanded(node.id);
              } else {
                toggleSelected(node);
              }
            }}
            className={cn(
              "flex items-center rounded-lg px-2 transition-colors duration-fast ease-standard motion-reduce:transition-none",
              sizing.row,
              node.disabled ? "cursor-not-allowed" : "cursor-pointer hover:bg-surface-subtle",
              isSelected && selectable !== "none" && "bg-primary/10 text-text-primary"
            )}
          >
            {hasChildren ? (
              <button
                type="button"
                tabIndex={-1}
                aria-hidden
                className={cn(
                  "-ml-1 flex shrink-0 items-center justify-center rounded-md p-0.5 text-text-muted transition-transform duration-fast ease-out-expo motion-reduce:transition-none",
                  isExpanded && "rotate-90"
                )}
                onClick={(event) => {
                  event.stopPropagation();
                  if (!node.disabled) toggleExpanded(node.id);
                }}
              >
                <ThemaIcon name="chevronRight" size="sm" className={sizing.chevron} />
              </button>
            ) : (
              <span aria-hidden className={cn("-ml-1 shrink-0 p-0.5", sizing.chevron)} />
            )}

            {selectable === "multiple" && (
              <Checkbox
                tabIndex={-1}
                disabled={node.disabled}
                checked={checkState === "indeterminate" ? "indeterminate" : checkState === "checked"}
                aria-label={node.label}
                onClick={(event) => event.stopPropagation()}
                onCheckedChange={() => toggleSelected(node)}
              />
            )}

            {node.icon && <span className={cn("flex shrink-0 items-center text-text-muted [&>svg]:size-4", sizing.icon)}>{node.icon}</span>}

            <span
              id={`${labelBaseId}-${node.id}`}
              className={cn("min-w-0 flex-1 truncate", isSelected && selectable !== "none" ? "font-medium text-text-primary" : "text-text-secondary")}
            >
              {node.label}
            </span>

            {typeof node.count === "number" && (
              <Badge variant="neutral" className="shrink-0 tabular-nums">
                {node.count}
              </Badge>
            )}
          </div>

          {isExpanded && (
            <ul role="group" className="ml-3 border-l border-border/60 pl-2">
              {renderLevel(node.children ?? [], level + 1)}
            </ul>
          )}
        </li>
      );
    });

  return (
    <ul
      role="tree"
      aria-multiselectable={selectable === "multiple" || undefined}
      onKeyDown={handleKeyDown}
      className={cn("flex flex-col", className)}
      {...props}
    >
      {renderLevel(nodes, 1)}
    </ul>
  );
}
