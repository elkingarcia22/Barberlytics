import * as React from "react"
import { Ellipsis } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

/** Una acción sobre una fila. Es el mismo contrato que usa la barra flotante. */
export interface RowAction {
  id: string
  label: string
  icon?: React.ReactNode
  tone?: "default" | "danger"
  /** Por qué no se puede ahora. La deja a la vista, apagada y explicada. */
  blockedReason?: string | null
  onSelect?: () => void
}

export interface RowActionsMenuProps {
  actions: readonly RowAction[]
  /** Qué fila se está operando, para que el botón no sea un «⋯» anónimo. */
  rowLabel?: string
  /** Se abre o se cierra; al abrir, quien lo usa suele marcar la fila para que la acción caiga sobre ella. */
  onOpenChange?: (open: boolean) => void
  className?: string
}

/**
 * RowActionsMenu
 *
 * El botón de acciones de una fila: lo que se puede hacer con ese registro, sin
 * pasar por marcarlo. Es la alternativa a las casillas cuando la lista se opera
 * de una en una —un menú por fila en vez de un modelo de lote—.
 *
 * Lo que no se puede hacer ahora se queda a la vista y apagado, con el motivo:
 * esconder una acción deja preguntándose si existe, y explicarla contesta.
 *
 * @example
 * <RowActionsMenu
 *   rowLabel={row.name}
 *   actions={[
 *     { id: "edit", label: "Editar", icon: <Pencil /> },
 *     { id: "delete", label: "Eliminar", icon: <Trash2 />, tone: "danger" },
 *   ]}
 * />
 */
export function RowActionsMenu({ actions, rowLabel, onOpenChange, className }: RowActionsMenuProps) {
  if (actions.length === 0) return null

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={rowLabel ? `Acciones de ${rowLabel}` : "Acciones de la fila"}
          className={cn("text-text-muted hover:text-text-primary", className)}
          // La fila entera puede ser clicable; el menú es suyo, no de la fila.
          onClick={(event) => event.stopPropagation()}
        >
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48" onClick={(event) => event.stopPropagation()}>
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.id}
            disabled={Boolean(action.blockedReason)}
            title={action.blockedReason ?? undefined}
            onSelect={() => action.onSelect?.()}
            variant={action.tone === "danger" ? "destructive" : "default"}
          >
            {action.icon}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
