import { Route, Routes } from "react-router";
import { HelpShell } from "./HelpShell";
import { HelpHomePage } from "./pages/HelpHomePage";
import { HelpSectionPage } from "./pages/HelpSectionPage";
import { HelpArticlePage } from "./pages/HelpArticlePage";
import { HelpSearchPage } from "./pages/HelpSearchPage";
import { HelpNotFoundPage } from "./pages/HelpNotFoundPage";
import "./help.css";

/**
 * El centro de ayuda, montado en `/ayuda/*`. Las rutas son las del contenido:
 * `/ayuda/<seccion>` y `/ayuda/<seccion>/<articulo>`, más `/ayuda/buscar?q=`.
 */
export function HelpApp({ standalone = false }: { standalone?: boolean }) {
  return (
    <HelpShell standalone={standalone}>
      <Routes>
        <Route index element={<HelpHomePage />} />
        <Route path="buscar" element={<HelpSearchPage />} />
        <Route path=":section" element={<HelpSectionPage />} />
        <Route path=":section/:article" element={<HelpArticlePage />} />
        <Route path="*" element={<HelpNotFoundPage />} />
      </Routes>
    </HelpShell>
  );
}
