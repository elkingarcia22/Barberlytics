import * as React from "react";

/** Cada pantalla se carga en diferido: el primer render solo trae el shell. */
export const DashboardPage = React.lazy(() => import("@/features/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage })));
export const CalendarPage = React.lazy(() => import("@/features/calendar/CalendarPage").then((m) => ({ default: m.CalendarPage })));
export const CustomersPage = React.lazy(() => import("@/features/customers/CustomersPage").then((m) => ({ default: m.CustomersPage })));
export const CustomerProfilePage = React.lazy(() => import("@/features/customers/CustomerProfilePage").then((m) => ({ default: m.CustomerProfilePage })));
export const ServicesPage = React.lazy(() => import("@/features/services/ServicesPage").then((m) => ({ default: m.ServicesPage })));
export const ServiceProfilePage = React.lazy(() => import("@/features/services/ServiceProfilePage").then((m) => ({ default: m.ServiceProfilePage })));
export const ServiceOrderPage = React.lazy(() => import("@/features/services/ServiceOrderPage").then((m) => ({ default: m.ServiceOrderPage })));
export const ProductsPage = React.lazy(() => import("@/features/products/ProductsPage").then((m) => ({ default: m.ProductsPage })));
export const ProductProfilePage = React.lazy(() => import("@/features/products/ProductProfilePage").then((m) => ({ default: m.ProductProfilePage })));
export const TransactionsPage = React.lazy(() => import("@/features/transactions/TransactionsPage").then((m) => ({ default: m.TransactionsPage })));
export const ExpensesPage = React.lazy(() => import("@/features/expenses/ExpensesPage").then((m) => ({ default: m.ExpensesPage })));
export const PayrollPage = React.lazy(() => import("@/features/payroll/PayrollPage").then((m) => ({ default: m.PayrollPage })));
export const MyPayPage = React.lazy(() => import("@/features/payroll/MyPayPage").then((m) => ({ default: m.MyPayPage })));
export const MemberProfilePage = React.lazy(() => import("@/features/team/MemberProfilePage").then((m) => ({ default: m.MemberProfilePage })));
export const MemberWizardPage = React.lazy(() => import("@/features/team/MemberWizardPage").then((m) => ({ default: m.MemberWizardPage })));
export const WorkHoursPage = React.lazy(() => import("@/features/team/WorkHoursPage").then((m) => ({ default: m.WorkHoursPage })));
export const LevelsPage = React.lazy(() => import("@/features/team/LevelsPage").then((m) => ({ default: m.LevelsPage })));
export const BarberOrderPage = React.lazy(() => import("@/features/team/BarberOrderPage").then((m) => ({ default: m.BarberOrderPage })));
export const LineupPage = React.lazy(() => import("@/features/team/LineupPage").then((m) => ({ default: m.LineupPage })));
export const AbsencesPage = React.lazy(() => import("@/features/team/AbsencesPage").then((m) => ({ default: m.AbsencesPage })));
export const MetricsPage = React.lazy(() => import("@/features/metrics/MetricsPage").then((m) => ({ default: m.MetricsPage })));
export const TeamHomePage = React.lazy(() => import("@/features/team/TeamHomePage").then((m) => ({ default: m.TeamHomePage })));
export const UsersPage = React.lazy(() => import("@/features/users/UsersPage").then((m) => ({ default: m.UsersPage })));
export const DocsApp = React.lazy(() => import("@/docs/DocsApp").then((m) => ({ default: m.DocsApp })));
/** La reserva en línea que ve el cliente; pública, con su propia vista previa. */
export const BookingPage = React.lazy(() => import("@/features/booking/BookingPage").then((m) => ({ default: m.BookingPage })));
export const KioskPage = React.lazy(() => import("@/features/frontDesk/KioskPage").then((m) => ({ default: m.KioskPage })));
export const ConfirmAppointmentPage = React.lazy(() => import("@/features/booking/ConfirmAppointmentPage").then((m) => ({ default: m.ConfirmAppointmentPage })));
/** El centro de ayuda: lee el contenido publicado por el repo `centro-de-ayuda`. */
export const HelpApp = React.lazy(() => import("@/help/HelpApp").then((m) => ({ default: m.HelpApp })));
export const SettingsPage = React.lazy(() => import("@/features/settings/SettingsPage").then((m) => ({ default: m.SettingsPage })));
export const SettingsSectionPage = React.lazy(() => import("@/features/settings/SettingsSectionPage").then((m) => ({ default: m.SettingsSectionPage })));
/** El marco de una sección del menú que todavía no tiene pantalla. */
export const SectionPlaceholderPage = React.lazy(() =>
  import("@/features/sections/SectionPlaceholderPage").then((m) => ({ default: m.SectionPlaceholderPage }))
);
