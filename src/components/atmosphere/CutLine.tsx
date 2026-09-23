import * as React from "react";

import { useReveal } from "@/hooks/useReveal";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";

export interface CutLineProps {
  className?: string;
}

/**
 * Separador entre secciones: unas tijeras cruzan la página y dejan la línea
 * continua convertida en línea de puntos. Arranca la primera vez que entra
 * en pantalla; la distancia del viaje se mide del propio elemento y se pasa
 * como `--cut-w` a la animación. Ocupa el ancho de su contenedor.
 */
export function CutLine({ className }: CutLineProps) {
  const ref = useReveal<HTMLDivElement>();
  const [width, setWidth] = React.useState(0);

  React.useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    setWidth(node.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return (
    <div
      ref={ref}
      aria-hidden
      data-slot="cut-line"
      className={cn("cut reveal w-full", className)}
      style={{ "--cut-w": `${width}px` } as React.CSSProperties}
    >
      <span className="cut-dashed" />
      <span className="cut-solid" />
      <span className="cut-scissors">
        <ThemaIcon name="scissors" size="md" tone="primary" className="cut-blades size-5" />
      </span>
    </div>
  );
}
