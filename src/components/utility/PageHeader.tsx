import * as React from "react"
import { cn } from "@/lib/utils"
import { usePageHeaderExtras } from "./pageHeaderExtras"

interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode
  description?: string
  breadcrumbs?: React.ReactNode
  actions?: React.ReactNode
  /** Lo que acompaña a las acciones en todas las pantallas (el agente de IA). Por defecto, lo que provea el layout; `null` lo quita. */
  extras?: React.ReactNode
  meta?: React.ReactNode
}

/**
 * PageHeader
 * 
 * Top-level header for application pages.
 * Organizes titles, navigation context (breadcrumbs), primary actions and metadata in a consistent enterprise layout.
 */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  extras,
  meta,
  className,
  ...props
}: PageHeaderProps) {
  const inherited = usePageHeaderExtras()
  const resolvedExtras = extras === undefined ? inherited : extras

  return (
    <div className={cn("flex flex-col gap-4 pb-6", className)} {...props}>
      {breadcrumbs && <div>{breadcrumbs}</div>}
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="shrink-0 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        
        {(actions || resolvedExtras) && (
          // Se parte en varias líneas antes que salirse: con un panel al lado
          // la cabecera se estrecha y una fila larga de acciones no cabe.
          <div className="flex min-w-0 flex-wrap items-center gap-3 md:justify-end">
            {actions}
            {resolvedExtras}
          </div>
        )}
      </div>

      {meta && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {meta}
        </div>
      )}
    </div>
  )
}
