import { EmptyState } from "@/components/feedback";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="py-20">
      <EmptyState title="Esta página no existe" description="Revisa la URL o vuelve al inicio del sistema de diseño." />
      <div className="mt-4 text-center">
        <Button asChild variant="link">
          <a href="#/">Volver al inicio</a>
        </Button>
      </div>
    </div>
  );
}
