import * as React from "react";
import { motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  MessageSquare,
  PanelLeftClose,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";
import { cascadeContainer, cascadeItem } from "@/lib/cascadeAnimation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AI_GRADIENT, type NavChild, type NavEntry, type NavRoot } from "./appShellData";
import { useShellConfig } from "./shellConfig";
import { SidebarIconRail } from "./SidebarIconRail";
import { BrandSlot } from "./BrandSlot";
import { WorkspaceMenu } from "./WorkspaceMenu";
import { NewsMenu } from "./NewsMenu";
import type { ShellMode } from "./shellTypes";

interface DrillLevel {
  /** La sección de la que se entró, p. ej. "Aprendizaje". */
  parentLabel: string;
  /** Su icono, para encabezar la tarjeta del nivel. */
  parentIcon: NavRoot["icon"];
  /** Hermanos del nivel: se salta entre ellos sin volver atrás. */
  siblings: readonly NavChild[];
  current: NavChild;
}

/**
 * Whether the active node lives anywhere under this root item — itself, a
 * direct child, or a grandchild leaf. Collapsed, an accordion's children are
 * hidden, so this is what lets its own icon stand in for "you are somewhere
 * inside here" (e.g. the Desempeño icon lighting up while on Encuestas).
 */
function accordionHoldsCurrentNode(item: NavRoot, currentNodeId: string): boolean {
  if (item.id === currentNodeId) return true;
  return (item.children ?? []).some(
    (child) =>
      child.id === currentNodeId ||
      (child.children ?? []).some((leaf) => leaf.id === currentNodeId)
  );
}

interface AppSidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  mode: ShellMode;
  onModeChange: (mode: ShellMode) => void;
  /** Fired when the user lands on "Encuestas" in the nav — returns the app home. */
  onNavigateHome?: () => void;
  /** Closes the mobile drawer after any selection. */
  onCloseMobile?: () => void;
  onToggleCollapse: () => void;
  onOpenFeedback: () => void;
}

/** Raíces que contienen (directa o indirectamente) el nodo `id`, para abrirlas. */
function rootsHolding(navigation: readonly NavEntry[], id: string | undefined): string[] {
  if (!id) return [];
  return navigation.flatMap((entry) => (entry.kind === "item" && accordionHoldsCurrentNode(entry, id) ? [entry.id] : []));
}

