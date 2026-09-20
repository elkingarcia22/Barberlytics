import * as React from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { AdminShell, type ShellConfigOverrides } from "@/components/app-shell";
import { ThemeSelector, useTheme } from "@/themes";
import { useAuth } from "@/features/auth";
import { APP_NAVIGATION, findActiveNavId } from "../navigation";
import { PageLoader } from "../components/PageLoader";

const ROLE_LABELS: Record<string, string> = { admin: "Administrador", manager: "Líder", member: "Colaborador" };

/**
 * El shell de administración alimentado con datos reales: la persona de la
 * sesión, la navegación de la app con sus rutas, el tema del ThemeProvider y
 * el cierre de sesión. Las notificaciones y novedades siguen con datos demo
 * hasta que exista su endpoint (ver docs/API_CONTRACT.md).
 */
export function AppLayout() {
  const { user, logout } = useAuth();
  const { resolvedMode, setMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const config = React.useMemo<ShellConfigOverrides>(
    () => ({
      user: user
        ? { id: user.id, name: user.name, email: user.email, role: ROLE_LABELS[user.role] ?? user.role, avatarUrl: user.avatarUrl ?? null }
        : undefined,
      brand: { productName: "Thema", tagline: "Plataforma" },
      navigation: APP_NAVIGATION,
      activeNavId: findActiveNavId(location.pathname),
      onNavigate: (_id, path) => {
        if (path) navigate(path);
      },
      promo: null,
      headerActions: <ThemeSelector compact />,
      isDark: resolvedMode === "dark",
      onToggleDark: (dark) => setMode(dark ? "dark" : "light"),
      onLogout: () => {
        void logout().then(() => navigate("/login", { replace: true }));
      },
    }),
    [user, location.pathname, navigate, resolvedMode, setMode, logout]
  );

  return (
    <AdminShell config={config}>
      <React.Suspense fallback={<PageLoader />}>
        <Outlet />
      </React.Suspense>
    </AdminShell>
  );
}
