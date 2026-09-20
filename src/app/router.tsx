import * as React from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { RequireAuth } from "@/features/auth";
import { LoginPage } from "@/features/auth/LoginPage";
import { AppLayout } from "./layouts/AppLayout";
import { RouteError } from "./components/RouteError";
import { PageLoader } from "./components/PageLoader";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ForbiddenPage } from "./pages/ForbiddenPage";

// Cada pantalla se carga en diferido: el primer render solo trae el shell.
const DashboardPage = React.lazy(() => import("@/features/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const UsersPage = React.lazy(() => import("@/features/users/UsersPage").then((m) => ({ default: m.UsersPage })));
const DocsApp = React.lazy(() => import("@/docs/DocsApp").then((m) => ({ default: m.DocsApp })));

const lazy = (element: React.ReactNode) => <React.Suspense fallback={<PageLoader />}>{element}</React.Suspense>;

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage />, errorElement: <RouteError /> },
  {
    element: <RequireAuth />,
    errorElement: <RouteError />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: "dashboard", element: lazy(<DashboardPage />) },
          { path: "usuarios", element: lazy(<UsersPage />) },
          { path: "403", element: <ForbiddenPage /> },
        ],
      },
    ],
  },
  // La documentación del sistema de diseño es pública y trae su propio shell.
  { path: "/docs/*", element: lazy(<DocsApp />), errorElement: <RouteError /> },
  { path: "*", element: <NotFoundPage /> },
]);
