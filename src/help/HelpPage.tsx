import * as React from "react";
import { cn } from "@/lib/utils";

interface HelpPageProps {
  children: React.ReactNode;
  /** `narrow` centra la página a 720 px (la de «no existe»); por defecto ocupa el ancho del marco. */
  narrow?: boolean;
}

/**
 * La columna de una página de ayuda. Sin fondo ni padding propios: el ancho y
 * el aire los pone el shell (`contentWidth`), igual que en las pantallas de la
 * app, y la atmósfera del tema se sigue viendo detrás. `PageShell` pintaba su
 * propio fondo y cortaba esa atmósfera con un rectángulo sólido.
 */
export function HelpPage({ children, narrow }: HelpPageProps) {
  return <div className={cn("flex w-full flex-col space-y-section", narrow && "mx-auto max-w-narrow")}>{children}</div>;
}
