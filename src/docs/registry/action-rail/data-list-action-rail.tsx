import { CheckCircle2, Copy, Download, GitCompare, Pencil, Plus, Settings2, Trash2, Upload } from "lucide-react";
import { DataListActionRail, type RailActionSpec } from "@/components/action-rail";
import { defineEntry, definePlayground } from "../types";
import { DemoTable, RAIL_ICON, useDemoSelection } from "./railDemo";

const ACTIONS: readonly RailActionSpec[] = [
  { id: "compare", label: "Comparar", icon: <GitCompare className={RAIL_ICON} strokeWidth={2} />, scope: ["screen"] },
  { id: "import", label: "Cargar", icon: <Download className={RAIL_ICON} strokeWidth={2} />, scope: ["screen"] },
  { id: "rules", label: "Reglas del ciclo", icon: <Settings2 className={RAIL_ICON} strokeWidth={2} />, scope: ["screen"], overflow: true },
  { id: "create", label: "Crear proceso", icon: <Plus className="size-4" strokeWidth={2.5} />, scope: ["screen"], primary: true },
  { id: "edit", label: "Editar", icon: <Pencil className={RAIL_ICON} strokeWidth={2} />, scope: ["single"] },
  { id: "duplicate", label: "Duplicar", icon: <Copy className={RAIL_ICON} strokeWidth={2} />, scope: ["single", "bulk"], countInLabel: true },
  { id: "export", label: "Exportar", icon: <Upload className={RAIL_ICON} strokeWidth={2} />, scope: ["single", "bulk"], countInLabel: true },
  { id: "close", label: "Cerrar", icon: <CheckCircle2 className={RAIL_ICON} strokeWidth={2} />, scope: ["single", "bulk"], countInLabel: true },
  { id: "delete", label: "Eliminar", icon: <Trash2 className={RAIL_ICON} strokeWidth={2} />, scope: ["single", "bulk"], tone: "danger", countInLabel: true },
];

/** Una tabla de mentira y la barra de verdad: marcar filas cambia lo que ofrece. */
function RailDemo({ actions = ACTIONS, inlineLimit }: { actions?: readonly RailActionSpec[]; inlineLimit?: number }) {
  const { selected, toggle, clear } = useDemoSelection([]);
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <DemoTable
        selected={selected}
        onToggle={toggle}
        className="w-full max-w-sm rounded-xl border border-border/60 bg-surface p-2"
      />
      <p className="text-xs text-text-muted">
        {selected.length === 0
          ? "Sin nada marcado: las acciones de la pantalla."
          : selected.length === 1
            ? "Un registro: entran también las que solo valen para uno."
            : "Varios: se caen las individuales y el recuento pasa a la etiqueta."}
      </p>
      <DataListActionRail
        actions={actions}
        selectedCount={selected.length}
        onClearSelection={clear}
        inlineLimit={inlineLimit}
      />
    </div>
  );
}

