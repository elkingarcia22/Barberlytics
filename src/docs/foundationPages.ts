import { Droplets, Languages, Palette, Ruler, Shapes, Sparkles, Square, Stamp, Type, type LucideIcon } from "lucide-react";
import type { Localized } from "@/i18n";

export interface FoundationPage {
  id: string;
  label: Localized;
  /** Una línea de qué decide ese fundamento; la usa la portada. */
  description: Localized;
  /** `LucideIcon` y no un componente genérico: el árbol del shell lo exige. */
  icon: LucideIcon;
}

export const FOUNDATION_PAGES: readonly FoundationPage[] = [
  {
    id: "brand",
    label: { es: "Marca", en: "Brand" },
    description: { es: "El logotipo: qué dice, cómo está construido y cómo sigue al tema.", en: "The logo: what it says, how it is built and how it follows the theme." },
    icon: Stamp,
  },
  {
    id: "themes",
    label: { es: "Temas", en: "Themes" },
    description: { es: "Once presets, el personalizado y cómo se arma uno nuevo.", en: "Eleven presets, the custom one and how to build a new one." },
    icon: Palette,
  },
  {
    id: "colors",
    label: { es: "Colores y tokens", en: "Colors and tokens" },
    description: { es: "La escala semántica y de dónde sale cada color.", en: "The semantic scale and where each color comes from." },
    icon: Droplets,
  },
  {
    id: "typography",
    label: { es: "Tipografía", en: "Typography" },
    description: { es: "La escala como componentes, sin tamaños a mano.", en: "The scale as components, with no hand-set sizes." },
    icon: Type,
  },
  {
    id: "radius",
    label: { es: "Radios y sombras", en: "Radii and shadows" },
    description: { es: "Las cuatro curvas y los tres niveles de elevación.", en: "The four curves and the three elevation levels." },
    icon: Square,
  },
  {
    id: "spacing",
    label: { es: "Espaciado", en: "Spacing" },
    description: { es: "El ritmo de la página y las tres densidades.", en: "The rhythm of the page and the three densities." },
    icon: Ruler,
  },
  {
    id: "icons",
    label: { es: "Iconos", en: "Icons" },
    description: { es: "El registro semántico: pides un concepto, no un archivo.", en: "The semantic registry: you ask for a concept, not a file." },
    icon: Shapes,
  },
  {
    id: "language",
    label: { es: "Idioma", en: "Language" },
    description: {
      es: "Un interruptor para toda la interfaz, y dónde acaba el sistema y empieza tu app.",
      en: "One switch for the whole interface, and where the system ends and your app begins.",
    },
    icon: Languages,
  },
  {
    id: "motion",
    label: { es: "Motion", en: "Motion" },
    description: { es: "Duraciones, curvas y cómo se respeta reducir movimiento.", en: "Durations, easings and how reduced motion is honored." },
    icon: Sparkles,
  },
];
