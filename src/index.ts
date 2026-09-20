/**
 * Punto de entrada de la librería: el sistema de diseño completo (componentes,
 * temas, iconos y utilidades) sin la aplicación de ejemplo ni la documentación.
 * Construye con `npm run build:lib`; el consumidor importa `thema-design-system`
 * y su hoja de estilos `thema-design-system/styles.css`.
 */
import "./styles/globals.css";

export * from "./components/ui/button";
export * from "./components/ui/badge";
export * from "./components/ui/card";
export * from "./components/ui/input";
export * from "./components/ui/label";
export * from "./components/ui/textarea";
export * from "./components/ui/select";
export * from "./components/ui/checkbox";
export * from "./components/ui/radio-group";
export * from "./components/ui/switch";
export * from "./components/ui/slider";
export * from "./components/ui/tabs";
export * from "./components/ui/table";
export * from "./components/ui/dialog";
export * from "./components/ui/alert-dialog";
export * from "./components/ui/sheet";
export * from "./components/ui/popover";
export * from "./components/ui/tooltip";
export * from "./components/ui/dropdown-menu";
export * from "./components/ui/hover-card";
export * from "./components/ui/command";
export * from "./components/ui/accordion";
export * from "./components/ui/alert";
export * from "./components/ui/avatar";
export * from "./components/ui/progress";
export * from "./components/ui/skeleton";
export * from "./components/ui/separator";
export * from "./components/ui/scroll-area";
export * from "./components/ui/pagination";
export * from "./components/ui/calendar";
export * from "./components/ui/carousel";
export * from "./components/ui/input-group";
export * from "./components/ui/magic-card";
export * from "./components/ui/border-beam";
export * from "./components/ui/moving-border-beam";
export * from "./components/ui/fluid-highlight";
export * from "./components/ui/sonner";
export * from "./components/ui/ThemaLogo";
export { StatusBadge as AnimatedStatusBadge, type StatusBadgeProps as AnimatedStatusBadgeProps, type StatusState } from "./components/status-badge";
export * from "./components/forms";
export * from "./components/selection";
export * from "./components/navigation";
export * from "./components/overlays";
export * from "./components/feedback";
export * from "./components/data-display";
export * from "./components/date";
export * from "./components/range";
export * from "./components/upload";
export * from "./components/media";
export * from "./components/charts";
export * from "./components/ai";
export * from "./components/ai-interaction";
export * from "./components/action-rail";
export * from "./components/layout";
export * from "./components/app-shell";
export * from "./components/utility";
export * from "./icons";
export * from "./themes";
export * from "./lib/tone";
export { cn } from "./lib/utils";
export * from "./lib/cascadeAnimation";
