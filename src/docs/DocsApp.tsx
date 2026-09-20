import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemaToaster } from "@/components/feedback";
import { ThemeProvider } from "@/themes";
import { DocsShell } from "./DocsShell";
import { useHashRoute } from "./router";
import { findEntry, findGroup } from "./registry";
import { ComponentPage } from "./components/ComponentPage";
import { HomePage } from "./pages/HomePage";
import { GroupPage } from "./pages/GroupPage";
import { ThemesPage } from "./pages/ThemesPage";
import { ColorsPage } from "./pages/ColorsPage";
import { TypographyPage } from "./pages/TypographyPage";
import { RadiusPage } from "./pages/RadiusPage";
import { IconsPage } from "./pages/IconsPage";
import { MotionPage } from "./pages/MotionPage";
import { NotFoundPage } from "./pages/NotFoundPage";

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
    case "foundation":
      switch (route.id) {
        case "themes":
          return <ThemesPage />;
        case "colors":
          return <ColorsPage />;
        case "typography":
          return <TypographyPage />;
        case "radius":
          return <RadiusPage />;
        case "icons":
          return <IconsPage />;
        case "motion":
          return <MotionPage />;
        default:
          return <NotFoundPage />;
      }
  }
}

export function DocsApp() {
  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={200}>
        <DocsShell>
          <RouteView />
        </DocsShell>
        <ThemaToaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
