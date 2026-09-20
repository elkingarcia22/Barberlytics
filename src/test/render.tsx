import * as React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/themes";
import { createQueryClient } from "@/lib/query";
import { AuthProvider, createMemoryTokenStorage, type TokenStorage } from "@/features/auth";

export interface AppRenderOptions extends Omit<RenderOptions, "wrapper"> {
  /** Ruta inicial del MemoryRouter. */
  route?: string;
  /** Token inicial; `null` = sin sesión. */
  token?: string | null;
  storage?: TokenStorage;
}

/**
 * `render` con todos los providers de la app y un QueryClient sin reintentos,
 * para que un error de red falle rápido en vez de esperar los backoffs.
 */
export function renderWithProviders(ui: React.ReactElement, { route = "/", token = null, storage, ...options }: AppRenderOptions = {}) {
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({ queries: { retry: false, gcTime: 0 }, mutations: { retry: false } });
  const tokenStorage = storage ?? createMemoryTokenStorage(token);

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <AuthProvider storage={tokenStorage}>
              <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return { ...render(ui, { wrapper: Wrapper, ...options }), queryClient, tokenStorage };
}

export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
