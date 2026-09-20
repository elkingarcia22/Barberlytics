import { EmptyState } from "@/components/feedback";

export function NotFoundPage() {
  return (
    <div className="py-20">
      <EmptyState title="Esta página no existe" description="Revisa la URL o vuelve al inicio del sistema de diseño." />
      <div className="mt-4 text-center">
        <a href="#/" className="text-sm font-medium text-primary hover:underline">
          Volver al inicio
        </a>
      </div>
    </div>
  );
}
