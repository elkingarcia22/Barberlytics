import { defineConfig, devices } from "@playwright/test";

const PORT = 5197;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    locale: "es-CO",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_USE_MOCKS: "true",
      // El centro de ayuda se publica aparte y cambia con cada edición: en e2e
      // se lee un índice fijo que sirve el propio dev server, sin salir a la red.
      VITE_HELP_BASE_URL: `http://localhost:${PORT}/e2e/fixtures/help`,
    },
    timeout: 60_000,
  },
});
