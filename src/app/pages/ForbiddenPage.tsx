import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback";

export function ForbiddenPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 p-6">
      <EmptyState title="Sin permiso" description="Tu rol no puede ver esta sección. Pide acceso a un administrador." />
      <Button asChild variant="outline">
        <Link to="/dashboard">Volver al inicio</Link>
      </Button>
    </div>
  );
}
