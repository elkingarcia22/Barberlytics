import * as React from "react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import type { RowAction } from "./RowActionsMenu"

export interface RowContextMenuProps {
  actions: readonly RowAction[]
  /** Qué se está operando: encabeza el menú, para saber sobre qué se hizo clic. */
  rowLabel?: string
  /** Se abre o se cierra. Al abrir, quien lo usa suele marcar la fila: las acciones operan sobre lo marcado. */
  onOpenChange?: (open: boolean) => void
  /** El elemento sobre el que se hace clic derecho. Tiene que aceptar ref y props (fila, tarjeta). */
  children: React.ReactElement
}

/**
 * RowContextMenu
 *
 * El clic derecho sobre un registro —una fila, una tarjeta de la agenda—: el
 * mismo menú de acciones que el botón «⋯» (`RowActionsMenu`), sin tener que
 * apuntarle. Es un atajo: todo lo que ofrece tiene que existir también a la
 * vista, porque en táctil y con teclado el clic derecho no se descubre.
 *
 * Lo destructivo va al final y separado. Lo que no se puede ahora sale
 * apagado con su motivo, igual que en el menú de la fila. Sin acciones no
 * envuelve nada: el clic derecho vuelve a ser el del navegador.
 *
 * @example
 * <RowContextMenu rowLabel={row.name} actions={acciones}>
 *   <TableRow>…</TableRow>
 * </RowContextMenu>
 */
export function RowContextMenu({ actions, rowLabel, onOpenChange, children }: RowContextMenuProps) {
  if (actions.length === 0) return children

  const regular = actions.filter((action) => action.tone !== "danger")
  const danger = actions.filter((action) => action.tone === "danger")

  return (
    <ContextMenu onOpenChange={onOpenChange}>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56" onClick={(event) => event.stopPropagation()}>
        {rowLabel && <ContextMenuLabel className="truncate text-xs text-text-muted">{rowLabel}</ContextMenuLabel>}
        {regular.map((action) => (
          <RowContextMenuItem key={action.id} action={action} />
        ))}
        {regular.length > 0 && danger.length > 0 && <ContextMenuSeparator />}
        {danger.map((action) => (
          <RowContextMenuItem key={action.id} action={action} />
        ))}
      </ContextMenuContent>
    </ContextMenu>
  )
}

function RowContextMenuItem({ action }: { action: RowAction }) {
  return (
    <ContextMenuItem
      disabled={Boolean(action.blockedReason)}
      title={action.blockedReason ?? undefined}
      onSelect={() => action.onSelect?.()}
      variant={action.tone === "danger" ? "destructive" : "default"}
      data-testid={`row-context-${action.id}`}
    >
      {action.icon}
      {action.label}
    </ContextMenuItem>
  )
}
