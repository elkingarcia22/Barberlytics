import * as React from "react"
import { Collapsible as CollapsiblePrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Collapsible({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

function CollapsibleTrigger({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      {...props}
    />
  )
}

/*
 * La animación de apertura sale de tailwindcss-animate (fundido + un ligero
 * desplazamiento desde arriba): el proyecto no declara keyframes de altura
 * (`accordion-down`) en su Tailwind 3.4, así que animar la altura real no
 * es posible sin tocar la configuración global. Radix mantiene el nodo
 * montado hasta que termina `animate-out`, por eso el cierre también se ve.
 */
function CollapsibleContent({
  className,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      className={cn(
        "overflow-hidden data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-top-1 data-open:duration-200 data-open:[animation-timing-function:cubic-bezier(0.16,1,0.3,1)] data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-top-1 data-closed:duration-150 motion-reduce:animate-none",
        className
      )}
      {...props}
    />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
