import * as React from "react";
import { Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ActionRailShell,
  RailDivider,
  useContextChangeKey,
} from "./ActionRailShell";
import {
  AnimatedActionItem,
  RailButton,
  RailPrimaryAction,
} from "./RailButton";
import { RailOverflowMenu, type RailOverflowItem } from "./RailOverflowMenu";
import { RailSelectionChip } from "./RailSelectionChip";
import { ActionFab } from "./ActionFab";
import { useCompactViewport } from "./useCompactViewport";
import { usePublishSearchActions } from "@/components/search";
import { useAnnounceRail, useRailAgentAction } from "./railAgent";
import {
  railActionLabel,
  railActionsFor,
  railModeFor,
  railScreenTiers,
  toSearchActions,
  type RailActionScope,
  type RailActionSpec,
} from "./railActions";

export type { RailActionScope, RailActionSpec } from "./railActions";

export interface DataListActionRailProps {
  actions: readonly RailActionSpec[];
  selectedCount: number;
  onClearSelection: () => void;
  /** Concordancia del recuento: «3 seleccionadas» frente a «3 seleccionados». */
  gender?: "f" | "m";
  /** Cuántas acciones caben antes de plegarse al menú «más». */
  inlineLimit?: number;
  /**
   * Una decisión inmersiva se adueñó de una fila —editar una fecha ahí mismo—.
   * La barra se desmonta en vez de quedarse ofreciendo algo que no viene a
   * cuento: un clic perdido no debe caer sobre un control que ya no aplica.
   */
  locked?: boolean;
  /** Un panel modal tomó la pantalla: la barra se recoge y deja de responder. */
  isBlocked?: boolean;
}

/** Cinco caben sin apretar; la sexta ya pide plegarse. */
const DEFAULT_INLINE_LIMIT = 5;

/**
 * DataListActionRail
 *
 * La barra flotante de una pantalla con lista: concentra **todo** lo que se
 * puede hacer y cambia de contenido según lo que haya marcado.
 *
 * - **Sin selección** muestra las acciones de la pantalla y su acción primaria.
 * - **Con un registro** esas desaparecen —no se apilan— y entran el recuento y
 *   lo que se puede hacer con él, incluidas las que solo valen para uno.
 * - **Con varios** se caen las individuales y el recuento entra en la etiqueta
 *   de las que quedan.
 *
 * Cada acción entra escalonada y la animación se vuelve a disparar cada vez
 * que cambia el contexto, que es lo que hace que el cambio se lea como tal y
 * no como un intercambio silencioso de iconos. Lo que no cabe se pliega en un
 * menú «más», salvo que sobre una sola: un menú de un ítem cuesta más que un
 * sexto icono.
 *
 * Quien la usa solo declara las acciones y su ámbito; los modos, el orden, el
 * escalonado y el plegado los resuelve la barra.
 *
 * @example
 * <DataListActionRail
 *   selectedCount={selected.size}
 *   onClearSelection={() => setSelected(new Set())}
 *   actions={[
 *     { id: "export", label: "Exportar", icon: <Download />, scope: ["screen"] },
 *     { id: "create", label: "Crear proceso", icon: <Plus />, scope: ["screen"], primary: true },
 *     { id: "edit", label: "Editar", icon: <Pencil />, scope: ["single"] },
 *     { id: "dup", label: "Duplicar", icon: <Copy />, scope: ["single", "bulk"], countInLabel: true },
 *     { id: "del", label: "Eliminar", icon: <Trash2 />, scope: ["single", "bulk"], tone: "danger", countInLabel: true },
 *   ]}
 * />
 */
