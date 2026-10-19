import * as React from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { RequireAuth } from "@/features/auth";
import { RequireArea, RoleHome, type AccessArea } from "@/features/access";
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
  BookingPage,
  CalendarPage,
  ConfirmAppointmentPage,
  KioskPage,
  CustomerProfilePage,
  CustomersPage,
  ExpensesPage,
  DocsApp,
  LevelsPage,
  LineupPage,
  AbsencesPage,
  MemberProfilePage,
  PayrollPage,
  MyPayPage,
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
/** Una pantalla que solo abre el rol que tiene esa área; los demás caen en «Sin permiso». */
const guarded = (area: AccessArea, element: React.ReactNode) => <RequireArea area={area}>{lazy(element)}</RequireArea>;

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
          // Cada rol aterriza en lo suyo: el dueño en Métricas, recepción y los barberos en el Calendario.
          { index: true, element: <RoleHome /> },
          // Lo primero que se abre: cómo le fue a la barbería en el periodo.
          { path: "metricas", element: guarded("metrics", <MetricsPage />) },
          // El home anterior ya no existe: quien llegue a esta ruta cae en Métricas.
          { path: "dashboard", element: <Navigate to="/metricas" replace /> },
          { path: "calendario", element: guarded("calendar", <CalendarPage />) },
          // Clientes: la lista con sus segmentos y la ficha de cada uno.
          { path: "clientes", element: guarded("customers", <CustomersPage />) },
          { path: "clientes/:id", element: guarded("customers", <CustomerProfilePage />) },
          // Servicios: el catálogo, el orden de la reserva en línea y la ficha de cada uno.
          // «orden» va antes que `:id` para que no se lea como un servicio.
          { path: "servicios", element: guarded("services", <ServicesPage />) },
          { path: "servicios/orden", element: guarded("services", <ServiceOrderPage />) },
          { path: "servicios/:id", element: guarded("services", <ServiceProfilePage />) },
          // Productos: el catálogo de lo que se vende en mostrador y la ficha de cada uno.
          { path: "productos", element: guarded("products", <ProductsPage />) },
          { path: "productos/:id", element: guarded("products", <ProductProfilePage />) },
          // Transacciones: las cuentas de un periodo. De solo consulta.
          { path: "transacciones", element: guarded("transactions", <TransactionsPage />) },
          // Gastos: lo que sale de caja, fijo y variable, en una sola lista.
          { path: "gastos", element: guarded("expenses", <ExpensesPage />) },
          // Nómina: lo que se le paga a cada barbero en el periodo. De solo consulta.
          { path: "nomina", element: guarded("payroll", <PayrollPage />) },
          // El pago del propio barbero: «Lo que llevo» (comisión) o «Mi negocio» (renta).
          { path: "mi-pago", element: guarded("myPay", <MyPayPage />) },
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
          { path: "usuarios", element: guarded("team", <TeamHomePage />) },
          { path: "usuarios/lista", element: guarded("team", <UsersPage />) },
          // Lo que cuelga de Equipo: la ficha de cada persona, el alta paso a
          // paso, las horas de la semana, los niveles y los dos órdenes.
          { path: "usuarios/miembros/:id", element: guarded("team", <MemberProfilePage />) },
          { path: "usuarios/nuevo", element: guarded("team", <MemberWizardPage />) },
          { path: "usuarios/horarios", element: guarded("team", <WorkHoursPage />) },
          { path: "usuarios/niveles", element: guarded("team", <LevelsPage />) },
          { path: "usuarios/orden", element: guarded("team", <BarberOrderPage />) },
          { path: "usuarios/fila", element: guarded("team", <LineupPage />) },
          { path: "usuarios/ausencias", element: guarded("team", <AbsencesPage />) },
          { path: "configuracion", element: guarded("settings", <SettingsPage />) },
          { path: "configuracion/:seccion", element: guarded("settings", <SettingsSectionPage />) },
          { path: "403", element: <ForbiddenPage /> },
        ],
      },
    ],
  },
  // La reserva en línea es pública: la abre el cliente desde el enlace, la
  // tablet del local o el widget. Quien administra llega desde Cuenta ›
  // «Agendamiento online» y la ve en sus pantallas (vista previa).
  { path: "/reservar", element: lazy(<BookingPage />), errorElement: <RouteError /> },
  // El botón «Confirmar» del WhatsApp: público, con el token de la cita en `?t=`.
  { path: "/reservar/confirmar", element: lazy(<ConfirmAppointmentPage />), errorElement: <RouteError /> },
  // El kiosco de la sede: público, pero solo funciona emparejado con el código de Configuración.
  { path: "/kiosco", element: lazy(<KioskPage />), errorElement: <RouteError /> },
  // El centro de ayuda es público: hace falta antes de entrar (el login tiene
  // sus propios artículos) y trae su propio shell, como la doc.
  { path: "/ayuda/*", element: lazy(<HelpApp />), errorElement: <RouteError /> },
  // La documentación del sistema de diseño es pública y trae su propio shell.
  { path: "/docs/*", element: lazy(<DocsApp />), errorElement: <RouteError /> },
  { path: "*", element: <NotFoundPage /> },
]);
