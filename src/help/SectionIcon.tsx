import * as React from "react";
import { sectionIcon } from "./sectionIcons";

/**
 * El icono de una sección como elemento. Se crea con `createElement` y no
 * como `<Icon />` de una variable local: así React no ve un componente nuevo
 * en cada render.
 */
export function SectionIcon({ name, className }: { name: string | undefined; className?: string }) {
  return React.createElement(sectionIcon(name), { className });
}
