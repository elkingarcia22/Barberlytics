import type * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemaToaster } from "@/components/feedback";
import { ThemeProvider } from "@/themes";
import { LocaleProvider } from "@/i18n";
import { APP_MESSAGES } from "./i18n";
import { queryClient } from "@/lib/query";
import { AuthProvider } from "@/features/auth";

/**
 * Los providers globales, en el orden en que dependen unos de otros: la
 * caché de datos primero, el idioma y el tema después —los dos pintan la
 * interfaz y ninguno depende del otro—, la sesión al final (usa la caché
 * para limpiarla al cerrar sesión).
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider messages={APP_MESSAGES}>
        <ThemeProvider>
          <TooltipProvider delayDuration={200}>
            <AuthProvider>{children}</AuthProvider>
            <ThemaToaster />
          </TooltipProvider>
        </ThemeProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}
