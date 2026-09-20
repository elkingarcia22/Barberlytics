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
 */
export function PreviewFrame({ children, layout = "center", className }: PreviewFrameProps) {
  return (
    <div
      className={cn(
        "docs-preview relative flex min-h-[180px] w-full overflow-x-auto rounded-xl border border-border/60 bg-background p-6",
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