export function DataListActionRail({
  actions: screenActions,
  selectedCount,
  onClearSelection,
  gender = "m",
  inlineLimit = DEFAULT_INLINE_LIMIT,
  locked = false,
  isBlocked = false,
}: DataListActionRailProps) {
  // El agente de IA de la app, si lo hay, cierra la barra por la derecha como
  // una segunda principal con el degradado de la IA: es de todas las
  // pantallas, no una acción más de esta.
  const agent = useRailAgentAction();
  const actions = screenActions;
  useAnnounceRail();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const isCompact = useCompactViewport();

  const mode: RailActionScope = railModeFor(selectedCount);
  const animKey = useContextChangeKey(mode);

  const labelOf = (action: RailActionSpec) => railActionLabel(action, selectedCount);

  const forMode = railActionsFor(actions, selectedCount);

  // Sin selección: las de la pantalla en sus tres pesos —la principal cierra
  // la fila, las de a diario se quedan a la vista y lo que se configura una
  // vez se pliega tras el «⋯».
  const { primary, inline: screenInline, folded: screenFolded } = railScreenTiers(actions);
  usePublishSearchActions(toSearchActions(actions));
  const screenOverflow: readonly RailOverflowItem[] = screenFolded.map((action) => ({
    id: action.id,
    label: action.label,
    icon: action.icon,
    tone: action.tone,
    blockedReason: action.blockedReason,
    onClick: () => action.onSelect?.(),
  }));

  // Con selección: lo que cabe, y el resto plegado. Un único sobrante se queda
  // fuera del menú porque desplegarlo cuesta más que mirarlo.
  const overflowing = forMode.length > inlineLimit + 1;
  const inline = overflowing ? forMode.slice(0, inlineLimit) : forMode;
  const overflow: readonly RailOverflowItem[] = overflowing
    ? forMode.slice(inlineLimit).map((action) => ({
        id: action.id,
        label: labelOf(action),
        icon: action.icon,
        tone: action.tone,
        blockedReason: action.blockedReason,
        onClick: () => action.onSelect?.(),
      }))
    : [];

  if (locked) return null;

  // Estrecho: la misma pieza en su otra forma. No es una barra encogida, es un
  // botón que despliega lo mismo —el reparto de acciones lo decide el mismo
  // código, así que girar el teléfono no cambia lo que se puede hacer.
  if (isCompact) {
    return (
      <ActionFab
        actions={agent ? [agent, ...actions] : actions}
        selectedCount={selectedCount}
        onClearSelection={onClearSelection}
        gender={gender}
      />
    );
  }

  // Su propio proveedor de tooltips: cada acción es un icono y su etiqueta vive
  // en el tooltip, así que la barra se puede soltar en cualquier pantalla sin
  // que quien la monta tenga que acordarse de envolverla.
  return (
    <TooltipProvider>
      <ActionRailShell
        keepOpen={selectedCount > 0 || isMenuOpen}
        isBlocked={isBlocked}
        contextual={
          selectedCount === 0 ? null : (
            <>
              <AnimatedActionItem
                animKey={animKey}
                staggerIndex={0}
                skipColorFlash
              >
                <RailSelectionChip
                  count={selectedCount}
                  onClear={onClearSelection}
                  gender={gender}
                />
              </AnimatedActionItem>
              <AnimatedActionItem
                animKey={animKey}
                staggerIndex={1}
                skipColorFlash
              >
                <RailDivider />
              </AnimatedActionItem>
              {inline.map((action, index) => (
                <AnimatedActionItem
                  key={action.id}
                  animKey={animKey}
                  staggerIndex={2 + index}
                >
                  <RailButton
                    icon={action.icon}
                    label={labelOf(action)}
                    tone={action.tone}
                    blockedReason={action.blockedReason}
                    onClick={() => action.onSelect?.()}
                  />
                </AnimatedActionItem>
              ))}
              {overflow.length > 0 && (
                <AnimatedActionItem
                  animKey={animKey}
                  staggerIndex={2 + inline.length}
                >
                  <RailOverflowMenu
                    items={overflow}
                    onOpenChange={setIsMenuOpen}
                  />
                </AnimatedActionItem>
              )}
            </>
          )
        }
        persistent={
          selectedCount > 0 ? null : (
            <>
              {/* La fila va de menor a mayor peso: primero lo plegado, luego
                  lo de a diario y al final la principal, que la cierra. */}
              {screenOverflow.length > 0 && (
                <AnimatedActionItem animKey={animKey} staggerIndex={0}>
                  <RailOverflowMenu
                    items={screenOverflow}
                    onOpenChange={setIsMenuOpen}
                  />
                </AnimatedActionItem>
              )}
              {screenInline.map((action, index) => (
                <AnimatedActionItem
                  key={action.id}
                  animKey={animKey}
                  staggerIndex={(screenOverflow.length > 0 ? 1 : 0) + index}
                >
                  <RailButton
                    icon={action.icon}
                    label={action.label}
                    tone={action.tone}
                    blockedReason={action.blockedReason}
                    onClick={() => action.onSelect?.()}
                  />
                </AnimatedActionItem>
              ))}
              {primary && (
                <AnimatedActionItem
                  animKey={animKey}
                  staggerIndex={screenInline.length + (screenOverflow.length > 0 ? 1 : 0)}
                >
                  <RailPrimaryAction
                    icon={primary.icon}
                    label={primary.label}
                    onClick={() => primary.onSelect?.()}
                  />
                </AnimatedActionItem>
              )}
              {agent && (
                <AnimatedActionItem animKey={animKey} staggerIndex={screenInline.length + (screenOverflow.length > 0 ? 1 : 0) + (primary ? 1 : 0)} skipColorFlash>
                  {/* Solo la chispa: el nombre va en el tooltip, como en el resto de iconos de la barra. */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={agent.label}
                        data-testid="rail-agent"
                        onClick={() => agent.onSelect?.()}
                        className="hover-icon-pop bg-ai-gradient relative flex size-10 items-center justify-center rounded-xl text-white shadow-ai-premium transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-95"
                      >
                        <Sparkles className="size-[18px]" strokeWidth={2.5} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{agent.label}</TooltipContent>
                  </Tooltip>
                </AnimatedActionItem>
              )}
            </>
          )
        }
      />
    </TooltipProvider>
  );
}
