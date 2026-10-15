import * as React from "react";
import { SelectMark } from "@/components/selection";
import { defineEntry, definePlayground } from "../types";

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2">
      {children}
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  );
}

function StatesDemo() {
  return (
    <div className="flex items-start gap-8">
      <Labeled label="Círculo, vacío">
        <SelectMark kind="radio" />
      </Labeled>
      <Labeled label="Círculo, elegido">
        <SelectMark kind="radio" checked />
      </Labeled>
      <Labeled label="Casilla, vacía">
        <SelectMark kind="checkbox" />
      </Labeled>
      <Labeled label="Casilla, elegida">
        <SelectMark kind="checkbox" checked />
      </Labeled>
    </div>
  );
}

export const selectMarkEntry = defineEntry({
  id: "select-mark",
  name: "SelectMark",
  group: "selection",
  description:
    "La marca de elegir de las opciones que no son un control nativo —tarjetas y filas con foto, texto y acciones—: un círculo si se elige una opción y una casilla si se pueden varias, vacía mientras no se elige y rellena con su check al elegirla. Es lo que hace que sedes, servicios y barberos se lean como la misma familia, sean tarjetas o filas de una lista.",
  importPath: 'import { SelectMark } from "@/components/selection"',
  sourcePath: "src/components/selection/SelectMark.tsx",
  status: "stable",
  tags: ["primitive", "selection", "radio", "checkbox"],
  playground: definePlayground({
    controls: {
      kind: { type: "select", label: "Forma", options: ["radio", "checkbox"], default: "radio" },
      checked: { type: "boolean", label: "Elegida", default: true },
      size: { type: "select", label: "Tamaño", options: ["default", "sm"], default: "default" },
    },
    render: ({ kind, checked, size }) => <SelectMark kind={kind as "radio" | "checkbox"} checked={checked} size={size as "default" | "sm"} />,
    code: ({ kind, checked, size }) => `<SelectMark kind="${kind}"${checked ? " checked" : ""}${size === "sm" ? ' size="sm"' : ""} />`,
  }),
  examples: [
    {
      id: "states",
      title: "Formas y estados",
      description: "Círculo para una sola opción (sede, barbero) y casilla para varias (servicios).",
      layout: "start",
      code: `<SelectMark kind="radio" />
<SelectMark kind="radio" checked />
<SelectMark kind="checkbox" />
<SelectMark kind="checkbox" checked />`,
      render: () => <StatesDemo />,
    },
  ],
  props: [
    { name: "kind", type: '"radio" | "checkbox"', default: '"radio"', description: "Círculo (una opción) o casilla (varias)." },
    { name: "checked", type: "boolean", default: "false", description: "Elegida: relleno de marca con su check." },
    { name: "size", type: '"default" | "sm"', default: '"default"', description: "24 px o 20 px." },
    { name: "className", type: "string", description: "Solo para ubicarla (márgenes, posición)." },
  ],
  guidelines: {
    do: [
      "Ponla dentro del botón que ya lleva `role` y `aria-checked`: ella solo dibuja el estado.",
      "Úsala igual en tarjetas y en filas: el cliente lee la misma marca en cada paso.",
    ],
    dont: [
      "No la uses suelta como control: no es focusable ni anuncia nada.",
      "No pongas un radio nativo al lado: la marca ya es el indicador.",
    ],
  },
  related: ["selectable-row", "checkbox", "radio-group", "selectable-card"],
});
