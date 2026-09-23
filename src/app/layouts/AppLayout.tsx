import * as React from "react";
import { Armchair, ConciergeBell, Crown, Scissors, ShieldCheck } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { AdminShell, PersonalizationMenu, type ShellConfigOverrides, type UserRoleOption } from "@/components/app-shell";
import { useTheme } from "@/themes";
import { useAppT } from "../i18n";
import type { AppMessageKey } from "../i18n/types";
import { useAuth } from "@/features/auth";
import { BRANCHES, DEFAULT_BRANCH_ID } from "@/features/branches";
import { buildSettingsGroups, SETTINGS_ALL } from "@/features/settings/settingsCatalog";
import { buildAppNavigation, findActiveNavId } from "../navigation";
import { PageLoader } from "../components/PageLoader";

/**
 * Los roles de la barbería, de más alcance a menos, con la línea que explica
 * qué se ve al asumirlos y el icono que los distingue sin leer. El menú de la
 * cuenta los ofrece para mirar la plataforma como otra persona sin cerrar
 * sesión.
 *
 * Los dos tipos de barbero no son un matiz de nómina: uno cobra comisión por
 * servicio y el otro paga la renta de su silla y cobra directo, así que ven
 * cuentas distintas.
 */
function buildAppRoles(t: (key: AppMessageKey) => string): readonly UserRoleOption[] {
  return [
    { id: "owner", label: t("role.owner"), description: t("role.ownerHint"), icon: Crown },
    { id: "admin", label: t("role.admin"), description: t("role.adminHint"), icon: ShieldCheck },
    { id: "recepcion", label: t("role.reception"), description: t("role.receptionHint"), icon: ConciergeBell },
    { id: "barbero-comision", label: t("role.barberCommission"), description: t("role.barberCommissionHint"), icon: Scissors },
    { id: "barbero-renta", label: t("role.barberRent"), description: t("role.barberRentHint"), icon: Armchair },
  ];
}

/**
 * El shell de administración alimentado con datos reales: la persona de la
 * sesión, la navegación de la app con sus rutas, el tema del ThemeProvider y
 * el cierre de sesión. Las notificaciones y novedades siguen con datos demo
 * hasta que exista su endpoint (ver docs/API_CONTRACT.md).
 */
export function AppLayout() {
  const { user, logout } = useAuth();
  const { resolvedMode, setMode } = useTheme();
  const t = useAppT();
  const roles = React.useMemo(() => buildAppRoles(t), [t]);
  const navigate = useNavigate();
  const location = useLocation();
  // Mirar como otro rol es estado de la app, no de la sesión: el token sigue
  // siendo el mismo y al recargar se vuelve al rol propio.
  const [viewRoleId, setViewRoleId] = React.useState<string | null>(null);
  // La sucursal activa: mientras no haya endpoint, la recuerda la sesión de
  // navegación. Todo lo que se ve debajo es de esta sucursal.
  const [branchId, setBranchId] = React.useState(DEFAULT_BRANCH_ID);
  const settings = React.useMemo(() => buildSettingsGroups(t), [t]);

  const config = React.useMemo<ShellConfigOverrides>(
    () => ({
      user: user
        ? { id: user.id, name: user.name, email: user.email, role: roles.find((role) => role.id === user.role)?.label ?? user.role, avatarUrl: user.avatarUrl ?? null }
        : undefined,
      brand: { productName: "Thema", tagline: "Barbería" },
      navigation: buildAppNavigation(t),
      roles,
      // Aquí se trabaja por sucursal, no por empresa: el conmutador de la
      // cabecera dice en cuál estás y no vende licencias que enseñar.
      companies: BRANCHES,
      activeCompanyId: branchId,
      onSelectCompany: setBranchId,
      companyMenuLinks: [],
      workspaceLabels: { entity: t("branch.entity"), change: t("branch.change"), list: t("branch.list") },
      showWorkspaceUsage: false,
      settings,
      settingsAll: { ...SETTINGS_ALL, label: t("settings.all") },
      activeRoleId: viewRoleId ?? user?.role,
      onSelectRole: setViewRoleId,
      activeNavId: findActiveNavId(location.pathname),
      onNavigate: (_id, path) => {
        if (path) navigate(path);
      },
      promo: null,
      // 1140 y a partir de ahí centrado: en un monitor ancho una línea de 1600
      // px obliga a barrer la cabeza para leerla, y las tarjetas se estiran
      // hasta parecer otra cosa. La tabla, que es lo que pedía sitio, se
      // desplaza de lado dentro de su marco sin arrastrar al resto.
      contentWidth: "normal",
      // Ayuda, por ahora, fuera: no hay centro de ayuda que abrir todavía.
      chrome: { help: false },
      // Tema e idioma ya no van sueltos en la cabecera ni son dos filas
      // aparte en el menú de la marca: son la misma pregunta —«cómo se ve
      // esto»— así que cuelgan de una sola puerta, «Personalización», con la
      // pastilla del color activo puesta encima para reconocerlo sin abrir
      // nada.
      workspaceMenuExtra: <PersonalizationMenu />,
      isDark: resolvedMode === "dark",
      onToggleDark: (dark) => setMode(dark ? "dark" : "light"),
      onLogout: () => {
        void logout().then(() => navigate("/login", { replace: true }));
      },
    }),
    [user, roles, viewRoleId, branchId, settings, location.pathname, navigate, resolvedMode, setMode, logout, t]
  );

  return (
    <AdminShell config={config}>
      <React.Suspense fallback={<PageLoader />}>
        <Outlet />
      </React.Suspense>
    </AdminShell>
  );
}
