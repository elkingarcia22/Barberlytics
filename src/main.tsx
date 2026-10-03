import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/geist";
import "./styles/globals.css";
import { env } from "./lib/api/env";
import { authApi } from "./features/auth/api";
import { sessionTokenStorage } from "./features/auth/tokenStorage";
import App from "./App";

async function openDevSession() {
  if (sessionTokenStorage.get()) return;
  try {
    const session = await authApi.loginWithProvider("google", "dev-session");
    sessionTokenStorage.set(session.accessToken);
  } catch {
    /* sin sesión de desarrollo se muestra el login de siempre */
  }
}

/**
 * Con `env.useMocks` el backend simulado (MSW) arranca antes del primer
 * render, así ninguna petición se escapa hacia una API que no existe.
 */
async function bootstrap() {
  if (env.useMocks) {
    const { worker } = await import("./mocks/browser");
    await worker.start({ onUnhandledRequest: "bypass", quiet: true });
    // En desarrollo no hay que pasar por el login: se abre la sesión de la
    // cuenta de pruebas y se cae directo en Métricas. Solo con mocks y solo en dev.
    if (import.meta.env.DEV) await openDevSession();
  }
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

void bootstrap();
