import * as React from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { ArrowLeftRight, HandCoins, Package, Receipt, Scissors, Users } from "lucide-react";
import { RequireAuth } from "@/features/auth";
import { LoginPage } from "@/features/auth/LoginPage";
import { AppLayout } from "./layouts/AppLayout";
import { RouteError } from "./components/RouteError";
import { PageLoader } from "./components/PageLoader";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ForbiddenPage } from "./pages/ForbiddenPage";
import type { SectionPlaceholderPageProps } from "@/features/sections";
import type { AppMessageKey } from "./i18n";

import {
  BarberOrderPage,
  CalendarPage,
  DashboardPage,
  DocsApp,
  LevelsPage,
  LineupPage,
  MemberProfilePage,
  MemberWizardPage,
  WorkHoursPage,
  HelpApp,
  MetricsPage,
  SectionPlaceholderPage,
  SettingsPage,
  SettingsSectionPage,
  TeamHomePage,
  UsersPage,
} from "./lazyPages";

const lazy = (element: React.ReactNode) => <React.Suspense fallback={<PageLoader />}>{element}</React.Suspense>;

/**
 * Las secciones del menú que ya existen para quien navega pero todavía no
 * tienen pantalla. Comparten marco (migas, título, estado) para que
 * construirlas sea rellenar el cuerpo y nada más.
 */
const PLACEHOLDER_SECTIONS: readonly (Omit<SectionPlaceholderPageProps, "trail"> & {
  path: string;
  trail?: readonly AppMessageKey[];
})[] = [
  { path: "clientes", titleKey: "nav.clients", descriptionKey: "section.clientsHint", icon: Users },
  { path: "servicios", titleKey: "nav.services", descriptionKey: "section.servicesHint", icon: Scissors },
  { path: "productos", titleKey: "nav.products", descriptionKey: "section.productsHint", icon: Package },
  { path: "gastos", titleKey: "nav.expenses", descriptionKey: "section.expensesHint", icon: Receipt },
  { path: "nomina", titleKey: "nav.payroll", descriptionKey: "section.payrollHint", icon: HandCoins },
  { path: "transacciones", titleKey: "nav.transactions", descriptionKey: "section.transactionsHint", icon: ArrowLeftRight },
];

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage />, errorElement: <RouteError /> },
  {
    element: <RequireAuth />,
    errorElement: <RouteError />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/metricas" replace /> },
          // Lo primero que se abre: cómo le fue a la barbería en el periodo.
          { path: "metricas", element: lazy(<MetricsPage />) },
          // La plantilla de una pantalla de gestión completa; la referencia
          // la doc (Flujo de trabajo) y la fijan los e2e, así que sigue enrutada.
          { path: "dashboard", element: lazy(<DashboardPage />) },
          { path: "calendario", element: lazy(<CalendarPage />) },
          ...PLACEHOLDER_SECTIONS.map((section) => ({
            path: section.path,
            element: lazy(
              <SectionPlaceholderPage
                titleKey={section.titleKey}
                descriptionKey={section.descriptionKey}
                icon={section.icon}
                trail={section.trail}
              />
            ),
          })),
          // Equipo abre su home —el pulso del equipo, los avisos por rol y la
          // lista— y la administración de personas cuelga de él.
          { path: "usuarios", element: lazy(<TeamHomePage />) },
          { path: "usuarios/lista", element: lazy(<UsersPage />) },
          // Lo que cuelga de Equipo: la ficha de cada persona, el alta paso a
          // paso, las horas de la semana, los niveles y los dos órdenes.
          { path: "usuarios/miembros/:id", element: lazy(<MemberProfilePage />) },
          { path: "usuarios/nuevo", element: lazy(<MemberWizardPage />) },
          { path: "usuarios/horarios", element: lazy(<WorkHoursPage />) },
          { path: "usuarios/niveles", element: lazy(<LevelsPage />) },
          { path: "usuarios/orden", element: lazy(<BarberOrderPage />) },
          { path: "usuarios/fila", element: lazy(<LineupPage />) },
          { path: "configuracion", element: lazy(<SettingsPage />) },
          { path: "configuracion/:seccion", element: lazy(<SettingsSectionPage />) },
          { path: "403", element: <ForbiddenPage /> },
        ],
      },
    ],
  },
  // El centro de ayuda es público: hace falta antes de entrar (el login tiene
  // sus propios artículos) y trae su propio shell, como la doc.
  { path: "/ayuda/*", element: lazy(<HelpApp />), errorElement: <RouteError /> },
  // La documentación del sistema de diseño es pública y trae su propio shell.
  { path: "/docs/*", element: lazy(<DocsApp />), errorElement: <RouteError /> },
  { path: "*", element: <NotFoundPage /> },
]);
