import * as React from "react";
import { Link } from "react-router";
import { AppWindow } from "lucide-react";
import { AdminShell, ShellHeaderSlot, type ShellConfigOverrides } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/navigation";
import { ThemeModeToggle, ThemeSelector, useTheme } from "@/themes";
import { LanguageSelector, resolveLocalized, useLocale, type LocaleId } from "@/i18n";
import { ALL_ENTRIES, DOC_GROUPS } from "./registry";
import { FOUNDATION_PAGES } from "./foundationPages";
import { GUIDE_SECTIONS, findGuide } from "./guidePages";
import { buildDocsNavigation, hashFromNavId, navIdFromRoute } from "./docsNavigation";
import { routeToHash, useHashRoute, type DocsRoute } from "./router";
import { docsSearchDestinations, docsSearchObjects } from "./docsSearchIndex";

function breadcrumb(route: DocsRoute, locale: LocaleId, navigate: (route: DocsRoute) => void): BreadcrumbItem[] {
  const tr = <T,>(value: Parameters<typeof resolveLocalized<T>>[0]) => resolveLocalized(value, locale);
  const root = {
    home: tr({ es: "Inicio", en: "Home" }),
    foundations: tr({ es: "Fundamentos", en: "Foundations" }),
    guides: tr({ es: "Guías", en: "Guides" }),
    components: tr({ es: "Componentes", en: "Components" }),
  };
  switch (route.kind) {
    case "home":
      return [{ label: root.home }];
    case "foundation":
      return [{ label: root.foundations }, { label: tr(FOUNDATION_PAGES.find((page) => page.id === route.id)?.label ?? route.id) }];
    case "guide": {
      const guide = findGuide(route.id);
      const section = GUIDE_SECTIONS.find((item) => item.id === guide?.section);
      return [{ label: tr(section?.label ?? root.guides) }, { label: tr(guide?.label ?? route.id) }];
    }
    case "group":
      return [{ label: root.components }, { label: tr(DOC_GROUPS.find((group) => group.id === route.id)?.label ?? route.id) }];
    case "component": {
      const entry = ALL_ENTRIES.find((item) => item.id === route.id);
      const group = DOC_GROUPS.find((item) => item.id === entry?.group);
      return [
        { label: root.components },
        group ? { label: tr(group.label), onClick: () => navigate({ kind: "group", id: group.id }) } : undefined,
        { label: entry?.name ?? route.id },
      ].filter((item): item is BreadcrumbItem => Boolean(item));
    }
  }
}

/**
 * `true` por debajo de `sm`. Una sola pregunta al navegador en vez de montar
 * dos rastros de migas y esconder uno con CSS: dos `nav` con la misma
 * etiqueta son dos navegaciones para un lector de pantalla.
 */
function useIsCompact(): boolean {
  const query = "(max-width: 639px)";
  const subscribe = React.useCallback((onChange: () => void) => {
    const media = window.matchMedia(query);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
}

/**
 * Al cambiar de página hay que volver arriba, y el shell no scrollea la
 * ventana sino un contenedor propio: esta marca invisible busca su scroller
 * más cercano y lo devuelve al principio. Vive aquí, en el consumidor, para
 * no añadirle al shell una API que solo necesita la doc.
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
 * El shell de la documentación es el shell del producto.
 *
 * No hay menú ni cabecera propios: se monta `AdminShell` con el árbol de la
 * doc (`docsNavigation.ts`), la búsqueda y los controles de tema en las
 * acciones del header, y las migas en el hueco que el shell reserva a la
 * pantalla montada. Todo lo que se ve alrededor del contenido —rail plegable,
 * menú de empresa, novedades, notificaciones, perfil, atmósfera del tema,
 * pie— es el mismo código que usa la aplicación, así que la doc es la primera
 * consumidora del sistema que documenta.
 */
export function DocsShell({ children }: { children: React.ReactNode }) {
  const { route, navigate: navigateRoute } = useHashRoute();
  const { resolvedMode, setMode } = useTheme();
  const { t, locale } = useLocale();
  const isCompact = useIsCompact();
  // En 390px las tres migas de un componente se metían por debajo de las
  // acciones del header, así que ahí solo se muestra el último tramo.
  const allCrumbs = breadcrumb(route, locale, navigateRoute);
  const crumbs = isCompact ? allCrumbs.slice(-1) : allCrumbs;

  const config = React.useMemo<ShellConfigOverrides>(
    () => ({
      brand: { productName: "Thema", tagline: "Sistema de diseño · v0.1" },
      navigation: buildDocsNavigation(locale),
      activeNavId: navIdFromRoute(route),
      onNavigate: (id, path) => {
        window.location.hash = path ?? hashFromNavId(id);
      },
      // La búsqueda ya la monta la cabecera del shell; aquí solo se le pasa
      // el índice de la doc.
      search: {
        objects: docsSearchObjects(locale),
        navigate: docsSearchDestinations(locale),
        placeholder: t("docs.searchPlaceholder"),
        triggerLabel: t("docs.searchTrigger"),
        scope: "Sistema de diseño · v0.1",
      },
      headerActions: (
        <>
          <ThemeSelector />
          <LanguageSelector />
          <ThemeModeToggle />
          {/*
            La salida a la aplicación de ejemplo, al final de la fila: es la
            única acción que no configura la doc sino que se va de ella. Es un
            enlace de verdad (no un `onClick`) para que se pueda abrir en otra
            pestaña, y la ruta está tras la guarda de sesión, así que sin
            sesión pasa antes por el login y vuelve aquí al entrar.
          */}
          <Button asChild className="gap-inline">
            <Link to="/dashboard" title={t("docs.openAppTitle")}>
              <AppWindow className="size-3.5" />
              {t("docs.openApp")}
            </Link>
          </Button>
        </>
      ),
      // La vista del sistema de diseño no tiene empresas que cambiar, ni
      // agente, ni novedades, ni sesión, ni ajustes, ni roles que asumir: ese
      // cromo del producto solo añadiría botones que no llevan a ninguna parte.
      chrome: {
        company: false,
        modeSwitch: false,
        news: false,
        help: false,
        notifications: false,
        profile: false,
        role: false,
        settings: false,
      },
      // Sin `promo`: la tarjeta del sidebar es opt-in (ver ShellConfig.promo) y
      // esta doc no tiene nada propio que anunciar cada vez que alguien la abre.
      // El modo lo manda el tema, no el shell: aquí el conmutador del header
      // y el del selector de tema tienen que mover la misma palanca.
      isDark: resolvedMode === "dark",
      onToggleDark: (isDark) => setMode(isDark ? "dark" : "light"),
    }),
    [route, resolvedMode, setMode, t, locale]
  );

  return (
    <AdminShell config={config}>
      <ShellHeaderSlot>
        <Breadcrumbs items={crumbs} className="min-w-0 max-w-[45vw] overflow-hidden whitespace-nowrap sm:max-w-none" />
      </ShellHeaderSlot>
      <ScrollToTop signal={routeToHash(route)} />
      {children}
    </AdminShell>
  );
}
