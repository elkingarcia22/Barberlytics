import type * as React from "react";
import { Text } from "@/components/typography";
import { ThemaIcon, type IconName } from "@/icons";
import { cn } from "@/lib/utils";

export interface QuickAction {
  id: string;
  icon: IconName;
  label: string;
  /** Un dato corto al lado (el teléfono) o un número (las citas próximas). */
  hint?: string;
  count?: number;
  onClick?: () => void;
  /** Un enlace en vez de un botón (llamar). */
  href?: string;
}

const PILL =
  "inline-flex h-9 min-w-0 items-center gap-1.5 rounded-full border border-border px-3 text-sm outline-none transition-colors duration-fast hover:border-primary/50 hover:bg-surface-subtle focus-visible:ring-2 focus-visible:ring-ring/50";

function PillBody({ icon, label, hint, count }: Pick<QuickAction, "icon" | "label" | "hint" | "count">): React.ReactNode {
  return (
    <>
      <ThemaIcon name={icon} size="sm" tone="muted" />
      <Text as="span" size="sm" weight="medium" truncate>
        {label}
      </Text>
      {hint && (
        <Text as="span" size="xs" tone="muted" tabular truncate>
          {hint}
        </Text>
      )}
      {count ? (
        <span aria-hidden className="grid h-4 min-w-4 place-items-center rounded-full bg-primary/15 px-1 text-xs font-semibold leading-none text-primary tabular-nums">
          {count}
        </span>
      ) : null}
    </>
  );
}

/**
 * Lo que se puede hacer además de reservar (ver tus citas, llamar, paquetes, regalar): pastillas
 * pequeñas en una fila que baja de línea, para que no compitan con la cita.
 */
export function QuickActions({ actions, label, className }: { actions: readonly QuickAction[]; label: string; className?: string }) {
  return (
    <nav aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {actions.map((item) => {
        const aria = item.count ? `${item.label} · ${item.count}` : undefined;
        return item.href ? (
          <a key={item.id} href={item.href} className={PILL} aria-label={aria}>
            <PillBody {...item} />
          </a>
        ) : (
          <button key={item.id} type="button" className={PILL} onClick={item.onClick} aria-label={aria}>
            <PillBody {...item} />
          </button>
        );
      })}
    </nav>
  );
}
