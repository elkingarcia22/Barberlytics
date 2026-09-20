import { isRouteErrorResponse, Link, useRouteError } from "react-router";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/lib/query";
import { ApiError } from "@/lib/api";

/**
 * Límite de error de las rutas: atrapa lo que reviente al renderizar una
 * página (o al cargarla en diferido) y lo muestra con el mismo estado de
 * error del resto de la app, sin dejar la pantalla en blanco.
 */
export function RouteError() {
  const raw = useRouteError();
  const error = isRouteErrorResponse(raw)
    ? new ApiError({ status: raw.status, code: raw.status === 404 ? "not_found" : "unknown", message: raw.statusText })
    : raw;
  if (import.meta.env.DEV) console.error(raw);
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 p-6">
      <ErrorState error={error} onRetry={() => window.location.reload()} className="w-full" />
      <Button asChild variant="ghost">
        <Link to="/">Volver al inicio</Link>
      </Button>
    </div>
  );
}
