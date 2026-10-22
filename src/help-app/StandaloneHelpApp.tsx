import { QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import { APP_MESSAGES } from "@/app/i18n";
import { ThemaToaster } from "@/components/feedback";
import { TruncationTooltip } from "@/components/overlays";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelpApp } from "@/help/HelpApp";
import { LocaleProvider } from "@/i18n";
import { queryClient } from "@/lib/query";
import { ThemeProvider } from "@/themes";

/**
 * El centro de ayuda solo, sin el resto de la app: lo que se exporta al repo `ClientPortal`
 * (`npm run export:help`). Conserva las rutas `/ayuda/...` para que los enlaces entre artículos
 * sean los mismos que en la app; cualquier otra ruta lleva al inicio de la ayuda.
 */
const router = createBrowserRouter([
  { path: "/ayuda/*", element: <HelpApp standalone /> },
  { path: "*", element: <Navigate to="/ayuda" replace /> },
]);

export function StandaloneHelpApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider messages={APP_MESSAGES}>
        <ThemeProvider>
          <TooltipProvider delayDuration={200}>
            <RouterProvider router={router} />
            <ThemaToaster />
            <TruncationTooltip />
          </TooltipProvider>
        </ThemeProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}
