import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/*
 * Tecla de atajo. Va en `<kbd>` real para que los lectores de pantalla y el
 * copiado de texto conserven el significado; el aspecto imita una tecla
 * física con un borde inferior más marcado (sombra interior de 1px).
 */
const kbdVariants = cva(
  "pointer-events-none inline-flex select-none items-center justify-center gap-1 rounded-xs border border-border bg-surface-subtle font-mono font-medium text-text-secondary shadow-[inset_0_-1px_0_var(--color-border)] [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      size: {
        default: "h-5 min-w-5 px-1.5 text-[11px] leading-none [&_svg:not([class*='size-'])]:size-3",
        sm: "h-4 min-w-4 px-1 text-[10px] leading-none [&_svg:not([class*='size-'])]:size-2.5",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

function Kbd({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"kbd"> & VariantProps<typeof kbdVariants>) {
  return (
    <kbd
      data-slot="kbd"
      data-size={size}
      className={cn(kbdVariants({ size }), className)}
      {...props}
    />
  )
}

/*
 * Combinación de teclas. Un `<kbd>` que contiene otros `<kbd>` es la forma
 * que marca HTML para «varias teclas a la vez»; el separador va entre cada
 * par de hijos y queda fuera del árbol accesible para no leer «más» en voz
 * alta.
 */
function KbdGroup({
  className,
  children,
  separator = "+",
  ...props
}: React.ComponentProps<"kbd"> & {
  /** Texto entre teclas; `null` las pega sin separador. */
  separator?: React.ReactNode
}) {
  const items = React.Children.toArray(children)

  return (
    <kbd
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1 font-sans text-[11px] text-text-muted", className)}
      {...props}
    >
      {items.map((child, index) => (
        <React.Fragment key={index}>
          {index > 0 && separator !== null && (
            <span aria-hidden="true" data-slot="kbd-group-separator">
              {separator}
            </span>
          )}
          {child}
        </React.Fragment>
      ))}
    </kbd>
  )
}

export { Kbd, KbdGroup, kbdVariants }
