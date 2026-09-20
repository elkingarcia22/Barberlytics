import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback";

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 p-6">
      <EmptyState title="Esta página no existe" description="Revisa la dirección o vuelve al inicio." />
      <Button asChild>
        <Link to="/">Ir al inicio</Link>
      </Button>
    </div>
  );
}
