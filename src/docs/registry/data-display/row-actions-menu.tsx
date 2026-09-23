import { Copy, Download, Pencil, Trash2 } from "lucide-react";
import { RowActionsMenu, type RowAction } from "@/components/data-display/RowActionsMenu";
import { defineEntry, definePlayground } from "../types";

const ACTIONS: readonly RowAction[] = [
  { id: "edit", label: "Editar", icon: <Pencil className="size-4" /> },
  { id: "duplicate", label: "Duplicar", icon: <Copy className="size-4" /> },
  { id: "export", label: "Exportar", icon: <Download className="size-4" /> },
  { id: "delete", label: "Eliminar", icon: <Trash2 className="size-4" />, tone: "danger" },
];

const ROWS = ["Plan trimestral 2026", "Seguimiento mensual 2026", "Revisión semestral 2026"];

/** Tres filas con su menú, para ver el botón donde de verdad vive. */
function RowsDemo({ actions = ACTIONS }: { actions?: readonly RowAction[] }) {
  return (
    <ul className="w-full max-w-md divide-y divide-border/60 overflow-hidden rounded-xl border border-border">
      {ROWS.map((name) => (
        <li key={name} className="flex items-center justify-between gap-3 bg-surface px-4 py-3">
          <span className="truncate text-sm text-text-primary">{name}</span>
          <RowActionsMenu rowLabel={name} actions={actions} />
        </li>
      ))}
    </ul>
  );
}

export const rowActionsMenuEntry = defineEntry({
  id: "row-actions-menu",
  name: "RowActionsMenu",
  group: "data-display",
  description:
    "El botón de acciones de una fila: lo que se puede hacer con ese registro sin pasar por marcarlo. Es la alternativa a las casillas cuando la lista se opera de una en una —un menú por fila en vez de un modelo de lote—, y es lo que pinta DataListBlock cuando quien mira elige «Menú en cada fila» en el panel de configuración.",
  importPath: 'import { RowActionsMenu } from "@/components/data-display"',
  sourcePath: "src/components/data-display/RowActionsMenu.tsx",
  status: "stable",
  tags: ["menú", "fila", "acciones"],
  playground: definePlayground({
    controls: {
      bloqueada: { type: "boolean", label: "Una acción bloqueada", default: false },
    },
    layout: "stretch",
    render: ({ bloqueada }) => (
      <RowsDemo
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
    code: ({ bloqueada }) => `<RowActionsMenu
  rowLabel={row.name}
  actions={[
    { id: "edit", label: "Editar", icon: <Pencil /> },
    { id: "duplicate", label: "Duplicar", icon: <Copy /> },${
      bloqueada
        ? '\n    { id: "delete", label: "Eliminar", icon: <Trash2 />, tone: "danger",\n      blockedReason: "Un proceso en curso no se puede eliminar." },'
        : '\n    { id: "delete", label: "Eliminar", icon: <Trash2 />, tone: "danger" },'
    }
  ]}
/>`,
  }),
  examples: [
    {
      id: "basic",
      title: "Una fila, sus acciones",
      description:
        "El botón nombra la fila que opera —«Acciones de Plan trimestral 2026»— en vez de ser un «⋯» anónimo repetido en cada línea, que con un lector de pantalla no dice nada.",
      layout: "stretch",
      code: `<RowActionsMenu rowLabel={row.name} actions={acciones} />`,
      render: () => <RowsDemo />,
    },
    {
      id: "blocked",
      title: "Lo que no se puede ahora",
      description:
        "Con `blockedReason` la acción se queda a la vista y apagada, con el motivo en el título. Esconderla deja preguntándose si existe; explicarla contesta.",
      layout: "stretch",
      code: `{ id: "delete", label: "Eliminar", tone: "danger",
  blockedReason: "Un proceso en curso no se puede eliminar." }`,
      render: () => (
        <RowsDemo
          actions={ACTIONS.map((action) =>
            action.id === "delete"
              ? { ...action, blockedReason: "Un proceso en curso no se puede eliminar." }
              : action
          )}
        />
      ),
    },
  ],
  props: [
    { name: "actions", type: "RowAction[]", description: "Lo que se puede hacer con la fila. Con la lista vacía el botón no se pinta: un menú sin nada dentro es peor que no tenerlo." },
    { name: "RowAction", type: "{ id; label; icon?; tone?; blockedReason?; onSelect? }", description: "Mismo contrato que las acciones de la barra flotante, para declarar una vez y pintar en los dos sitios." },
    { name: "rowLabel", type: "string", description: "Qué fila se opera. Entra en el `aria-label` del botón para que no sea un «⋯» sin dueño." },
    { name: "className", type: "string", description: "Clases del botón disparador." },
  ],
  guidelines: {
    do: [
      "Pasa `rowLabel` siempre: es lo único que distingue un botón de otro para quien navega con lector de pantalla.",
      "Pon `tone: \"danger\"` en lo destructivo y déjalo al final de la lista.",
      "Usa `blockedReason` en vez de quitar la acción cuando no aplica en ese estado.",
    ],
    dont: [
      "No lo mezcles con casillas en la misma tabla: o se opera en lote o se opera de una en una.",
      "No metas ahí acciones que afectan a toda la pantalla; esas van en la cabecera o en la barra flotante.",
    ],
  },
  related: ["data-list-block", "data-list-action-rail", "table-config", "list-item"],
});
