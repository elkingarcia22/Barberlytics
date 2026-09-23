import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

/*
 * Varios `Button` pegados como un solo control. Los radios internos y el
 * solape de bordes se resuelven desde aquí con selectores de hijo directo:
 * así cualquier hijo (Button, un trigger de Select, un Input…) encaja sin
 * conocer al grupo.
 *
 * Nota de Tailwind: `Button` trae `in-data-[slot=button-group]:rounded-lg`,
 * sintaxis de v4 que en la 3.4 del proyecto no genera nada. Por eso el grupo
 * no delega en el hijo y fija los radios él mismo.
 */
const buttonGroupVariants = cva(
  "flex w-fit items-stretch [&>*]:relative [&>*]:focus-visible:z-10 [&>*]:hover:z-10 [&>*:not(:first-child):not(:last-child)]:rounded-none",
  {
    variants: {
      orientation: {
        horizontal:
          "flex-row [&>*:not(:first-child)]:-ml-px [&>*:first-child:not(:last-child)]:rounded-r-none [&>*:last-child:not(:first-child)]:rounded-l-none",
        vertical:
          "flex-col [&>*]:w-full [&>*:not(:first-child)]:-mt-px [&>*:first-child:not(:last-child)]:rounded-b-none [&>*:last-child:not(:first-child)]:rounded-t-none",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  }
)

function ButtonGroup({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof buttonGroupVariants>) {
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...props}
    />
  )
}

/*
 * Línea entre dos botones que no tienen borde propio (variantes `default`,
 * `secondary` o `ghost`), donde el solape de 1px no dibuja nada. Con
 * `outline` no hace falta.
 */
function ButtonGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={cn("relative self-stretch bg-border", className)}
      {...props}
    />
  )
}

export { ButtonGroup, ButtonGroupSeparator, buttonGroupVariants }
