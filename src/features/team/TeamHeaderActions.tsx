import * as React from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { railScreenTiers, type RailActionSpec } from "@/components/action-rail";

/**
 * En la barra flotante cada acción es un icono de 20 px; dentro de un botón o
 * de un menú el icono acompaña a un texto y se lee a 16. Se ajusta aquí y no
 * en la declaración porque la acción es la misma en las dos superficies.
 */
const withTextIcon = (icon: React.ReactNode): React.ReactNode =>
  React.isValidElement<{ className?: string }>(icon)
    ? React.cloneElement(icon, { className: "size-4" })
    : icon;

export interface TeamHeaderActionsProps {
  actions: readonly RailActionSpec[];
  /** La etiqueta del menú que recoge las terciarias. */
  moreLabel: string;
}

/**
 * Las acciones de la pantalla cuando no manda la barra flotante.
 *
 * El reparto en tres pesos —la principal rellena, lo de a diario a la vista y
 * lo que se configura una vez plegado en «más acciones»— lo decide
 * `railScreenTiers`, el mismo que usa la barra. Así cambiar dónde se ven las
 * acciones no les cambia cuál pesa más.
 */
export function TeamHeaderActions({ actions, moreLabel }: TeamHeaderActionsProps) {
  const { primary, inline, folded } = railScreenTiers(actions);

  return (
    <>
      {/* De menor a mayor peso: lo plegado abre la fila reducido a su icono,
          y la principal la cierra. Un «⋯» con su palabra al lado pesaría
          tanto como la acción que sí se usa a diario. */}
      {folded.length > 0 && (
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
          <DropdownMenuContent align="start" className="w-[19rem]">
            {folded.map((action) => (
              <DropdownMenuItem key={action.id} onSelect={() => action.onSelect?.()}>
                {withTextIcon(action.icon)}
                <span className="leading-tight">{action.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {inline.map((action) => (
        <Button key={action.id} variant="outline" onClick={() => action.onSelect?.()}>
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
