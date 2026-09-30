import * as React from "react";
import { HelpCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SHELL_MENU_PANEL } from "./shellPanel";

/** Una puerta del menú de ayuda: preguntar, ir al centro de ayuda, que te guíen… */
export interface ShellHelpAction {
  id: string;
  label: string;
  /** Una línea que dice qué pasa al elegirla. */
  description?: string;
  icon: LucideIcon;
  /** Destaca la opción con el gradiente de IA (la que abre el asistente). */
  tone?: "default" | "ai";
  onSelect: () => void;
}

export interface HelpMenuProps {
  actions: readonly ShellHelpAction[];
  /** Título del menú y nombre accesible del botón. */
  label: string;
  className?: string;
}

/**
 * El botón «Ayuda» de la cabecera cuando la app le da varias puertas.
 *
 * La ayuda no es una sola cosa: a veces se quiere preguntar algo concreto, a
 * veces leer con calma y a veces que alguien te lleve de la mano. En vez de
 * decidir por la persona, el botón abre un menú corto con esas tres salidas; la
 * app decide qué hace cada una.
 */
export function HelpMenu({ actions, label, className }: HelpMenuProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-surface text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            open && "bg-surface-muted text-text-primary",
            className
          )}
          title={label}
          aria-label={label}
          data-testid="shell-help"
        >
          <HelpCircle className="h-4 w-4" strokeWidth={2} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className={cn(SHELL_MENU_PANEL, "w-[300px]")}>
        <DropdownMenuLabel className="px-2 pb-1 pt-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
          {label}
        </DropdownMenuLabel>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem
              key={action.id}
              onSelect={action.onSelect}
              className="items-start gap-3 rounded-xl px-2 py-2.5"
              data-testid={`shell-help-${action.id}`}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                  action.tone === "ai" ? "bg-ai-gradient text-text-inverse" : "border border-border/70 bg-surface text-text-secondary"
                )}
              >
                <Icon className="size-4" strokeWidth={2} />
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-medium text-text-primary">{action.label}</span>
                {action.description && <span className="text-xs leading-snug text-text-muted">{action.description}</span>}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
