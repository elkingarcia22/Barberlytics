import * as React from "react";
import { createBrowserRouter, Navigate } from "react-router";
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
  CustomerProfilePage,
  CustomersPage,
  ExpensesPage,
  DocsApp,
  LevelsPage,
  LineupPage,
  MemberProfilePage,
  PayrollPage,
  ProductProfilePage,
  ProductsPage,
  ServiceOrderPage,
  ServiceProfilePage,
  ServicesPage,
  TransactionsPage,
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
  /* Hoy todas las secciones del menú tienen pantalla; el hueco se queda para la próxima. */
})[] = [];

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
          // El home anterior ya no existe: quien llegue a esta ruta cae en Métricas.
          { path: "dashboard", element: <Navigate to="/metricas" replace /> },
          { path: "calendario", element: lazy(<CalendarPage />) },
          // Clientes: la lista con sus segmentos y la ficha de cada uno.
          { path: "clientes", element: lazy(<CustomersPage />) },
          { path: "clientes/:id", element: lazy(<CustomerProfilePage />) },
          // Servicios: el catálogo, el orden de la reserva en línea y la ficha de cada uno.
          // «orden» va antes que `:id` para que no se lea como un servicio.
          { path: "servicios", element: lazy(<ServicesPage />) },
          { path: "servicios/orden", element: lazy(<ServiceOrderPage />) },
          { path: "servicios/:id", element: lazy(<ServiceProfilePage />) },
          // Productos: el catálogo de lo que se vende en mostrador y la ficha de cada uno.
          { path: "productos", element: lazy(<ProductsPage />) },
          { path: "productos/:id", element: lazy(<ProductProfilePage />) },
          // Transacciones: las cuentas de un periodo. De solo consulta.
          { path: "transacciones", element: lazy(<TransactionsPage />) },
          // Gastos: lo que sale de caja, fijo y variable, en una sola lista.
          { path: "gastos", element: lazy(<ExpensesPage />) },
          // Nómina: lo que se le paga a cada barbero en el periodo. De solo consulta.
          { path: "nomina", element: lazy(<PayrollPage />) },
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
