import * as React from "react"
import { Ellipsis, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  railActionLabel,
  railActionsFor,
  railModeFor,
  selectionLabel,
  type RailActionSpec,
} from "./railActions"

export interface ActionFabProps {
  actions: readonly RailActionSpec[]
  selectedCount: number
  onClearSelection: () => void
  gender?: "f" | "m"
  className?: string
}

/**
 * ActionFab
 *
 * La barra de acciones cuando no hay sitio para una barra: un solo botón en la
 * esquina que, al tocarlo, despliega hacia arriba todo lo que se puede hacer,
 * con la acción principal la primera y destacada.
 *
 * Cerrado enseña el icono de esa acción principal —o el recuento, si hay algo
 * marcado—, así que de un vistazo se sabe qué ofrece sin abrirlo. Abierto se
 * convierte en la ✕ que lo cierra, para no gastar un segundo objetivo táctil
 * en algo que el pulgar ya tiene debajo.
 *
 * Reparte las acciones con las mismas reglas que la barra de escritorio: girar
 * el teléfono no puede cambiar lo que se puede hacer.
 *
 * @example
 * <ActionFab actions={acciones} selectedCount={selected.size} onClearSelection={limpiar} />
 */
export function ActionFab({
  actions,
  selectedCount,
  onClearSelection,
  gender = "m",
  className,
}: ActionFabProps) {
  const [open, setOpen] = React.useState(false)
  const mode = railModeFor(selectedCount)
  const available = railActionsFor(actions, selectedCount)
  const primary = available.find((action) => action.primary)
  const rest = available.filter((action) => !action.primary)

  // Al cambiar de contexto lo de dentro ya no es lo que se abrió: se cierra en
  // vez de quedarse abierto ofreciendo otra cosa bajo el mismo dedo.
  React.useEffect(() => {
    setOpen(false)
  }, [mode])

  React.useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  if (available.length === 0) return null

  const run = (action: RailActionSpec) => {
    setOpen(false)
    action.onSelect?.()
  }

  return (
    <>
      {/* El velo cierra al tocar fuera y aísla lo de debajo mientras está
          abierto; no lleva foco porque la ✕ y Escape ya son la salida. */}
      {open && (
        <div
          aria-hidden
          onClick={() => setOpen(false)}
          className="pointer-events-auto fixed inset-0 z-rail bg-black/60 backdrop-blur-sm animate-in fade-in motion-reduce:animate-none"
        />
      )}

      <div className={cn("pointer-events-none relative z-rail flex w-full justify-end p-page", className)}>
        <div className="pointer-events-auto flex flex-col items-end gap-stack">
          {open && (
            <>
              {/* Con muchas acciones la lista no cabe en el celular: se desplaza dentro del alto de la
                  pantalla en vez de salirse por arriba. Va invertida (lo primero, abajo, junto al pulgar)
                  para que al abrir el scroll empiece en las acciones más cercanas al botón. */}
              <div className="-mr-1 flex max-h-[calc(100dvh-12rem)] flex-col-reverse items-end gap-stack overflow-y-auto overscroll-contain py-1 pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {rest.map((action, index) => (
                  <FabRow
                    key={action.id}
                    label={railActionLabel(action, selectedCount)}
                    tone={action.tone}
                    blockedReason={action.blockedReason}
                    onClick={() => run(action)}
                    index={index}
                  >
                    {action.icon}
                  </FabRow>
                ))}
                {selectedCount > 0 && (
                  <FabRow onClick={onClearSelection} label={`Soltar ${selectionLabel(selectedCount, gender)}`} index={rest.length}>
                    <X className="size-5" />
                  </FabRow>
                )}
              </div>
              {primary && (
                <button
                  type="button"
                  onClick={() => run(primary)}
                  className="flex h-12 items-center gap-inline rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-rail transition-transform duration-fast hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none motion-reduce:hover:scale-100"
                >
                  {primary.icon}
                  {primary.label}
                </button>
              )}
            </>
          )}

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={open ? "Cerrar las acciones" : "Abrir las acciones"}
            className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-rail transition-transform duration-fast hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100"
          >
            {open ? (
              <X className="size-6" />
            ) : selectedCount > 0 ? (
              <span className="text-base font-bold tabular-nums">{selectedCount}</span>
            ) : (
              (primary?.icon ?? <Ellipsis className="size-6" />)
            )}
          </button>
        </div>
      </div>
    </>
  )
}

/** Una acción del abanico: su etiqueta a la izquierda y el icono en su pastilla. */
function FabRow({
  label,
  tone = "default",
  blockedReason,
  onClick,
  index,
  children,
}: {
  label: string
  tone?: "default" | "danger"
  blockedReason?: string | null
  onClick: () => void
  index: number
  children: React.ReactNode
}) {
  const disabled = Boolean(blockedReason)
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={blockedReason ?? undefined}
      // Escalonadas al entrar, de abajo arriba: se leen como una lista que se
      // despliega y no como un bloque que aparece de golpe.
      style={{ animationDelay: `${index * 40}ms` }}
      className="flex items-center gap-inline animate-in fade-in slide-in-from-bottom-2 fill-mode-both disabled:pointer-events-none disabled:opacity-40 motion-reduce:animate-none"
    >
      <span className="rounded-lg bg-nav px-2.5 py-1 text-xs font-medium text-nav-foreground shadow-card">
        {label}
      </span>
      <span
        className={cn(
          "flex size-11 items-center justify-center rounded-full bg-surface shadow-rail ring-1 ring-border transition-colors duration-fast motion-reduce:transition-none",
          tone === "danger" ? "text-status-negative" : "text-text-primary"
        )}
      >
        {children}
      </span>
    </button>
  )
}
