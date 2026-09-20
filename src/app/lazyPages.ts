import * as React from "react";

/** Cada pantalla se carga en diferido: el primer render solo trae el shell. */
export const DashboardPage = React.lazy(() => import("@/features/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage })));
export const UsersPage = React.lazy(() => import("@/features/users/UsersPage").then((m) => ({ default: m.UsersPage })));
export const DocsApp = React.lazy(() => import("@/docs/DocsApp").then((m) => ({ default: m.DocsApp })));
