import * as React from "react";

import { Heading, Text } from "@/components/typography";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";

/** Tono del distintivo de cada fila: colorea el chip del icono, nada más. */
export type ActivityTone = "default" | "primary" | "positive" | "warning" | "negative";

export interface ActivityItem {
  /** Clave estable de la fila. */
  id: string;
  /** Icono del chip. Sin él se usa el icono de campana del sistema. */
  icon?: React.ReactNode;
  tone?: ActivityTone;
  title: string;
  description?: string;
  /** Momento ya formateado ("Justo ahora", "Hace 2 min", "Ayer"). */
  time: string;
  /** Si viene, la fila se renderiza como botón y es navegable con el teclado. */
  onClick?: () => void;
}

export interface ActivityDropdownProps {
  items: ActivityItem[];
  /** Título de la cabecera. */
  title?: string;
  /** Frase de apoyo; solo se ve con la tarjeta cerrada. */
  description?: string;
  /** Estado inicial cuando el componente se gobierna solo. */
  defaultOpen?: boolean;
  /** Estado controlado desde fuera; con él manda quien lo pasa. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Texto cuando no hay actividad. */
  emptyLabel?: string;
  className?: string;
}

/** Retardo de la cascada: base de entrada + un paso por fila. */
const STAGGER_BASE_MS = 100;
const STAGGER_STEP_MS = 80;

const TONE_CHIP: Record<ActivityTone, string> = {
  default: "bg-muted text-text-secondary",
  primary: "bg-primary/10 text-primary",
  positive: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning",
  negative: "bg-destructive/10 text-destructive",
};

/** Clases compartidas por la fila, sea botón o no. */
const ROW_BASE =
  "flex w-full items-start gap-3 rounded-xl p-3 text-left transition-all duration-normal ease-standard motion-reduce:transition-none";

function ActivityRow({ item, index, isOpen }: { item: ActivityItem; index: number; isOpen: boolean }) {
  const tone = item.tone ?? "default";
  const isButton = typeof item.onClick === "function";

  const content = (
    <>
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-normal ease-standard motion-reduce:transition-none",
          TONE_CHIP[tone]
        )}
      >
        {item.icon ?? <ThemaIcon name="notification" size="sm" className="text-current" />}
      </span>
      <span className="min-w-0 flex-1">
        <Text as="span" size="sm" weight="semibold" className="block">
          {item.title}
        </Text>
        {item.description ? (
          <Text as="span" size="sm" tone="secondary" truncate className="block">
            {item.description}
          </Text>
        ) : null}
      </span>
      <Text as="span" size="xs" tone="muted" className="shrink-0 pt-0.5">
        {item.time}
      </Text>
    </>
  );

  const className = cn(
    ROW_BASE,
    isButton &&
      "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
    isOpen ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
  );

  /* El retardo solo existe al abrir: al cerrar, todas las filas se van a la vez. */
  const style = { transitionDelay: isOpen ? `${index * STAGGER_STEP_MS + STAGGER_BASE_MS}ms` : "0ms" };

  return (
    <li>
      {isButton ? (
        <button type="button" onClick={item.onClick} className={className} style={style}>
          {content}
        </button>
      ) : (
        <div className={className} style={style}>
          {content}
        </div>
      )}
    </li>
  );
}

/**
 * Tarjeta de actividad plegable: la cabecera resume y, al abrirla, las filas
 * entran escalonadas. Pensada para un panel lateral o una columna de resumen,
 * no para el menú de notificaciones de la cabecera.
 */
export function ActivityDropdown({
  items,
  title = "Actividad reciente",
  description,
  defaultOpen = false,
  open,
  onOpenChange,
  emptyLabel = "No hay actividad por ahora.",
  className,
}: ActivityDropdownProps) {
  const panelId = React.useId();
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolledOpen;

  const toggle = () => {
    const next = !isOpen;
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  return (
    <div
      className={cn(
        "w-full max-w-md overflow-hidden border border-border bg-card shadow-drawer",
        "transition-all duration-normal ease-standard motion-reduce:transition-none",
        isOpen ? "rounded-3xl" : "rounded-2xl",
        className
      )}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted text-text-secondary">
          <ThemaIcon name="notification" size="md" className="text-current" />
        </span>
        <span className="min-w-0 flex-1 overflow-hidden">
          <Heading level={6} as="h3">
            {title}
          </Heading>
          {description ? (
            <Text
              as="span"
              size="sm"
              tone="secondary"
              className={cn(
                "block transition-all duration-normal ease-standard motion-reduce:transition-none",
                isOpen ? "mt-0 max-h-0 opacity-0" : "mt-0.5 max-h-6 opacity-100"
              )}
            >
              {description}
            </Text>
          ) : null}
        </span>
        <span className="flex size-8 shrink-0 items-center justify-center text-text-muted">
          <ThemaIcon
            name="chevronUp"
            size="sm"
            decorative
            className={cn(
              "transition-transform duration-normal ease-standard motion-reduce:transition-none",
              isOpen ? "rotate-0" : "rotate-180"
            )}
          />
        </span>
      </button>

      <div
        id={panelId}
        inert={!isOpen}
        className={cn(
          "grid transition-all duration-normal ease-standard motion-reduce:transition-none",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="px-2 pb-4">
            {items.length === 0 ? (
              <Text size="sm" tone="muted" className="px-3 py-2">
                {emptyLabel}
              </Text>
            ) : (
              <ul className="space-y-1">
                {items.map((item, index) => (
                  <ActivityRow key={item.id} item={item} index={index} isOpen={isOpen} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
