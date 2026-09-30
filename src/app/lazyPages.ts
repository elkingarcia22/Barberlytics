import * as React from "react";

/** Cada pantalla se carga en diferido: el primer render solo trae el shell. */
export const DashboardPage = React.lazy(() => import("@/features/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage })));
export const MetricsPage = React.lazy(() => import("@/features/metrics/MetricsPage").then((m) => ({ default: m.MetricsPage })));
export const TeamHomePage = React.lazy(() => import("@/features/team/TeamHomePage").then((m) => ({ default: m.TeamHomePage })));
export const UsersPage = React.lazy(() => import("@/features/users/UsersPage").then((m) => ({ default: m.UsersPage })));
export const DocsApp = React.lazy(() => import("@/docs/DocsApp").then((m) => ({ default: m.DocsApp })));
export const SettingsPage = React.lazy(() => import("@/features/settings/SettingsPage").then((m) => ({ default: m.SettingsPage })));
export const SettingsSectionPage = React.lazy(() => import("@/features/settings/SettingsSectionPage").then((m) => ({ default: m.SettingsSectionPage })));
/** El marco de una sección del menú que todavía no tiene pantalla. */
export const SectionPlaceholderPage = React.lazy(() =>
  import("@/features/sections/SectionPlaceholderPage").then((m) => ({ default: m.SectionPlaceholderPage }))
);
