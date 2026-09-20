import { Navigate, Outlet, useLocation } from "react-router";
import { PageLoader } from "@/app/components/PageLoader";
import { useAuth } from "./useAuth";
import type { UserRole } from "./types";

export interface RequireAuthProps {
  /** Si se indica, además de sesión exige uno de estos roles. */
  roles?: readonly UserRole[];
}

/**
 * Guarda de ruta. Mientras la sesión se resuelve muestra un loader de página;
 * sin sesión redirige a /login recordando a dónde iba la persona.
 */
export function RequireAuth({ roles }: RequireAuthProps) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === "loading") return <PageLoader label="Comprobando tu sesión…" />;
  if (status === "anonymous" || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }
  return <Outlet />;
}
