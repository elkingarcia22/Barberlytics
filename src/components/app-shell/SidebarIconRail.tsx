import * as React from "react";
import { LayoutGrid, MessageSquare, PanelLeftOpen, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AI_GRADIENT, type NavEntry, type NavRoot } from "./appShellData";
import type { ShellMode } from "./shellTypes";

/**
 * El rail de iconos: la capa que siempre está.
 *
 * No es "el sidebar encogido": es un elemento propio, de ancho fijo, que no
 * se mueve ni reflowa nunca. El panel ancho se desliza por encima cuando se
 * expande y el rail se desvanece debajo. Así los iconos se quedan quietos en
 * el mismo píxel en los dos estados, que es justo lo que se rompía cuando un
 * solo elemento animaba su ancho de 240 a 64: cada icono viajaba y las
 * etiquetas se estrujaban durante la transición.
 */

export interface SidebarIconRailProps {
  navigation: readonly NavEntry[];
  /** Nodo activo, en cualquier nivel del árbol. */
  currentNodeId: string;
  /** El icono de una raíz se enciende también si el activo cuelga de ella. */
  holdsCurrent: (item: NavRoot, currentNodeId: string) => boolean;
  /** Raíz sin hijos: navega directo. */
  onSelectRoot: (item: NavRoot) => void;
  /** Cualquier nodo elegido desde el desplegable de una sección. */
  onSelectNode: (id: string) => void;
  mode: ShellMode;
  onModeChange: (mode: ShellMode) => void;
  onExpand: () => void;
  onOpenFeedback: () => void;
  /** Marca de la empresa; la pinta el sidebar para no duplicar su lógica. */
  brandMark: React.ReactNode;
  brandLabel: string;
  className?: string;
}

/** Botón de icono del rail, con su etiqueta como tooltip a la derecha. */
const railButtonClass = (active?: boolean) =>
  cn(
    "relative flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
    active ? "bg-surface-muted text-primary" : "text-text-muted hover:bg-background hover:text-text-primary"
  );

function RailButton({
  label,
  active,
  onClick,
  children,
  badge,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  badge?: boolean;
}) {
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <button type="button" onClick={onClick} aria-label={label} aria-current={active ? "page" : undefined} className={railButtonClass(active)}>
          {children}
          {badge && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary" />}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Una sección con hijos no cabe en 64px, así que su icono abre el árbol a la
 * derecha: los hijos como ítems y los que a su vez tienen hijos como submenú.
 * Sin esto, plegado, esas secciones eran un callejón sin salida.
 */
function RailSectionMenu({
  item,
  active,
  onSelectNode,
}: {
  item: NavRoot;
  active: boolean;
  onSelectNode: (id: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={item.label} aria-current={active ? "page" : undefined} className={railButtonClass(active)}>
          <item.icon className="size-[18px]" strokeWidth={2} />
          {item.badge && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" sideOffset={10} className="w-56">
        <DropdownMenuLabel>{item.label}</DropdownMenuLabel>
        {(item.children ?? []).map((child) =>
          child.children?.length ? (
            <DropdownMenuSub key={child.id}>
              <DropdownMenuSubTrigger>{child.label}</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-52">
                <DropdownMenuLabel>{child.label}</DropdownMenuLabel>
                {child.children.map((leaf) => (
                  <DropdownMenuItem key={leaf.id} onSelect={() => onSelectNode(leaf.id)}>
                    {leaf.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ) : (
            <DropdownMenuItem key={child.id} onSelect={() => onSelectNode(child.id)}>
              {child.label}
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** El mismo separador corto y centrado que marca los grupos del panel. */
function RailDivider() {
  return <span aria-hidden className="my-1 w-8 shrink-0 border-t border-border/60" />;
}

export function SidebarIconRail({
  navigation,
  currentNodeId,
  holdsCurrent,
  onSelectRoot,
  onSelectNode,
  mode,
  onModeChange,
  onExpand,
  onOpenFeedback,
  brandMark,
  brandLabel,
  className,
}: SidebarIconRailProps) {
  return (
    <nav
      aria-label="Navegación compacta"
      className={cn(
        "flex h-full w-16 flex-col items-center gap-1 overflow-y-auto rounded-2xl border border-border/60 bg-surface px-2 py-4 shadow-card",
        className
      )}
    >
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onExpand}
            aria-label="Expandir menú"
            aria-expanded={false}
            className="mb-2 flex size-7 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-background hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <PanelLeftOpen className="size-4" strokeWidth={2} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Expandir menú</TooltipContent>
      </Tooltip>

      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <button type="button" aria-label={brandLabel} className="mb-2 flex size-8 shrink-0 items-center justify-center rounded-lg">
            {brandMark}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">{brandLabel}</TooltipContent>
      </Tooltip>

      {/* Workspace / Agente IA: el mismo conmutador del panel, apilado. */}
      <div className="mb-1 flex shrink-0 flex-col gap-0.5 rounded-lg border border-border/60 bg-background p-1">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onModeChange("workspace")}
              aria-label="Workspace"
              aria-pressed={mode === "workspace"}
              className={cn(
                "flex size-7 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                mode === "workspace" ? "bg-surface text-text-primary shadow-card" : "text-text-muted hover:text-text-primary"
              )}
            >
              <LayoutGrid className="size-3.5" strokeWidth={2} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Workspace</TooltipContent>
        </Tooltip>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onModeChange("agent")}
              aria-label="Agente IA"
              aria-pressed={mode === "agent"}
              className={cn(
                "flex size-7 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                mode === "agent" ? "text-white" : "text-text-muted hover:text-text-primary"
              )}
              style={mode === "agent" ? { background: AI_GRADIENT } : undefined}
            >
              <Sparkles className="size-3.5" strokeWidth={2} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Agente IA</TooltipContent>
        </Tooltip>
      </div>

      <RailDivider />

      {/* Los títulos de grupo no caben en 64px: se vuelven separadores. */}
      {navigation.map((entry, index) =>
        entry.kind === "group" ? (
          <RailDivider key={`group-${index}`} />
        ) : entry.children?.length ? (
          <RailSectionMenu
            key={entry.id}
            item={entry}
            active={holdsCurrent(entry, currentNodeId)}
            onSelectNode={onSelectNode}
          />
        ) : (
          <RailButton
            key={entry.id}
            label={entry.label}
            active={holdsCurrent(entry, currentNodeId)}
            badge={Boolean(entry.badge)}
            onClick={() => onSelectRoot(entry)}
          >
            <entry.icon className="size-[18px]" strokeWidth={2} />
          </RailButton>
        )
      )}

      <div className="mt-auto flex w-full flex-col items-center gap-1 pt-2">
        <RailDivider />
        <RailButton label="Feedback" onClick={onOpenFeedback}>
          <MessageSquare className="size-4" strokeWidth={2} />
        </RailButton>
      </div>
    </nav>
  );
}
