import * as React from "react";
import { cn } from "@/lib/utils";

export interface PreviewFrameProps {
  children: React.ReactNode;
  layout?: "center" | "stretch" | "start";
  className?: string;
}

/**
 * El lienzo donde se renderiza un componente: fondo de app con una retícula
 * de puntos muy tenue, para que una superficie blanca se distinga del marco
 * y un componente transparente no se pierda.
 *
 * No es una `<Card>` justamente por eso: necesita el fondo de aplicación
 * (`bg-background`), no la superficie de una card, para que la `<Card>` de una
 * demo se vea como se ve en un producto. El padding interior sí es el del
 * sistema (`p-card`), así que sigue a la densidad del tema.
 */
export function PreviewFrame({ children, layout = "center", className }: PreviewFrameProps) {
  return (
    <div
      className={cn(
        "docs-preview relative flex min-h-[180px] w-full overflow-x-auto rounded-xl border border-border/60 bg-background p-card",
        layout === "center" && "items-center justify-center",
        layout === "start" && "items-start justify-start",
        layout === "stretch" && "items-stretch justify-stretch [&>*]:w-full",
        className
      )}
    >
      {children}
    </div>
  );
}
