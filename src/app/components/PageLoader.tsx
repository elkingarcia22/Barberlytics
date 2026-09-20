import { Loader2 } from "lucide-react";

/** Loader de página completa: para rutas perezosas y la resolución de sesión. */
export function PageLoader({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] w-full flex-col items-center justify-center gap-3 text-text-muted" role="status" aria-live="polite">
      <Loader2 className="size-6 animate-spin text-primary" />
      <span className="text-[13px]">{label}</span>
    </div>
  );
}
