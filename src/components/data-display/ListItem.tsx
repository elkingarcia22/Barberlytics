import * as React from "react";
import { cn } from "@/lib/utils";

const ListItemGroupContext = React.createContext(false);

export type ListItemGroupProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * ListItemGroup
 *
 * Contenedor de filas: cada fila es su propia tarjeta (borde + radio),
 * separadas por espacio en vez de un divisor pegado — se leen como filas
 * independientes incluso en listas largas.
 *
 * El grupo no pone padding lateral: las tarjetas llegan hasta donde llegue su
 * contenedor. Quien quiera margen lo pone por fuera.
 */
export function ListItemGroup({ className, children, ...props }: ListItemGroupProps) {
  return (
    <ListItemGroupContext.Provider value={true}>
      <div role="list" className={cn("flex flex-col gap-2", className)} {...props}>
        {children}
      </div>
    </ListItemGroupContext.Provider>
  );
}

export interface ListItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title" | "onClick"> {
  /** Avatar, icono o IconTile a la izquierda. */
  leading?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Texto corto alineado a la derecha: una fecha, un contador. */
  meta?: React.ReactNode;
  /** Botones a la derecha. Quedan fuera del área clicable de la fila. */
  actions?: React.ReactNode;
  /** Convierte la fila en un enlace. */
  href?: string;
  /** Convierte la fila en un botón. Si hay `href`, gana el enlace. */
  onClick?: React.MouseEventHandler<HTMLElement>;
  selected?: boolean;
  size?: "sm" | "default";
}

const SIZE_CLASSES = {
  default: { row: "gap-3 py-3", padX: "px-4", title: "text-sm", description: "text-xs" },
  sm: { row: "gap-3 py-2", padX: "px-3", title: "text-[13px]", description: "text-xs" },
} as const;

/**
 * ListItem
 *
 * Fila de lista con `leading`, título, descripción, `meta` y acciones. Con `href`
 * u `onClick` la fila entera es clicable (enlace estirado) sin anidar controles:
 * las acciones quedan por encima del área del enlace.
 */
export function ListItem({
  leading,
  title,
  description,
  meta,
  actions,
  href,
  onClick,
  selected = false,
  size = "default",
  className,
  ...props
}: ListItemProps) {
  const isInGroup = React.useContext(ListItemGroupContext);
  const isInteractive = Boolean(href || onClick);
  const sizing = SIZE_CLASSES[size];

  const text = (
    <span className="flex min-w-0 flex-1 flex-col gap-1">
      <span className={cn("truncate font-medium leading-tight text-text-primary", sizing.title)}>{title}</span>
      {description && <span className={cn("truncate text-text-secondary", sizing.description)}>{description}</span>}
    </span>
  );

  const triggerClasses =
    "flex min-w-0 flex-1 items-center gap-3 text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-none";

  return (
    <div
      role={isInGroup ? "listitem" : undefined}
      data-slot="list-item"
      data-selected={selected || undefined}
      data-interactive={isInteractive || undefined}
      className={cn(
        "group/list-item relative flex items-center bg-surface transition-colors",
        sizing.row,
        sizing.padX,
        isInGroup && "rounded-xl border border-border/60",
        isInteractive && "hover:bg-surface-subtle hover:border-border has-[[data-slot=list-item-trigger]:focus-visible]:ring-2 has-[[data-slot=list-item-trigger]:focus-visible]:ring-inset has-[[data-slot=list-item-trigger]:focus-visible]:ring-ring/50",
        selected && "bg-primary/5 before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary",
        className
      )}
      {...props}
    >
      {href ? (
        <a href={href} data-slot="list-item-trigger" aria-current={selected ? "true" : undefined} onClick={onClick} className={triggerClasses}>
          {leading}
          {text}
        </a>
      ) : onClick ? (
        <button type="button" data-slot="list-item-trigger" aria-pressed={selected || undefined} onClick={onClick} className={triggerClasses}>
          {leading}
          {text}
        </button>
      ) : (
        <>
          {leading}
          {text}
        </>
      )}
      {meta && <span className="relative z-10 shrink-0 text-xs tabular-nums text-text-muted">{meta}</span>}
      {actions && <span className="relative z-10 flex shrink-0 items-center gap-1">{actions}</span>}
    </div>
  );
}
