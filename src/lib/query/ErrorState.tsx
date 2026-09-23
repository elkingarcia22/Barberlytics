import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { describeError } from "@/lib/api";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  className?: string;
  /** Compacto para celdas y paneles pequeños. */
  compact?: boolean;
}

/** Estado de error uniforme: título y descripción humanos más reintento. */
export function ErrorState({ error, onRetry, className, compact = false }: ErrorStateProps) {
  const { title, description, code } = describeError(error);
  return (
    <div
      role="alert"
      data-error-code={code}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-status-negative/30 bg-status-negative/5 text-center",
        compact ? "p-4" : "p-8",
        className
      )}
    >
      <span className={cn("flex items-center justify-center rounded-full bg-status-negative/10 text-status-negative", compact ? "size-8" : "size-12")}>
        <AlertTriangle className={compact ? "size-4" : "size-6"} />
      </span>
      <div>
        <p className={cn("font-semibold text-text-primary", compact ? "text-sm" : "text-base")}>{title}</p>
        <p className={cn("mt-1 text-text-secondary", compact ? "text-xs" : "text-sm")}>{description}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCcw /> Reintentar
        </Button>
      )}
    </div>
  );
}
