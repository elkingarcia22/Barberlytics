import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardHeader, CardDescription, CardContent } from "@/components/ui/card"
import { Heading } from "@/components/typography"
import { EmptyState } from "@/components/feedback"

interface TableShellProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /**
   * El título de la lista. Acepta un nodo, no solo texto, para lo que suele
   * ir pegado a él: el total en un `Badge`, una insignia de estado.
   */
  title?: React.ReactNode
  description?: string
  /** Buscador, filtros, configuración de columnas: lo que opera la lista. */
  actions?: React.ReactNode
  children: React.ReactNode
  empty?: boolean
  emptyState?: React.ReactNode
  stickyHeader?: boolean
  /**
   * Dónde pinta el marco. `card` lo pone en todo: fondo y borde alrededor de
   * la tabla. `header` los deja solo en la barra de título y descarga el
   * cuerpo, para cuando las filas ya traen su propio borde —una lista de
   * tarjetas— y encerrarlas otra vez sería una caja dentro de otra.
   */
  surface?: "card" | "header"
  /**
   * El pie del marco: paginación, el resumen de «x de y», una acción de
   * cierre. Va dentro de la tarjeta y separado por su propia línea, para que
   * la paginación no quede flotando fuera de la lista a la que pertenece.
   */
  footer?: React.ReactNode
}

/**
 * TableShell
 *
 * El marco de una lista: una sola superficie que sostiene la barra de título
 * y acciones, la tabla y su pie.
 *
 * La tabla va a sangre dentro del marco (`CardContent` sin padding) y lo que
 * se alinea con el título es el **texto** de la primera columna, no la caja:
 * así las líneas que separan las filas cruzan la tarjeta de lado a lado —como
 * en una lista de verdad— y las columnas siguen empezando donde empieza el
 * título. Nunca una caja con borde dentro de otra: el marco ya es el borde.
 */
export function TableShell({
  title,
  description,
  actions,
  children,
  empty = false,
  emptyState,
  stickyHeader = false,
  surface = "card",
  footer,
  className,
  ...props
}: TableShellProps) {
  const hasHeader = Boolean(title || description || actions)
  const headerOnly = surface === "header"

  return (
    <Card
      className={cn(
        // El radio se queda aunque el marco se descargue: `overflow-hidden` lo
        // recorta sobre la cabecera, que es la que sigue teniendo superficie, y
        // así conserva las esquinas redondeadas del tema.
        "overflow-hidden",
        headerOnly ? "border-transparent bg-transparent shadow-none" : "border-border bg-surface",
        className
      )}
      {...props}
    >
      {hasHeader && (
        <CardHeader
          className={cn(
            "flex flex-row flex-wrap items-center justify-between gap-inline space-y-0 border-b border-border/60 pb-4",
            headerOnly && "bg-surface"
          )}
        >
          <div className="flex min-w-0 flex-col gap-1">
            {/*
              Encabezado de verdad, no una `CardTitle` (que es un `div`): el
              título de una lista es la cabecera de su sección, y quien navega
              por encabezados tiene que poder saltar a ella. Nivel 2 porque el
              h1 de la pantalla es su `PageHeader`.
            */}
            {title && (
              <Heading level={3} as="h2" className="flex items-center gap-inline text-base font-semibold text-text-primary">
                {title}
              </Heading>
            )}
            {description && <CardDescription className="text-sm text-text-secondary">{description}</CardDescription>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-inline">{actions}</div>}
        </CardHeader>
      )}

      <CardContent className="p-0">
        {empty ? (
          <div className="p-card">
            {emptyState || (
              <EmptyState
                icon="layers"
                title="Sin información"
                description="No se encontraron registros para mostrar en esta tabla."
                className="border-none bg-transparent shadow-none"
              />
            )}
          </div>
        ) : (
          <div
            className={cn(
              "relative w-full overflow-x-auto",
              // El texto de los bordes se alinea con el título; la línea de
              // cada fila sigue cruzando la tarjeta completa.
              "[&_td:first-child]:pl-card [&_th:first-child]:pl-card [&_td:last-child]:pr-card [&_th:last-child]:pr-card",
              stickyHeader && "[&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10 [&_thead]:bg-surface"
            )}
          >
            {children}
          </div>
        )}
      </CardContent>

      {footer && (
        <div className="flex flex-wrap items-center gap-inline border-t border-border/60 px-card py-3">{footer}</div>
      )}
    </Card>
  )
}
