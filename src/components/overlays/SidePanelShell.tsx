import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";
import { Button } from "@/components/ui/button";
import { useShellSidePanelHost } from "@/components/app-shell/shellAgentPanelSlot";
import { AGENT_PANEL_WIDTH, agentPanelTransition } from "@/components/ai/agentPanelMotion";
import { DrawerShell, type DrawerShellProps } from "./DrawerShell";

/**
 * SIDE PANEL SHELL
 *
 * Un panel de trabajo que se abre *al lado* del contenido en vez de encima:
 * entra por la derecha, empuja la página —que se estrecha— y la deja a la
 * vista y usable. No flota: es una columna más de la interfaz, pegada al
 * borde, debajo de la cabecera —que no se mueve— y separada de la página por
 * su propio tono de superficie, sin contorno. Es el mismo gesto del panel del Agente IA, para tareas que
 * se hacen mirando lo de atrás: el detalle de una cita con la agenda al lado,
 * un cobro, un bloqueo.
 *
 * Tiene la misma anatomía y las mismas props que `DrawerShell` —cabecera con
 * título y descripción, cuerpo con scroll, pie con acciones—, así que pasar
 * de uno a otro es cambiar el nombre. Y cae solo a `DrawerShell` cuando no
 * hay sitio para dos columnas (pantalla estrecha) o no hay shell alrededor.
 *
 * No es modal: no atrapa el foco ni pone velo. Solo debe haber uno abierto a
 * la vez; quien lo monta decide cuál.
 */

export type SidePanelShellProps = Pick<DrawerShellProps, "open" | "onOpenChange" | "title" | "description" | "leading" | "headerActions" | "children" | "footer" | "actions" | "size" | "className" | "showCloseButton" | "disablePadding">;

/** A partir de este ancho de ventana caben la página y el panel uno junto al otro. */
const SIDE_BY_SIDE_QUERY = "(min-width: 1024px)";
/** Algo más ancho que el del Agente IA: aquí van formularios. */
const PANEL_WIDTH = `max(${AGENT_PANEL_WIDTH}, min(460px, 42vw))`;

function subscribe(onChange: () => void) {
  if (typeof window.matchMedia !== "function") return () => undefined;
  const query = window.matchMedia(SIDE_BY_SIDE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
const fits = () => typeof window.matchMedia === "function" && window.matchMedia(SIDE_BY_SIDE_QUERY).matches;

export function SidePanelShell(props: SidePanelShellProps) {
  const { open = false, onOpenChange, title, description, leading, headerActions, children, footer, actions, className, showCloseButton = true, disablePadding = false } = props;
  const t = useT();
  const host = useShellSidePanelHost();
  const sideBySide = React.useSyncExternalStore(subscribe, fits, () => false);
  const panelRef = React.useRef<HTMLElement>(null);
  const inline = host !== null && sideBySide;

  // Escape cierra, como en un drawer, y al abrir el foco entra al panel.
  React.useEffect(() => {
    if (!inline || !open) return;
    panelRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      // Un menú o un select abierto dentro se cierra primero con su propio Escape.
      if (event.key === "Escape" && !event.defaultPrevented) onOpenChange?.(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [inline, open, onOpenChange]);

  if (!inline || !host) return <DrawerShell {...props} />;

  return createPortal(
    <div
      className="h-full shrink-0 overflow-hidden"
      data-side-panel-open={open || undefined}
      style={{ width: open ? PANEL_WIDTH : 0, transition: agentPanelTransition("width") }}
    >
      <div className="h-full" style={{ width: PANEL_WIDTH }}>
        {open && (
          <aside
            ref={panelRef}
            tabIndex={-1}
            role="complementary"
            aria-label={title}
            data-slot="side-panel"
            className={cn("flex h-full flex-col overflow-hidden bg-surface focus-visible:outline-none", className)}
            style={{ width: PANEL_WIDTH }}
          >
            {(title || description || showCloseButton) && (
              <header className={cn("flex shrink-0 gap-3 px-5 pb-2 pt-4", leading ? "items-center" : "items-start")}>
                {leading && <div className="shrink-0">{leading}</div>}
                <div className="min-w-0 flex-1">
                  {title && <h2 className="truncate font-heading text-base font-semibold text-text-primary">{title}</h2>}
                  {description && <p className="truncate text-sm text-text-secondary">{description}</p>}
                </div>
                {headerActions && <div className="flex shrink-0 items-center gap-1">{headerActions}</div>}
                {showCloseButton && (
                  <Button variant="ghost" size="icon-sm" aria-label={t("common.close")} onClick={() => onOpenChange?.(false)}>
                    <X />
                  </Button>
                )}
              </header>
            )}
            <div className={cn("flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable]", !disablePadding && "p-5")}>{children}</div>
            {footer ? footer : actions ? <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 px-5 py-4">{actions}</footer> : null}
          </aside>
        )}
      </div>
    </div>,
    host
  );
}
