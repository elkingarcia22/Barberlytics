import * as React from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { RequireAuth } from "@/features/auth";
import { LoginPage } from "@/features/auth/LoginPage";
import { AppLayout } from "./layouts/AppLayout";
import { RouteError } from "./components/RouteError";
import { PageLoader } from "./components/PageLoader";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ForbiddenPage } from "./pages/ForbiddenPage";

import { DashboardPage, DocsApp, UsersPage } from "./lazyPages";

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
