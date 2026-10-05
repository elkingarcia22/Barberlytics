import * as React from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { AppWindow } from "lucide-react";
import { AdminShell, type ShellConfigOverrides } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { ThemeModeToggle, useTheme } from "@/themes";
import { useAppT } from "@/app/i18n";
import { helpPath, useHelpIndex } from "./content";
import { buildHelpNavigation, helpNavIdFromPath } from "./helpNavigation";

/**
 * Al cambiar de artículo hay que volver arriba, y el shell scrollea un
 * contenedor propio, no la ventana. Misma marca que usa la doc.
 */
function ScrollToTop({ signal }: { signal: string }) {
  const marker = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    marker.current?.closest<HTMLElement>(".overflow-y-auto")?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [signal]);
  return <div ref={marker} aria-hidden className="sr-only" />;
}

/**
 * El shell del centro de ayuda es el shell del producto, como en la doc: el
 * menú lateral es el árbol de secciones y artículos, la búsqueda de la
 * cabecera busca artículos y el resto del cromo (sucursal, rol, novedades,
 * sesión) se apaga porque aquí no hay barbería que administrar.
 */
export function HelpShell({ children }: { children: React.ReactNode }) {
  const t = useAppT();
  const navigate = useNavigate();
  const location = useLocation();
  const { resolvedMode, setMode } = useTheme();
  const { data: index } = useHelpIndex();

  // El título de la pestaña dice dónde se está; al salir vuelve el de la app.
  React.useEffect(() => {
    const previous = document.title;
    const rest = location.pathname.replace(/^\/ayuda\/?/, "").replace(/\/+$/, "");
    const current = rest.includes("/") ? index?.articles[rest]?.title : index?.sections.find((section) => section.id === rest)?.title;
    document.title = current ? `${current} · ${t("help.title")}` : `${t("help.title")} · Barberlytics`;
    return () => {
      document.title = previous;
    };
  }, [index, location.pathname, t]);

  const config = React.useMemo<ShellConfigOverrides>(() => {
    const sectionTitle = (id: string) => index?.sections.find((section) => section.id === id)?.title ?? id;
    return {
      brand: { productName: "Barberlytics", tagline: t("help.title") },
      navigation: buildHelpNavigation(index, t("help.home")),
      activeNavId: helpNavIdFromPath(location.pathname),
      onNavigate: (_id, path) => {
        if (path) navigate(path);
      },
      contentWidth: "normal",
      search: {
        objects: Object.values(index?.articles ?? {}).map((article) => ({
          id: article.id,
          title: article.title,
          meta: [sectionTitle(article.section)],
          keywords: article.keywords,
          onSelect: () => navigate(helpPath(article.id)),
        })),
        navigate: (index?.sections ?? [])
          .filter((section) => section.articles.length > 0)
          .map((section) => ({
            id: `help-section-${section.id}`,
            path: [t("help.title"), section.title],
            onSelect: () => navigate(helpPath(section.id)),
          })),
        placeholder: t("help.searchPlaceholder"),
        triggerLabel: t("help.searchTrigger"),
        scope: t("help.title"),
      },
      headerActions: (
        <>
          <ThemeModeToggle />
          <Button asChild className="gap-inline">
            <Link to="/metricas">
              <AppWindow className="size-3.5" />
              {t("help.openApp")}
            </Link>
          </Button>
        </>
      ),
      chrome: {
        company: false,
        modeSwitch: false,
        news: false,
        help: false,
        notifications: false,
        profile: false,
        role: false,
        settings: false,
        // Leer la ayuda no lanza importaciones ni subidas: no hay procesos que seguir.
        processes: false,
      },
      promo: null,
      isDark: resolvedMode === "dark",
      onToggleDark: (isDark) => setMode(isDark ? "dark" : "light"),
    };
  }, [index, location.pathname, navigate, resolvedMode, setMode, t]);

  return (
    <AdminShell config={config}>
      <ScrollToTop signal={location.pathname} />
      {children}
    </AdminShell>
  );
}
