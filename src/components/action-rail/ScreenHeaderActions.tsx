import * as React from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePublishSearchActions } from "@/components/search";
import { railScreenTiers, toSearchActions, type RailActionSpec } from "./railActions";
import { useRailLayoutActions } from "./railLayout";

/**
 * En la barra flotante cada acción es un icono de 20 px; dentro de un botón o
 * de un menú el icono acompaña a un texto y se lee a 16. Se ajusta aquí y no
 * en la declaración porque la acción es la misma en las dos superficies.
 */
const withTextIcon = (icon: React.ReactNode): React.ReactNode =>
  React.isValidElement<{ className?: string }>(icon)
    ? React.cloneElement(icon, { className: "size-4" })
    : icon;

export interface ScreenHeaderActionsProps {
  actions: readonly RailActionSpec[];
  /** La etiqueta del menú que recoge las terciarias. */
  moreLabel: string;
  /**
   * Todo lo que no es la principal va al menú: las de a diario arriba y,
   * tras un separador, las plegadas. Para cabeceras que comparten una sola
   * fila con otros controles y no pueden gastar ancho en botones con texto.
   */
  compact?: boolean;
}

const MenuItems = ({ actions }: { actions: readonly RailActionSpec[] }) =>
  actions.map((action) => (
    <DropdownMenuItem key={action.id} onSelect={() => action.onSelect?.()}>
      {withTextIcon(action.icon)}
      <span className="leading-tight">{action.label}</span>
    </DropdownMenuItem>
  ));

/**
 * Las acciones de la pantalla cuando no manda la barra flotante.
 *
 * El reparto en tres pesos —la principal rellena, lo de a diario a la vista y
 * lo que se configura una vez plegado en «más acciones»— lo decide
 * `railScreenTiers`, el mismo que usa la barra. Así cambiar dónde se ven las
 * acciones no les cambia cuál pesa más.
 */
export function ScreenHeaderActions({ actions: declared, moreLabel, compact = false }: ScreenHeaderActionsProps) {
  // La misma elección de «Editar acciones» que la barra: cambiar de sitio las acciones no cambia cuáles son.
  const { actions } = useRailLayoutActions(declared);
  const tiers = railScreenTiers(actions);
  const { primary } = tiers;
  const inline = compact ? [] : tiers.inline;
  // En compacto, lo de a diario entra al menú encima de lo plegado.
  const menuGroups = (compact ? [tiers.inline, tiers.folded] : [tiers.folded]).filter((group) => group.length > 0);
  // Aquí no hay ancla del shell que marque el alcance: la cabecera de la
  // pantalla es, por definición, de la pantalla.
  usePublishSearchActions(toSearchActions(actions), true);

  return (
    <>
      {/* De menor a mayor peso: lo plegado abre la fila reducido a su icono,
          y la principal la cierra. Un «⋯» con su palabra al lado pesaría
          tanto como la acción que sí se usa a diario. */}
      {menuGroups.length > 0 && (
        <DropdownMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label={moreLabel}>
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>{moreLabel}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {/* Las terciarias traen etiquetas largas —son reglas, no verbos—,
              así que el menú se declara ancho en vez de recortarlas. */}
          <DropdownMenuContent align={compact ? "end" : "start"} className="w-[19rem]">
            {menuGroups.map((group, index) => (
              <React.Fragment key={group[0].id}>
                {index > 0 && <DropdownMenuSeparator />}
                <MenuItems actions={group} />
              </React.Fragment>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {inline.map((action) => (
        // Un filtro rápido puesto se ve pulsado, como en la barra.
        <Button key={action.id} variant={action.filter && action.active ? "secondary" : "outline"} aria-pressed={action.filter ? Boolean(action.active) : undefined} onClick={() => action.onSelect?.()}>
          {withTextIcon(action.icon)} {action.label}
        </Button>
      ))}

      {primary && (
        <Button onClick={() => primary.onSelect?.()}>
          {withTextIcon(primary.icon)} {primary.label}
        </Button>
      )}
    </>
  );
}
