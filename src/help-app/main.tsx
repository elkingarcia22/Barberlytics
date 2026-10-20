import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/geist";
import "@/styles/globals.css";
import { StandaloneHelpApp } from "./StandaloneHelpApp";

/**
 * La entrada del centro de ayuda solo. No tiene backend: el contenido sale del sitio publicado del
 * repo `centro-de-ayuda` (`VITE_HELP_BASE_URL`, por defecto GitHub Pages).
 */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StandaloneHelpApp />
  </StrictMode>
);
