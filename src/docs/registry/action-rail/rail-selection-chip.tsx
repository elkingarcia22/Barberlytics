import { Copy, Trash2 } from "lucide-react";
import { RailButton, RailDivider, RailSelectionChip, type RailOrientation } from "@/components/action-rail";
import { defineEntry, definePlayground } from "../types";
import { DemoTable, RAIL_ICON, RailBar, useDemoSelection } from "./railDemo";

const ORIENTATIONS = ["horizontal", "vertical"] as const;
const GENDERS = ["f", "m"] as const;

/** La tabla y su chip: marcar filas cambia el conteo, la ✕ limpia la selección. */
function TableChipDemo({ orientation = "horizontal", gender = "f" }: { orientation?: RailOrientation; gender?: "f" | "m" }) {
  const { selected, toggle, clear } = useDemoSelection(["r1", "r3"]);
  const count = selected.length;
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <DemoTable selected={selected} onToggle={toggle} className="w-full max-w-sm rounded-xl border border-border/60 bg-surface p-2" />
      {count > 0 ? (
        <RailBar orientation={orientation}>
          <RailSelectionChip count={count} gender={gender} onClear={clear} />
          <RailDivider />
          <RailButton icon={<Copy className={RAIL_ICON} strokeWidth={2} />} label="Duplicar" onClick={clear} />
          <RailButton icon={<Trash2 className={RAIL_ICON} strokeWidth={2} />} label="Eliminar" tone="danger" onClick={clear} />
        </RailBar>
      ) : (
        <p className="text-xs text-text-muted">Sin selección: el grupo contextual desaparece de la barra.</p>
      )}
    </div>
  );
}

export const railSelectionChipEntry = defineEntry({
  id: "rail-selection-chip",
  name: "RailSelectionChip",
  group: "action-rail",
  description:
    "«N seleccionadas ✕»: el lector de selección que toda barra flotante muestra mientras una tabla tiene filas marcadas. Responde a cuántas filas afectará la siguiente acción y ofrece la salida de la selección sin buscar el checkbox que la empezó.",
  importPath: 'import { RailSelectionChip } from "@/components/action-rail"',
  sourcePath: "src/components/action-rail/RailSelectionChip.tsx",
  status: "stable",
  tags: ["tooltip", "orientation-aware"],
  playground: definePlayground({
    controls: {
      count: { type: "number", default: 3, min: 1, max: 999 },
      gender: { type: "select", label: "Género del sustantivo", options: GENDERS, default: "f" },
      orientation: { type: "select", options: ORIENTATIONS, default: "horizontal" },
    },
    render: ({ count, gender, orientation }) => (
      <RailBar orientation={orientation as RailOrientation}>
        <RailSelectionChip count={count} gender={gender as "f" | "m"} onClear={() => undefined} />
        <RailDivider />
        <RailButton icon={<Trash2 className={RAIL_ICON} strokeWidth={2} />} label="Eliminar" tone="danger" onClick={() => undefined} />
      </RailBar>
    ),
    code: ({ count, gender }) => {
      const attrs = [`count={${count}}`, gender !== "f" ? `gender="${gender}"` : "", "onClear={clearSelection}"].filter(Boolean).join(" ");
      return `<RailSelectionChip ${attrs} />`;
    },
  }),
  examples: [
    {
      id: "table",
      title: "Ligado a la selección de una tabla",
      description: "El chip encabeza el grupo contextual. Cuando la selección se vacía, la pantalla pasa `contextual={null}` al shell y el grupo entero desaparece.",
      code: `const contextual = selected.length > 0 ? (
  <>
    <RailSelectionChip count={selected.length} onClear={clear} />
    <RailDivider />
    <RailButton icon={<Copy />} label="Duplicar" onClick={duplicate} />
    <RailButton icon={<Trash2 />} label="Eliminar" tone="danger" onClick={remove} />
  </>
) : null;`,
      render: () => <TableChipDemo />,
    },
    {
      id: "gender",
      title: "Concordancia",
      description: "«3 seleccionadas» para encuestas, «3 seleccionados» para colaboradores. El singular también concuerda: «1 seleccionado».",
      code: `<RailSelectionChip count={3} onClear={clear} />
<RailSelectionChip count={3} gender="m" onClear={clear} />
<RailSelectionChip count={1} gender="m" onClear={clear} />`,
      render: () => (
        <div className="flex flex-wrap items-center justify-center gap-4">
          <RailBar>
            <RailSelectionChip count={3} onClear={() => undefined} />
          </RailBar>
          <RailBar>
            <RailSelectionChip count={3} gender="m" onClear={() => undefined} />
          </RailBar>
          <RailBar>
            <RailSelectionChip count={1} gender="m" onClear={() => undefined} />
          </RailBar>
        </div>
      ),
    },
    {
      id: "vertical",
      title: "De pie, el conteo es un badge",
      description: "No hay sitio para la frase: el número se queda en la barra y la oración completa pasa al tooltip.",
      code: `// Dentro de una barra vertical:
<RailSelectionChip count={12} gender="m" onClear={clear} />`,
      render: () => <TableChipDemo orientation="vertical" gender="m" />,
    },
  ],
  props: [
    { name: "count", type: "number", description: "Filas marcadas. Con 1 el rótulo va en singular." },
    { name: "onClear", type: "() => void", description: "Quita las marcas sin tocar las filas." },
    { name: "gender", type: '"f" | "m"', default: '"f"', description: "Género del sustantivo contado, para que el participio concuerde." },
    { name: "className", type: "string", description: "Clases extra del contenedor." },
  ],
  guidelines: {
    do: [
      "Ponlo siempre el primero del grupo contextual: el número explica a qué afectan los botones que le siguen.",
      "Pasa el género correcto; «3 seleccionadas colaboradores» se nota.",
      "Envuélvelo en AnimatedActionItem con `skipColorFlash`: es un lector, no una acción.",
    ],
    dont: [
      "No lo dejes montado con `count={0}`; retira el grupo contextual entero.",
      "No lo uses como botón de acción: la ✕ solo limpia la selección, nunca borra.",
    ],
  },
  related: ["action-rail-shell", "rail-button", "table-shell"],
});
