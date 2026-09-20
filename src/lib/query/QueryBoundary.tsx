import type * as React from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback";
import { ErrorState } from "./ErrorState";

export interface QueryBoundaryProps<T> {
  query: UseQueryResult<T>;
  children: (data: T) => React.ReactNode;
  /** Qué mostrar mientras carga por primera vez. Por defecto, tres líneas de skeleton. */
  loading?: React.ReactNode;
  /** Cuándo el resultado cuenta como vacío y qué mostrar entonces. */
  empty?: { when: (data: T) => boolean; render: React.ReactNode };
  /** Personaliza el error; recibe el error y la función para reintentar. */
  error?: (error: unknown, retry: () => void) => React.ReactNode;
  className?: string;
}

function DefaultLoading() {
  return (
    <div className="space-y-3" role="status" aria-busy="true" aria-live="polite">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

/**
 * El patrón único de carga → error → vacío → datos. Cada pantalla lo usa en
 * vez de escribir sus propios `if (isLoading)`; así los tres estados se ven
 * igual en toda la aplicación y siempre existe un botón de reintentar.
 */
export function QueryBoundary<T>({ query, children, loading, empty, error, className }: QueryBoundaryProps<T>) {
  if (query.isPending) {
    return <div className={className}>{loading ?? <DefaultLoading />}</div>;
  }
  if (query.isError) {
    const retry = () => void query.refetch();
    return <div className={className}>{error ? error(query.error, retry) : <ErrorState error={query.error} onRetry={retry} />}</div>;
  }
  if (empty && empty.when(query.data)) {
    return <div className={className}>{empty.render ?? <EmptyState title="Nada por aquí" />}</div>;
  }
  return <>{children(query.data)}</>;
}