export const dataListActionRailEntry = defineEntry({
  id: "data-list-action-rail",
  name: "DataListActionRail",
  group: "action-rail",
  description:
    "La barra flotante de una pantalla con lista, ya cableada: concentra todo lo que se puede hacer y cambia de contenido según lo marcado. Por debajo de 1024px se vuelve un solo botón flotante que despliega las mismas acciones hacia arriba, con la principal destacada —el reparto lo decide el mismo código, así que girar el teléfono no cambia lo que se puede hacer. Sin selección muestra las acciones de la pantalla y su primaria; con un registro esas desaparecen —no se apilan— y entran el recuento y lo que se puede hacer con él; con varios se caen las individuales y el recuento pasa a la etiqueta. Quien la usa declara las acciones y su ámbito; los modos, el escalonado de entrada y el plegado los resuelve la barra.",
  importPath: 'import { DataListActionRail } from "@/components/action-rail"',
  sourcePath: "src/components/action-rail/DataListActionRail.tsx",
  status: "stable",
  tags: ["barra", "selección", "acciones"],
  playground: definePlayground({
    controls: {
      inlineLimit: { type: "number", label: "Acciones antes de plegar", default: 5, min: 2, max: 8, step: 1 },
    },
    layout: "stretch",
    render: ({ inlineLimit }) => <RailDemo inlineLimit={inlineLimit} />,
    code: ({ inlineLimit }) => `<DataListActionRail
  selectedCount={selected.size}
  onClearSelection={() => setSelected(new Set())}
  inlineLimit={${inlineLimit}}
  actions={[
    { id: "create", label: "Crear proceso", icon: <Plus />, scope: ["screen"], primary: true },
    { id: "edit", label: "Editar", icon: <Pencil />, scope: ["single"] },
    { id: "duplicate", label: "Duplicar", icon: <Copy />, scope: ["single", "bulk"], countInLabel: true },
    { id: "delete", label: "Eliminar", icon: <Trash2 />, scope: ["single", "bulk"], tone: "danger", countInLabel: true },
  ]}
/>`,
  }),
  examples: [
    {
      id: "modes",
      title: "Los tres modos",
      description:
        "Marca una fila y luego otra. Al cambiar de contexto la barra vuelve a animar sus acciones: sin ese redisparo el cambio se lee como un intercambio silencioso de iconos y pasa desapercibido.",
      layout: "stretch",
      frameClassName: "min-h-[320px]",
      code: `<DataListActionRail
  actions={ACCIONES}
  selectedCount={selected.size}
  onClearSelection={clear}
/>`,
      render: () => <RailDemo />,
    },
    {
      id: "tiers",
      title: "Los tres pesos de una pantalla",
      description:
        "Sin nada marcado las acciones no valen lo mismo, y la fila va de menor a mayor peso: abre el «⋯» con lo que se configura una vez —aquí «Reglas del ciclo», con `overflow`—, siguen las de a diario y la principal la cierra. Con la lista plana, crear y configurar compiten por la misma mirada.",
      layout: "stretch",
      frameClassName: "min-h-[320px]",
      code: `<DataListActionRail
  actions={[
    { id: "compare", label: "Comparar", icon: <GitCompare />, scope: ["screen"] },
    { id: "rules", label: "Reglas del ciclo", icon: <Settings2 />, scope: ["screen"], overflow: true },
    { id: "create", label: "Crear proceso", icon: <Plus />, scope: ["screen"], primary: true },
  ]}
  …
/>`,
      render: () => <RailDemo />,
    },
    {
      id: "overflow",
      title: "Cuando no caben",
      description:
        "Con `inlineLimit={2}` lo que sobra se pliega en un menú «más». Si sobrara una sola acción no se plegaría: un menú de un ítem cuesta más que un icono de más.",
      layout: "stretch",
      frameClassName: "min-h-[320px]",
      code: `<DataListActionRail actions={ACCIONES} inlineLimit={2} … />`,
      render: () => <RailDemo inlineLimit={2} />,
    },
  ],
  props: [
    { name: "—", type: "responsive", description: "No hay nada que configurar: por debajo de 1024px —el mismo corte que vuelve el sidebar un cajón— la barra se sustituye sola por `ActionFab`, el botón flotante. Se puede montar `ActionFab` a mano donde no haya barra." },
    { name: "actions", type: "RailActionSpec[]", description: "Lo que se puede hacer, declarado una vez. Cada una dice su `scope`, y la barra elige cuáles enseña." },
    { name: "RailActionSpec.scope", type: '("screen" | "single" | "bulk")[]', description: "`screen` sin selección; `single` solo con un registro; `bulk` con varios. Duplicar suele ser `[\"single\", \"bulk\"]`." },
    { name: "RailActionSpec.primary", type: "boolean", description: "La acción rellena que cierra la fila. Solo una, y solo con `scope: [\"screen\"]`." },
    { name: "RailActionSpec.overflow", type: "boolean", description: "La pliega en el menú «más acciones» en vez de darle sitio en la barra. Es para lo que se configura una vez —un alta de catálogo, una regla—: sigue estando, pero no compite con lo que se hace a diario. El plegado por `inlineLimit` es otra cosa: aquel es por sitio, este es por peso." },
    { name: "RailActionSpec.filter / active", type: "boolean / boolean", description: "Un filtro rápido de la pantalla («Sin confirmar»), no una acción: no sale en la barra hasta que alguien lo elige en «Editar acciones» (ajustes de la barra), y entonces se enciende y se apaga desde ahí. `active` lo pinta pulsado. Sigue también en el panel de Filtros de la pantalla. Se declara con `railFilterAction({ id, label, icon, active, onToggle })`." },
    { name: "RailActionSpec.tone", type: '"default" | "danger"', default: '"default"', description: "`danger` tiñe la acción destructiva." },
    { name: "RailActionSpec.countInLabel", type: "boolean", description: "Añade el recuento a la etiqueta con varios marcados: «Duplicar (3)»." },
    { name: "RailActionSpec.blockedReason", type: "string | null", description: "Por qué no se puede ahora. La deja a la vista y apagada, con el motivo: explicar vale más que esconder." },
    { name: "selectedCount", type: "number", description: "Cuántos registros hay marcados. Es lo único que decide el modo." },
    { name: "onClearSelection", type: "() => void", description: "La ✕ del recuento: suelta las marcas sin tocar las filas." },
    { name: "gender", type: '"f" | "m"', default: '"m"', description: "Concordancia del recuento: «3 seleccionadas» frente a «3 seleccionados»." },
    { name: "inlineLimit", type: "number", default: "5", description: "Cuántas caben antes de plegarse al menú «más»." },
    { name: "locked", type: "boolean", default: "false", description: "Una decisión inmersiva se adueñó de una fila: la barra se desmonta en vez de ofrecer algo que no viene a cuento." },
    { name: "layoutKey", type: "string", description: "Con qué nombre se guarda la elección de «Editar acciones». Por defecto, la ruta de la pantalla con los ids cambiados por `:id`: la ficha de un cliente y la de otro comparten elección." },
    { name: "isBlocked", type: "boolean", default: "false", description: "Un panel modal tomó la pantalla: la barra se recoge a su pastilla y deja de responder. Vuelve sola al cerrarlo." },
  ],
  guidelines: {
    do: [
      "Deja que la selección *sustituya* las acciones de la pantalla; apilarlas obliga a leer dos grupos para encontrar uno.",
      "Marca como `single` lo que de verdad solo vale para un registro: abrirlo, renombrarlo, ver su detalle.",
      "Usa `countInLabel` en lo que actúa sobre todo lo marcado, para que se lea a cuántos va a afectar antes de pulsar.",
      "Si la barra manda, deja la cabecera de la pantalla sin botones: tenerlos en los dos sitios es tenerlos duplicados.",
      "Marca con `overflow` lo que se configura una vez y se olvida: así la barra enseña de un vistazo lo que de verdad se hace a diario.",
      "Declara como `filter` los filtros que alguien querría tener a un toque: así se pueden elegir en «Editar acciones» sin ocupar sitio de serie.",
      "Prueba la pantalla estrecha: ahí las acciones pasan al botón flotante y las etiquetas se leen enteras, así que una etiqueta larga se nota antes que en la barra.",
    ],
    dont: [
      "No pongas más de una acción `primary`: la fila se cierra con una sola y dos compiten.",
      "No escondas una acción que no se puede usar ahora; dale `blockedReason` y explica por qué.",
      "No la montes en una pantalla sin selección ni acciones propias: ahí la barra es un marco vacío.",
      "No pliegues con `overflow` una sola acción: un menú de un ítem cuesta más de abrir que el icono que sustituye.",
    ],
  },
  related: ["action-rail-shell", "rail-button", "rail-selection-chip", "rail-overflow-menu", "data-list-block"],
});
