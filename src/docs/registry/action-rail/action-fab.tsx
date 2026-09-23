import { CheckCircle2, Copy, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { ActionFab, type RailActionSpec } from "@/components/action-rail";
import { defineEntry, definePlayground } from "../types";
import { DemoTable, useDemoSelection } from "./railDemo";

const ICON = "size-5";

const ACTIONS: readonly RailActionSpec[] = [
  { id: "import", label: "Cargar", icon: <Upload className={ICON} strokeWidth={2} />, scope: ["screen"] },
  { id: "create", label: "Crear proceso", icon: <Plus className="size-4" strokeWidth={2.5} />, scope: ["screen"], primary: true },
  { id: "edit", label: "Editar", icon: <Pencil className={ICON} strokeWidth={2} />, scope: ["single"] },
  { id: "duplicate", label: "Duplicar", icon: <Copy className={ICON} strokeWidth={2} />, scope: ["single", "bulk"], countInLabel: true },
  { id: "close", label: "Cerrar", icon: <CheckCircle2 className={ICON} strokeWidth={2} />, scope: ["single", "bulk"], countInLabel: true },
  { id: "delete", label: "Eliminar", icon: <Trash2 className={ICON} strokeWidth={2} />, scope: ["single", "bulk"], tone: "danger", countInLabel: true },
];

/** Un teléfono de mentira: el botón vive anclado abajo a la derecha, como en la app. */
function FabDemo({ actions = ACTIONS }: { actions?: readonly RailActionSpec[] }) {
  const { selected, toggle, clear } = useDemoSelection([]);
  return (
    <div className="relative mx-auto h-[420px] w-full max-w-[320px] overflow-hidden rounded-2xl border border-border bg-background p-4">
      <DemoTable selected={selected} onToggle={toggle} className="w-full" />
      <p className="mt-stack text-xs text-text-muted">
        {selected.length === 0
          ? "Marca una fila para ver cómo cambia lo que ofrece."
          : "El botón lleva el recuento; ábrelo para ver sus acciones."}
      </p>
      <div className="absolute inset-x-0 bottom-0">
        <ActionFab actions={actions} selectedCount={selected.length} onClearSelection={clear} />
      </div>
    </div>
  );
}

export const actionFabEntry = defineEntry({
  id: "action-fab",
  name: "ActionFab",
  group: "action-rail",
  description:
    "La barra de acciones cuando no hay sitio para una barra: un solo botón en la esquina que, al tocarlo, despliega hacia arriba todo lo que se puede hacer, con la acción principal la primera y destacada. Cerrado enseña el icono de esa acción principal —o el recuento, si hay algo marcado—, y abierto se convierte en la ✕ que lo cierra. No hace falta montarlo a mano: DataListActionRail lo pone solo por debajo de 1024px.",
  importPath: 'import { ActionFab } from "@/components/action-rail"',
  sourcePath: "src/components/action-rail/ActionFab.tsx",
  status: "stable",
  tags: ["móvil", "flotante", "acciones"],
  playground: definePlayground({
    controls: {
      bloqueada: { type: "boolean", label: "Una acción bloqueada", default: false },
    },
    layout: "stretch",
    render: ({ bloqueada }) => (
      <FabDemo
        actions={
          bloqueada
            ? ACTIONS.map((action) =>
                action.id === "delete"
                  ? { ...action, blockedReason: "Un proceso en curso no se puede eliminar." }
                  : action
              )
            : ACTIONS
        }
      />
    ),
    code: () => `<ActionFab
  actions={acciones}
  selectedCount={selected.size}
  onClearSelection={() => setSelected(new Set())}
/>`,
  }),
  examples: [
    {
      id: "modes",
      title: "Lo mismo que la barra, en otra forma",
      description:
        "Marca una fila y luego otra: reparte las acciones con las mismas reglas que la barra de escritorio. Girar el teléfono no puede cambiar lo que se puede hacer, así que el reparto lo decide el mismo código en los dos sitios.",
      layout: "stretch",
      frameClassName: "min-h-[460px]",
      code: `<ActionFab actions={acciones} selectedCount={selected.size} onClearSelection={clear} />`,
      render: () => <FabDemo />,
    },
  ],
  props: [
    { name: "actions", type: "RailActionSpec[]", description: "Las mismas que recibe la barra, con su `scope`. Si ninguna aplica, el botón no se pinta: un botón que no ofrece nada estorba." },
    { name: "selectedCount", type: "number", description: "Cuántos registros hay marcados. Decide el reparto y, cerrado, lo que enseña el botón." },
    { name: "onClearSelection", type: "() => void", description: "Soltar la selección, que aparece como primera entrada del abanico cuando hay algo marcado." },
    { name: "gender", type: '"f" | "m"', default: '"m"', description: "Concordancia del recuento: «soltar 3 seleccionadas» frente a «3 seleccionados»." },
    { name: "className", type: "string", description: "Clases del contenedor anclado." },
  ],
  guidelines: {
    do: [
      "Déjalo dentro del ancla del rail del shell: se posiciona solo abajo a la derecha, sobre el contenido.",
      "Cuida que las etiquetas sean cortas: aquí se leen enteras junto al icono, no en un tooltip.",
      "Deja la acción principal marcada con `primary`: es la que da cara al botón cerrado.",
    ],
    dont: [
      "No lo montes a la vez que la barra: `DataListActionRail` ya elige uno u otro según el ancho.",
      "No le cuelgues diez acciones: un abanico largo tapa la pantalla y obliga a estirar el pulgar.",
    ],
  },
  related: ["data-list-action-rail", "action-rail-shell", "rail-button"],
});
