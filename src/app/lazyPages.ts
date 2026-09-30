import * as React from "react";

/** Cada pantalla se carga en diferido: el primer render solo trae el shell. */
export const DashboardPage = React.lazy(() => import("@/features/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage })));
export const CalendarPage = React.lazy(() => import("@/features/calendar/CalendarPage").then((m) => ({ default: m.CalendarPage })));
export const MemberProfilePage = React.lazy(() => import("@/features/team/MemberProfilePage").then((m) => ({ default: m.MemberProfilePage })));
export const MemberWizardPage = React.lazy(() => import("@/features/team/MemberWizardPage").then((m) => ({ default: m.MemberWizardPage })));
export const WorkHoursPage = React.lazy(() => import("@/features/team/WorkHoursPage").then((m) => ({ default: m.WorkHoursPage })));
export const LevelsPage = React.lazy(() => import("@/features/team/LevelsPage").then((m) => ({ default: m.LevelsPage })));
export const BarberOrderPage = React.lazy(() => import("@/features/team/BarberOrderPage").then((m) => ({ default: m.BarberOrderPage })));
export const LineupPage = React.lazy(() => import("@/features/team/LineupPage").then((m) => ({ default: m.LineupPage })));
export const TeamHomePage = React.lazy(() => import("@/features/team/TeamHomePage").then((m) => ({ default: m.TeamHomePage })));
export const UsersPage = React.lazy(() => import("@/features/users/UsersPage").then((m) => ({ default: m.UsersPage })));
export const DocsApp = React.lazy(() => import("@/docs/DocsApp").then((m) => ({ default: m.DocsApp })));
/** El centro de ayuda: lee el contenido publicado por el repo `centro-de-ayuda`. */
export const HelpApp = React.lazy(() => import("@/help/HelpApp").then((m) => ({ default: m.HelpApp })));
export const SettingsPage = React.lazy(() => import("@/features/settings/SettingsPage").then((m) => ({ default: m.SettingsPage })));
export const SettingsSectionPage = React.lazy(() => import("@/features/settings/SettingsSectionPage").then((m) => ({ default: m.SettingsSectionPage })));
/** El marco de una sección del menú que todavía no tiene pantalla. */
export const SectionPlaceholderPage = React.lazy(() =>
  import("@/features/sections/SectionPlaceholderPage").then((m) => ({ default: m.SectionPlaceholderPage }))
);
