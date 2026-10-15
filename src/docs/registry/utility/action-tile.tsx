import { ActionTile, IconTile } from "@/components/utility";
import { ThemaIcon } from "@/icons";
import { defineEntry, definePlayground } from "../types";

function PlaygroundDemo({ tone, layout }: { tone: "default" | "dashed" | "accent"; layout: "row" | "stacked" }) {
  return (
    <div className="w-full max-w-xs">
      <ActionTile
        tone={tone}
        layout={layout}
        leading={<IconTile size="md" shape={layout === "stacked" ? "circle" : "rounded"} icon={<ThemaIcon name={layout === "stacked" ? "mail" : "plus"} />} />}
        title={layout === "stacked" ? "Enviar recibo" : "Agregar otra cita"}
        description={layout === "stacked" ? "Por correo o mensaje" : "Para ti otro día, o para alguien que viene contigo."}
      />
    </div>
  );
}

function GridDemo() {
  const actions = [
    { icon: "mail", title: "Enviar recibo", description: "Por correo o mensaje" },
    { icon: "calendarAdd", title: "Agregar al calendario", description: "Google, Apple u Outlook" },
    { icon: "refresh", title: "Dejarla fija", description: "Cada tantas semanas" },
    { icon: "info", title: "Ver detalle", description: "Todo lo de tu cita" },
  ] as const;
  return (
    <div className="grid w-full max-w-sm grid-cols-2 gap-2">
      {actions.map((action) => (
        <ActionTile key={action.title} layout="stacked" leading={<IconTile size="md" shape="circle" icon={<ThemaIcon name={action.icon} />} />} title={action.title} description={action.description} />
      ))}
    </div>
  );
}

export const actionTileEntry = defineEntry({
  id: "action-tile",
  name: "ActionTile",
  group: "utility",
  description:
    "Una tarjeta pulsable con icono, título y una pista: «Agregar otra cita», «Enviar recibo», «Avísame si se libera una hora». Es la acción secundaria que ocupa su propio sitio sin ser un botón. Tres tonos —neutro, punteada y de marca— y dos disposiciones, en fila o apilada para ponerlas en rejilla.",
  importPath: 'import { ActionTile } from "@/components/utility"',
  sourcePath: "src/components/utility/ActionTile.tsx",
  status: "stable",
  tags: ["card", "action", "tile", "booking"],
  playground: definePlayground({
    controls: {
      tone: { type: "select", label: "Tono", options: ["default", "dashed", "accent"], default: "accent" },
      layout: { type: "select", label: "Disposición", options: ["row", "stacked"], default: "row" },
    },
    render: ({ tone, layout }) => <PlaygroundDemo tone={tone as "default" | "dashed" | "accent"} layout={layout as "row" | "stacked"} />,
    code: ({ tone, layout }) => `<ActionTile
  ${tone !== "default" ? `tone="${tone}"\n  ` : ""}${layout !== "row" ? `layout="${layout}"\n  ` : ""}leading={<IconTile size="md" icon={<ThemaIcon name="plus" />} />}
  title="Agregar otra cita"
  description="Para ti otro día, o para alguien que viene contigo."
  onClick={addAnother}
/>`,
  }),
  examples: [
    {
      id: "grid",
      title: "En rejilla, apiladas",
      description: "Con `layout=\"stacked\"` el icono va arriba y no hay flecha: lo que se puede hacer con una cita ya confirmada.",
      layout: "start",
      code: `<div className="grid grid-cols-2 gap-2">
  {actions.map((action) => (
    <ActionTile key={action.id} layout="stacked" leading={<IconTile … />} title={action.title} description={action.description} onClick={action.onClick} />
  ))}
</div>`,
      render: () => <GridDemo />,
    },
  ],
  props: [
    { name: "title", type: "ReactNode", description: "Lo que hace." },
    { name: "description", type: "ReactNode", description: "Una pista, o varias líneas apiladas." },
    { name: "leading", type: "ReactNode", description: "Un IconTile (a la izquierda; arriba en `stacked`)." },
    { name: "tone", type: '"default" | "dashed" | "accent"', default: '"default"', description: "Neutro, punteada (opcional) o de marca (algo que se suma)." },
    { name: "layout", type: '"row" | "stacked"', default: '"row"', description: "En fila, o apilada para rejillas." },
    { name: "chevron", type: "boolean", description: "La flecha de la derecha; por defecto solo en `row`." },
    { name: "href", type: "string", description: "Si se pasa, es un enlace en vez de un botón." },
  ],
  guidelines: {
    do: ["Úsala para acciones secundarias que no deben competir con el botón principal.", "Mantén el título en un verbo («Agregar», «Enviar») y la pista en una línea."],
    dont: ["No la uses para elegir entre opciones: para eso, SelectableRow o MagicCard con SelectMark.", "No pongas dos tonos de marca juntos: pierde su lugar."],
  },
  related: ["button", "selectable-row", "icon-tile", "magic-card"],
});
