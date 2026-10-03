import * as React from "react"
import { cn } from "@/lib/utils"
import { GlassIcon, type GlassTone, type IconName } from "@/icons"
import { Card } from "@/components/ui/card"

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  /** Concepto del registro de iconos; se pinta como ilustración Glass sobre el título. */
  icon?: IconName
  /** Tono del cristal; `brand` sigue al gradiente de marca del tema. */
  iconTone?: GlassTone
  action?: React.ReactNode
}

export function EmptyState({
  title,
  description,
  icon,
  iconTone = "brand",
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <Card
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center border-dashed border-2 bg-surface-subtle",
        className
      )}
      {...props}
    >
      {icon && <GlassIcon name={icon} tone={iconTone} size={64} className="mb-3" />}
      <h3 className="text-lg font-bold text-text-primary mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-text-secondary max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </Card>
  )
}