/** `path` del nodo `id` en cualquier nivel del árbol. */
function findNodePath(navigation: readonly NavEntry[], id: string): string | undefined {
  for (const entry of navigation) {
    if (entry.kind !== "item") continue;
    if (entry.id === id) return entry.path;
    for (const child of entry.children ?? []) {
      if (child.id === id) return child.path;
      for (const leaf of child.children ?? []) if (leaf.id === id) return leaf.path;
    }
  }
  return undefined;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  collapsed,
  mobileOpen,
  mode,
  onModeChange,
  onNavigateHome,
  onCloseMobile,
  onToggleCollapse,
  onOpenFeedback,
}) => {
  const {
    navigation,
    activeNavId,
    onNavigate,
    brand,
    chatHistory,
    news,
    promo,
    chrome,
    settings,
    settingsAll,
    workspaceMenuExtra,
  } = useShellConfig();
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>(() => {
    const opened = rootsHolding(navigation, activeNavId);
    return opened.length > 0 ? Object.fromEntries(opened.map((id) => [id, true])) : { desempeno: true };
  });
  // Sin `activeNavId` el sidebar recuerda por sí mismo dónde está; con él,
  // el router manda y el sidebar solo refleja.
  const [localNodeId, setLocalNodeId] = React.useState(activeNavId ?? "objetivos");
  const currentNodeId = activeNavId ?? localNodeId;

  React.useEffect(() => {
    if (!activeNavId) return;
    const opened = rootsHolding(navigation, activeNavId);
    if (opened.length === 0) return;
    setOpenSections((sections) => ({ ...sections, ...Object.fromEntries(opened.map((id) => [id, true])) }));
  }, [activeNavId, navigation]);
  const [drillStack, setDrillStack] = React.useState<readonly DrillLevel[]>([]);
  const [drillDirection, setDrillDirection] = React.useState<"forward" | "back">("forward");
  const t = useT();
  const [adDismissed, setAdDismissed] = React.useState(false);
  const [activeChatIndex, setActiveChatIndex] = React.useState(0);

  // Collapsing wipes the drill: the collapsed rail always shows the root icons.
  React.useEffect(() => {
    if (collapsed) setDrillStack([]);
  }, [collapsed]);

  const selectNode = (id: string) => {
    setLocalNodeId(id);
    onCloseMobile?.();
    onNavigate?.(id, findNodePath(navigation, id));
    if (id === "objetivos") onNavigateHome?.();
  };

  /** Click en un icono del rail sin hijos: navega y ya. Las secciones con
   *  hijos las resuelve el propio rail con su desplegable. */
  const selectRootFromRail = (item: NavRoot) => selectNode(item.id);

  const pushDrill = (item: NavChild, parent: NavRoot) => {
    if (!item.children) return;
    setDrillDirection("forward");
    setDrillStack((stack) => [
      ...stack,
      { parentLabel: parent.label, parentIcon: parent.icon, siblings: parent.children ?? [], current: item },
    ]);
  };

  /** Cambia de hermano sin salir del nivel (el selector de la tarjeta). */
  const switchDrillSibling = (sibling: NavChild) => {
    if (!sibling.children?.length) {
      selectNode(sibling.id);
      return;
    }
    setDrillStack((stack) => [...stack.slice(0, -1), { ...stack[stack.length - 1], current: sibling }]);
  };

  const popDrill = () => {
    setDrillDirection("back");
    setDrillStack((stack) => stack.slice(0, -1));
  };

  const renderRootLeaf = (item: NavRoot) => {
    const isCurrent = currentNodeId === item.id;
    const row = (
      <button
        key={item.id}
        onClick={() => selectNode(item.id)}
        aria-current={isCurrent ? "page" : undefined}
        className={cn(
          "relative flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-background hover:text-text-primary",
          item.id === "inicio" && "font-semibold",
          isCurrent && "bg-surface-muted font-semibold text-primary hover:bg-surface-muted hover:text-primary"
        )}
      >
        <item.icon className={cn("h-4 w-4 shrink-0", isCurrent ? "text-primary" : "text-text-muted")} strokeWidth={2} />
        <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
        {item.badge && (
          <span
            className={cn(
              "flex h-4 shrink-0 items-center rounded-full px-2 text-[10px] font-extrabold tracking-wide",
              isCurrent ? "bg-primary text-primary-foreground" : "bg-surface-muted text-primary"
            )}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
    return row;
  };

  const renderChildRow = (child: NavChild, parent: NavRoot) => {
    const hasChildren = !!child.children;
    const isCurrent = currentNodeId === child.id;
    return (
      <motion.button
        key={child.id}
        variants={cascadeItem}
        onClick={() => (hasChildren ? pushDrill(child, parent) : selectNode(child.id))}
        className={cn(
          // Un escalón por debajo en tamaño, pero a plena legibilidad: son los
          // destinos reales, y en gris de cuerpo competían con su propia
          // categoría en vez de colgar de ella.
          "relative flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] font-medium text-text-primary transition-colors hover:bg-background",
          isCurrent && "font-semibold text-primary hover:text-primary"
        )}
      >
        {isCurrent && <span className="absolute -left-[9px] bottom-0.5 top-0.5 w-0.5 rounded-full bg-primary" />}
        <span className="min-w-0 flex-1 truncate text-left">{child.label}</span>
        {hasChildren && <ChevronRight className="h-3 w-3 shrink-0 text-border-strong" strokeWidth={2.5} />}
      </motion.button>
    );
  };

  const renderAccordion = (item: NavRoot) => {
    const isOpen = !!openSections[item.id];
    // La barra del hijo activo ya dice dónde estás, así que la cabecera no lo
    // repite; en el rail sí, porque ahí los hijos no se ven.
    const head = (
      <button
        onClick={() => setOpenSections((sections) => ({ ...sections, [item.id]: !isOpen }))}
        aria-expanded={isOpen}
        className={cn(
          // Abierta, la categoría es el rótulo del grupo que tiene debajo: pesa
          // por peso tipográfico, no por color de marca (que es del ítem activo).
          "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-background hover:text-text-primary",
          isOpen && "font-semibold text-text-primary"
        )}
      >
        <item.icon
          className={cn("h-4 w-4 shrink-0", isOpen ? "text-text-secondary" : "text-text-muted")}
          strokeWidth={2}
        />
        <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
        {item.badge && (
          <span className="flex h-4 shrink-0 items-center rounded-full bg-surface-muted px-2 text-[10px] font-extrabold tracking-wide text-primary">
            {item.badge}
          </span>
        )}
        <ChevronDown
          className={cn("h-3 w-3 shrink-0 text-text-muted transition-transform duration-200", isOpen && "rotate-180")}
          strokeWidth={2.5}
        />
      </button>
    );

    return (
      <div key={item.id}>
        {head}
        <div
            className={cn(
              "grid transition-[grid-template-rows,margin-top,margin-bottom] duration-200 ease-out",
              // Abierto, el grupo se separa del siguiente ítem: el aire de
              // abajo es lo que lo cierra como bloque.
              isOpen ? "mb-2 mt-1 grid-rows-[1fr]" : "grid-rows-[0fr]"
            )}
          >
            <div className="min-h-0 overflow-hidden">
              {/* Rows stay mounted across open/close (the grid-rows above does
                  the height animation), so the cascade re-triggers off isOpen
                  rather than mount — otherwise it would only ever play once. */}
              <motion.div
                initial="hidden"
                animate={isOpen ? "show" : "hidden"}
                variants={cascadeContainer}
                className="ml-4 flex flex-col gap-1 border-l border-border-strong/50 pl-2"
              >
                {item.children!.map((child) => renderChildRow(child, item))}
              </motion.div>
            </div>
        </div>
      </div>
    );
  };

  const drillLevel = drillStack[drillStack.length - 1];

  return (
    /*
     * Dos capas, no un panel que se encoge.
     *
     * Este div exterior es solo el hueco: es lo único que cambia de ancho, y
     * de él depende cuánto se corre el contenido de al lado. Dentro, el rail
     * (64px) y el panel (240px) tienen ancho fijo y no se enteran: el panel
     * se desliza hacia la izquierda hasta dejar ver el rail, que está encima
     * y se desvanece cuando el panel vuelve. Antes era un solo elemento
     * animando su ancho, así que en cada transición los iconos viajaban y
     * las etiquetas se estrujaban contra el borde.
     */
    <div
      className={cn(
        "relative h-full shrink-0 transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
        collapsed ? "w-16" : "w-60",
        /* Recorta el panel a este hueco: al estar recogido su borde asomaba
           en los 8px de aire que el shell deja a la izquierda del rail. En
           móvil el panel es `fixed` y se sale a propósito, así que ahí no. */
        "overflow-hidden max-lg:overflow-visible",
        // En móvil el panel es un cajón flotante, así que no reserva hueco.
        "max-lg:w-0"
      )}
    >
      {/* Rail de iconos: siempre montado y siempre en el mismo sitio. */}
      <div
        className={cn(
          "absolute inset-y-0 left-0 z-20 w-16 transition-opacity duration-200 max-lg:hidden",
          collapsed ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!collapsed}
      >
        <SidebarIconRail
          navigation={navigation}
          currentNodeId={currentNodeId}
          holdsCurrent={accordionHoldsCurrentNode}
          onSelectRoot={selectRootFromRail}
          onSelectNode={selectNode}
          mode={mode}
          onModeChange={onModeChange}
          onExpand={onToggleCollapse}
          onOpenFeedback={onOpenFeedback}
          brandMark={<BrandSlot variant="icon" logo={brand.logo} name={brand.productName} />}
          brandLabel={brand.productName}
        />
      </div>

      <aside
        className={cn(
        "absolute inset-y-0 left-0 z-10 flex w-60 flex-col border-r border-border/60 bg-surface p-3 pt-4",
        "transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
        /* Se va entero. Si solo se metía detrás del rail, su esquina cuadrada
           asomaba por el redondeo de 16px del rail y se veía sucio. */
        collapsed && "-translate-x-full",
        // Mobile: the sidebar floats as a drawer above the content.
        "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50 max-lg:w-60 max-lg:shadow-drawer",
        mobileOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"
      )}
    >
      {/* ---------- Collapse toggle ----------
          Contrae el panel y deja el rail a la vista. Debajo de lg el panel es
          un cajón que se sale de la pantalla, así que ahí el botón del header
          es el que manda. */}
      <div className="mb-2 flex justify-end max-lg:hidden">
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={t("shell.collapseMenu")}
              aria-expanded
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors",
                "hover:bg-background hover:text-text-primary",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              )}
            >
              <PanelLeftClose className="h-4 w-4" strokeWidth={2} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Contraer menú</TooltipContent>
        </Tooltip>
      </div>

      {/* ---------- Marca del producto ----------
          En qué sucursal estás lo dice la cabecera; aquí cuelga lo que se
          ajusta una vez —tema, idioma, cuenta, equipo, ventas— en vez de
          repartirlo entre un engranaje aparte y un selector suelto. Sin
          ajustes que ofrecer (la documentación), sigue siendo solo
          identidad, sin abrir nada. */}
      {(() => {
        const brandRow = (
          <BrandSlot logo={brand.logo} name={brand.productName} tagline={brand.tagline} display={brand.display ?? "wordmark"} className="flex-1" />
        );
        if (!chrome.settings || settings.length === 0) {
          return <div className="mb-4 shrink-0 px-3 py-2">{brandRow}</div>;
        }
        return (
          <WorkspaceMenu
            trigger={
              <button
                type="button"
                data-testid="workspace-menu-trigger"
                className="mb-4 flex w-full items-center gap-2 rounded-xl border border-border/60 bg-surface px-3 py-2 transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {brandRow}
                <ChevronsUpDown className="size-3.5 shrink-0 text-text-muted" strokeWidth={2} />
              </button>
            }
            productName={brand.productName}
            tagline={brand.tagline}
            groups={settings}
            all={settingsAll}
            onNavigate={onNavigate}
            extra={workspaceMenuExtra}
          />
        );
      })()}

      {/* ---------- Workspace / Agente IA segmented ---------- */}
      {chrome.modeSwitch && (
        <div className="relative mb-4 flex shrink-0 rounded-md bg-background p-1">
            <span
              className="absolute bottom-1 left-1 top-1 z-0 w-[calc(50%-4px)] rounded-lg bg-surface shadow-card transition-transform duration-300 ease-[cubic-bezier(.34,1.4,.5,1)]"
              style={{ transform: mode === "agent" ? "translateX(100%)" : "translateX(0)" }}
            />
            <span
              className="pointer-events-none absolute bottom-1 left-1 top-1 z-0 w-[calc(50%-4px)] rounded-lg transition-[transform,opacity] duration-300 ease-[cubic-bezier(.34,1.4,.5,1)]"
              style={{
                background: AI_GRADIENT,
                opacity: mode === "agent" ? 1 : 0,
                transform: mode === "agent" ? "translateX(100%)" : "translateX(0)",
              }}
            />
            <button
              onClick={() => onModeChange("workspace")}
              className={cn(
                "relative z-10 flex-1 rounded-lg py-1.5 text-[13px] font-medium text-text-muted transition-colors active:scale-95",
                mode === "workspace" && "font-semibold text-text-primary"
              )}
            >
              Workspace
            </button>
            <button
              onClick={() => onModeChange("agent")}
              className={cn(
                "relative z-10 flex-1 rounded-lg py-1.5 text-[13px] font-medium text-text-muted transition-colors active:scale-95",
                mode === "agent" && "font-semibold text-white"
              )}
            >
              Agente IA
            </button>
        </div>
      )}

      {/* ---------- Nav viewport ---------- */}
      <div className="relative min-h-[132px] flex-1 overflow-hidden">
        {mode === "agent" ? (
          <nav className="flex h-full flex-col gap-1 overflow-y-auto pr-1 animate-in fade-in duration-200">
            <button
              onClick={() => setActiveChatIndex(-1)}
              className="mb-2 flex w-full shrink-0 items-center justify-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-bold text-text-primary transition-colors hover:border-primary hover:bg-surface-muted hover:text-primary"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              Nuevo chat
            </button>
            {chatHistory.map((group, groupIndex) => (
              <React.Fragment key={group.label}>
                <div className="shrink-0 px-2 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  {group.label}
                </div>
                {group.items.map((chat, itemIndex) => {
                  const flatIndex = groupIndex * 100 + itemIndex;
                  return (
                    <button
                      key={chat}
                      onClick={() => setActiveChatIndex(flatIndex)}
                      className={cn(
                        "shrink-0 truncate rounded-lg px-2 py-2 text-left text-[13px] font-medium text-text-secondary transition-colors hover:bg-background hover:text-text-primary",
                        activeChatIndex === flatIndex && "bg-surface-muted font-semibold text-primary hover:bg-surface-muted hover:text-primary"
                      )}
                    >
                      {chat}
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </nav>
        ) : drillLevel ? (
          <nav
            key={`drill-${drillStack.length}-${drillLevel.current.id}`}
            className={cn(
              "flex h-full flex-col gap-1 overflow-y-auto pr-1 duration-200 animate-in fade-in",
              drillDirection === "forward" ? "slide-in-from-right-2" : "slide-in-from-left-2"
            )}
          >
            {/* Volver a la sección de la que se entró. */}
            <button
              onClick={popDrill}
              className="mb-1 flex shrink-0 items-center gap-1.5 rounded-lg px-1.5 py-1 text-left text-[13px] font-medium text-text-muted transition-colors hover:bg-background hover:text-text-primary"
            >
              <ChevronLeft className="size-3.5 shrink-0" strokeWidth={2.5} />
              <span className="truncate">{drillLevel.parentLabel}</span>
            </button>

            {/* Dónde estás, y el salto a un hermano sin volver atrás. */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  data-testid="drill-switcher"
                  aria-label={`Sección ${drillLevel.current.label}. Cambiar`}
                  className="mb-2 flex w-full shrink-0 items-center gap-2.5 rounded-xl border border-border/60 bg-surface px-2.5 py-2 text-left transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <drillLevel.parentIcon className="size-[18px]" strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-text-primary">{drillLevel.current.label}</span>
                    {drillLevel.current.description && (
                      <span className="block truncate text-[11px] text-text-muted">{drillLevel.current.description}</span>
                    )}
                  </span>
                  <ChevronsUpDown className="size-3.5 shrink-0 text-text-muted" strokeWidth={2} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={6} className="w-[216px]">
                <DropdownMenuLabel>{drillLevel.parentLabel}</DropdownMenuLabel>
                {drillLevel.siblings.map((sibling) => (
                  <DropdownMenuItem key={sibling.id} onSelect={() => switchDrillSibling(sibling)}>
                    <span className="flex-1 truncate">{sibling.label}</span>
                    {sibling.id === drillLevel.current.id && <Check className="size-4 shrink-0 text-primary" strokeWidth={2.5} />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {(drillLevel.current.children ?? []).map((leaf) => (
              <button
                key={leaf.id}
                onClick={() => selectNode(leaf.id)}
                className={cn(
                  "relative flex w-full shrink-0 items-center rounded-lg px-2 py-2 text-left text-sm font-medium text-text-secondary transition-colors hover:bg-background hover:text-text-primary",
                  currentNodeId === leaf.id && "bg-surface-muted font-semibold text-primary hover:bg-surface-muted hover:text-primary"
                )}
              >
                <span className="min-w-0 flex-1 truncate">{leaf.label}</span>
              </button>
            ))}
          </nav>
        ) : (
          <nav
            key="root"
            className={cn(
              "flex h-full flex-col gap-1 overflow-y-auto pr-1 duration-200 animate-in fade-in",
              drillDirection === "back" && "slide-in-from-left-2"
            )}
          >
            {navigation.map((entry, index) => {
              if (entry.kind === "group") {
                return (
                  <div key={`group-${index}`} className="shrink-0 truncate px-2 pb-0.5 pt-3 text-xs font-medium text-text-muted">
                    {entry.label}
                  </div>
                );
              }
              return entry.children ? renderAccordion(entry) : renderRootLeaf(entry);
            })}
          </nav>
        )}
      </div>

      {/* ---------- Tarjeta destacada ---------- */}
      {!adDismissed && promo && mode === "workspace" && (
        <div className="relative mt-2 shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-surface">
          {/* Cabecera ilustrada: el grupo de avatares cuenta de qué va la
              invitación antes de leer una sola palabra. */}
          <div className="relative flex h-20 items-center justify-center bg-primary/[0.06]">
            <span aria-hidden className="absolute size-[72px] rounded-full border border-dashed border-primary/25" />
            <span aria-hidden className="absolute size-[100px] rounded-full border border-dashed border-primary/15" />
            {/* La esquina de cerrar es suya: el avatar que estaba debajo dejaba
                la aspa sobre un fondo cambiante y no se leía. Aquí va sobre
                superficie sólida, con filo propio y sin nada detrás. */}
            <button
              onClick={() => setAdDismissed(true)}
              className={cn(
                "absolute right-1.5 top-1.5 z-20 flex size-6 items-center justify-center rounded-full bg-surface text-text-secondary ring-1 ring-border/70 transition-colors",
                "hover:bg-surface-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              )}
              aria-label="Cerrar"
            >
              <X className="size-3.5" strokeWidth={2.5} />
            </button>
            <span className="absolute left-3 top-4 flex size-7 items-center justify-center rounded-full bg-surface text-[10px] font-bold text-primary shadow-card">
              LM
            </span>
            <span className="absolute right-3 top-8 flex size-7 items-center justify-center rounded-full bg-status-positive/15 text-[10px] font-bold text-status-positive shadow-card">
              JR
            </span>
            <span className="relative flex size-11 items-center justify-center rounded-full text-sm font-bold text-white shadow-card" style={{ background: AI_GRADIENT }}>
              <Sparkles className="size-5" strokeWidth={2} />
            </span>
            <span className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold text-status-positive shadow-card">
              <Check className="size-3" strokeWidth={3} />
              Aprobado
            </span>
          </div>
          <div className="p-3">
            <h4 className="text-[13px] font-bold leading-tight text-text-primary">{promo.title}</h4>
            <p className="mt-1 text-[11.5px] font-medium leading-snug text-text-secondary">{promo.description}</p>
            <button
              onClick={promo.onClick}
              className="mt-3 w-full rounded-lg border border-border/60 bg-surface py-2 text-xs font-bold text-text-primary transition-colors hover:border-primary/40 hover:bg-background hover:text-primary"
            >
              {promo.cta}
            </button>
          </div>
        </div>
      )}

      {/* ---------- Footer: novedades y feedback ----------
          «Novedades» solo aparece aquí por debajo de `md`, que es donde la
          cabecera la suelta para dejarle su ancho al chip de la cuenta. Por
          encima sigue colgando de la cabecera y esta fila no existe. */}
      <div className="mt-2 shrink-0 border-t border-border/60 pt-2">
        {chrome.news && <NewsMenu items={news} variant="row" side="top" align="start" className="md:hidden" />}
        <button
          onClick={onOpenFeedback}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-background hover:text-text-secondary"
          )}
        >
          <MessageSquare className="h-4 w-4 shrink-0" strokeWidth={2} />
          <span className="flex-1 text-left">{t("shell.feedback")}</span>
          <ChevronRight className="size-3.5 shrink-0 text-text-muted" strokeWidth={2.5} />
        </button>
      </div>
      </aside>
    </div>
  );
};
