import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/geist";
import "./styles/globals.css";
import { env } from "./lib/api/env";
import { authApi } from "./features/auth/api";
import { sessionTokenStorage } from "./features/auth/tokenStorage";

async function openDevSession() {
  if (sessionTokenStorage.get()) return;
  try {
    const session = await authApi.loginWithProvider("google", "dev-session");
    sessionTokenStorage.set(session.accessToken);
  } catch {
    /* sin sesión de desarrollo se muestra el login de siempre */
  }
}

/** Cuentas de la demo pública (`/demo?rol=…`), una por rol del equipo. */
const DEMO_PHONES: Record<string, string> = {
  dueno: "+573001234567",
  recepcion: "+573005550103",
  comision: "+573005550104",
  renta: "+573005550130",
};
const DEMO_OTP = "246810";

/**
 * Demo pública: `/demo?rol=recepcion&ir=/calendario` abre la sesión de prueba de
 * ese rol (solo con el backend simulado) y deja al visitante en la pantalla
 * pedida. Lo que cambie vive solo en su pestaña.
 */
async function openDemoSession() {
  const params = new URLSearchParams(location.search);
  const phone = DEMO_PHONES[params.get("rol") ?? "dueno"] ?? DEMO_PHONES.dueno;
  const target = params.get("ir") ?? "/calendario";
  sessionTokenStorage.clear();
  try {
    const session = await authApi.verifyCode({ phone, code: DEMO_OTP });
    sessionTokenStorage.set(session.accessToken);
  } catch {
    /* si falla, se muestra el login de siempre */
  }
  history.replaceState(null, "", target.startsWith("/") && !target.startsWith("//") ? target : "/calendario");
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
    if (location.pathname === "/demo") await openDemoSession();
    else if (import.meta.env.DEV) await openDevSession();
  }
  // La app (y su router) se carga después: así parte de la dirección final de la demo.
  const { default: App } = await import("./App");
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

void bootstrap();
