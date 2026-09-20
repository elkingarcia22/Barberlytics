import type * as React from "react";
import { Droplets, Palette, Shapes, Sparkles, Square, Type } from "lucide-react";

export interface FoundationPage {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const FOUNDATION_PAGES: readonly FoundationPage[] = [
  { id: "themes", label: "Temas", icon: Palette },
  { id: "colors", label: "Colores y tokens", icon: Droplets },
  { id: "typography", label: "Tipografía", icon: Type },
  { id: "radius", label: "Radios y sombras", icon: Square },
  { id: "icons", label: "Iconos", icon: Shapes },
  { id: "motion", label: "Motion", icon: Sparkles },
];
