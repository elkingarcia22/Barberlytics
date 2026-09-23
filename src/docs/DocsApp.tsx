import { DocsShell } from "./DocsShell";
import { useHashRoute } from "./router";
import { findEntry, findGroup } from "./registry";
import { ComponentPage } from "./components/ComponentPage";
import { HomePage } from "./pages/HomePage";
import { GroupPage } from "./pages/GroupPage";
import { BrandPage } from "./pages/BrandPage";
import { ThemesPage } from "./pages/ThemesPage";
import { ColorsPage } from "./pages/ColorsPage";
import { TypographyPage } from "./pages/TypographyPage";
import { RadiusPage } from "./pages/RadiusPage";
import { SpacingPage } from "./pages/SpacingPage";
import { IconsPage } from "./pages/IconsPage";
import { MotionPage } from "./pages/MotionPage";
import { LanguagePage } from "./pages/LanguagePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ComoUsarPage } from "./pages/guides/ComoUsarPage";
import { FlujoDeTrabajoPage } from "./pages/guides/FlujoDeTrabajoPage";
import { TrabajarConIaPage } from "./pages/guides/TrabajarConIaPage";
import { BotonesPage } from "./pages/guides/BotonesPage";
import { VentanasPage } from "./pages/guides/VentanasPage";
import { EstadosPage } from "./pages/guides/EstadosPage";
import { FormulariosPage } from "./pages/guides/FormulariosPage";

function RouteView() {
  const { route } = useHashRoute();
  switch (route.kind) {
    case "home":
      return <HomePage />;
    case "group": {
      const group = findGroup(route.id);
      return group ? <GroupPage group={group} /> : <NotFoundPage />;
    }
    case "component": {
      const entry = findEntry(route.id);
      return entry ? <ComponentPage entry={entry} /> : <NotFoundPage />;
    }
    case "guide":
      switch (route.id) {
        case "como-usar":
          return <ComoUsarPage />;
        case "flujo-de-trabajo":
          return <FlujoDeTrabajoPage />;
        case "trabajar-con-ia":
          return <TrabajarConIaPage />;
        case "botones":
          return <BotonesPage />;
        case "ventanas":
          return <VentanasPage />;
        case "estados":
          return <EstadosPage />;
        case "formularios":
          return <FormulariosPage />;
        default:
          return <NotFoundPage />;
      }
    case "foundation":
      switch (route.id) {
        case "brand":
          return <BrandPage />;
        case "themes":
          return <ThemesPage />;
        case "colors":
          return <ColorsPage />;
        case "typography":
          return <TypographyPage />;
        case "radius":
          return <RadiusPage />;
        case "spacing":
          return <SpacingPage />;
        case "icons":
          return <IconsPage />;
        case "motion":
          return <MotionPage />;
        case "language":
          return <LanguagePage />;
        default:
          return <NotFoundPage />;
      }
  }
}

/**
 * La documentación. Los providers (tema, tooltips, toasts, sesión) los pone
 * la app en `src/app/providers.tsx`; aquí solo va el shell de docs.
 */
export function DocsApp() {
  return (
    <DocsShell>
      <RouteView />
    </DocsShell>
  );
}
