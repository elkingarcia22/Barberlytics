import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/geist";
import "./styles/globals.css";
import { env } from "./lib/api/env";
import App from "./App";

/**
 * Con `env.useMocks` el backend simulado (MSW) arranca antes del primer
 * render, así ninguna petición se escapa hacia una API que no existe.
 */
async function bootstrap() {
  if (env.useMocks) {
    const { worker } = await import("./mocks/browser");
    await worker.start({ onUnhandledRequest: "bypass", quiet: true });
  }
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

void bootstrap();
