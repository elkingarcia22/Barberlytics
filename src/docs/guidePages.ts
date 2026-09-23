import type { Localized } from "@/i18n";
import {
  AppWindow,
  Bot,
  ClipboardList,
  Compass,
  FileText,
  MousePointerClick,
  Route,
  Workflow,
  type LucideIcon,
} from "lucide-react";

/**
 * Las guías: cómo se trabaja con el sistema y cómo se combinan las piezas.
 * Dos secciones, "Empezar" (reglas, flujo, la IA) y "Patrones" (botones,
 * ventanas, estados, formularios). Son páginas escritas, no componentes:
 * viven en `pages/guides/` y se enrutan por `#/guides/<id>`.
 */
export type GuideSectionId = "start" | "patterns";

export interface GuideSection {
  id: GuideSectionId;
  label: Localized;
  description: Localized;
  icon: LucideIcon;
}

export interface GuidePage {
  id: string;
  section: GuideSectionId;
  label: Localized;
  description: Localized;
  /** `LucideIcon` y no un componente genérico: el árbol del shell lo exige. */
  icon: LucideIcon;
}

export const GUIDE_SECTIONS: readonly GuideSection[] = [
  {
    id: "start",
    label: { es: "Empezar", en: "Get started" },
    description: { es: "Si es tu primera vez, arranca por aquí.", en: "If this is your first time, start here." },
    icon: Compass,
  },
  {
    id: "patterns",
    label: { es: "Patrones", en: "Patterns" },
    description: {
      es: "Cómo se combinan las piezas para resolver lo que se repite.",
      en: "How the pieces combine to solve what keeps coming up.",
    },
    icon: Workflow,
  },
];

export const GUIDE_PAGES: readonly GuidePage[] = [
  {
    id: "como-usar",
    section: "start",
    label: { es: "Cómo usar el sistema", en: "How to use the system" },
    description: { es: "Las cinco reglas y dónde está cada cosa.", en: "The five rules and where everything lives." },
    icon: ClipboardList,
  },
  {
    id: "flujo-de-trabajo",
    section: "start",
    label: { es: "Flujo de trabajo", en: "Workflow" },
    description: { es: "Cómo se suma una pantalla nueva, del archivo al enlace publicado.", en: "How a new screen gets added, from file to published link." },
    icon: Route,
  },
  {
    id: "trabajar-con-ia",
    section: "start",
    label: { es: "Trabajar con la IA", en: "Working with AI" },
    description: { es: "Qué sabe la IA de este proyecto y de dónde lo saca.", en: "What the AI knows about this project and where it gets it." },
    icon: Bot,
  },
  {
    id: "botones",
    section: "patterns",
    label: { es: "Botones", en: "Buttons" },
    description: { es: "Jerarquía, combinaciones y el botón de IA.", en: "Hierarchy, combinations and the AI button." },
    icon: MousePointerClick,
  },
  {
    id: "ventanas",
    section: "patterns",
    label: { es: "Modales y drawers", en: "Modals and drawers" },
    description: { es: "Cuándo una ventana, cuándo un panel, cuándo un aviso.", en: "When a window, when a panel, when an alert." },
    icon: AppWindow,
  },
  {
    id: "estados",
    section: "patterns",
    label: { es: "Estados y feedback", en: "States and feedback" },
    description: { es: "Vacíos, carga, avisos, confirmaciones y errores.", en: "Empty, loading, alerts, confirmations and errors." },
    icon: ClipboardList,
  },
  {
    id: "formularios",
    section: "patterns",
    label: { es: "Formularios", en: "Forms" },
    description: { es: "Anatomía del campo, validación y formularios largos.", en: "Field anatomy, validation and long forms." },
    icon: FileText,
  },
];

export function findGuide(id: string): GuidePage | undefined {
  return GUIDE_PAGES.find((page) => page.id === id);
}

export function guidesBySection(section: GuideSectionId): GuidePage[] {
  return GUIDE_PAGES.filter((page) => page.section === section);
}
