import { RailDivider } from "@/components/action-rail";
import { defineEntry, definePlayground } from "../types";
import { BlockedShellDemo, ContextKeyDemo, RailOrientationKnob, ShellDemo } from "./actionRailShellDemo";
import { RailBar } from "./railDemo";
import { Download, Plus, Trash2 } from "lucide-react";
import { RailButton, RailPrimaryAction } from "@/components/action-rail";

const ORIENTATIONS = ["horizontal", "vertical"] as const;

const FULL_RAIL_CODE = `const animKey = useContextChangeKey(hasSelection ? "selection" : "none");
const popoutSide = useRailPopoutSide();

<ActionRailShell
  keepOpen={hasSelection}
  contextual={
    hasSelection ? (
      <>
        <RailGroupShimmer animKey={animKey} />
        <AnimatedActionItem animKey={animKey} staggerIndex={0} skipColorFlash>
          <RailSelectionChip count={selected.length} onClear={clear} />
        </AnimatedActionItem>
        <AnimatedActionItem animKey={animKey} staggerIndex={1}>
          <RailButton icon={<Copy />} label="Duplicar" onClick={duplicate} />
        </AnimatedActionItem>
        <AnimatedActionItem animKey={animKey} staggerIndex={2}>
          <RailButton icon={<Trash2 />} label="Eliminar" tone="danger" onClick={remove} />
        </AnimatedActionItem>
      </>
    ) : null
  }
  persistent={
    <>
      <RailButton icon={<Download />} label="Exportar" onClick={exportAll} />
      <RailButton icon={<Filter />} label="Filtrar" blockedReason="No hay filtros para esta vista" onClick={noop} />
      <Popover>
        <PopoverTrigger asChild>
          <RailPrimaryAction icon={<Plus />} label="Crear encuesta" />
        </PopoverTrigger>
        <PopoverContent side={popoutSide} align="end" className="w-72 bg-surface-nav p-2">
          <RailCreateOption icon={<FileText />} title="Desde cero" description="Una encuesta en blanco." onClick={createBlank} />
          <RailCreateOption icon={<Sparkles />} title="Con IA" description="La IA propone las preguntas." onClick={createWithAi} />
        </PopoverContent>
      </Popover>
    </>
  }
/>`;

export const actionRailShellEntry = defineEntry({
  id: "action-rail-shell",
  name: "ActionRailShell",
  group: "action-rail",
  description:
    "La barra de acciones flotante que comparten todas las pantallas: una sola pastilla que se abre, se recoge, se arrastra y recuerda su orientación. Recibe dos slots —acciones contextuales de la selección y acciones persistentes de la pantalla— y pone por su cuenta el asa, el menú de ajustes y las divisorias.",
  importPath: 'import { ActionRailShell, RailDivider, RailGroupShimmer, useContextChangeKey } from "@/components/action-rail"',
  sourcePath: "src/components/action-rail/ActionRailShell.tsx",
  status: "stable",
  tags: ["framer-motion", "slots", "fixed"],
  playground: definePlayground({
    layout: "stretch",
    controls: {
      orientation: { type: "select", label: "Orientación (preferencia compartida)", options: ORIENTATIONS, default: "horizontal" },
      withSelection: { type: "boolean", label: "Con fila seleccionada", default: true },
      keepOpen: { type: "boolean", label: "keepOpen", default: false },
      isBlocked: { type: "boolean", label: "isBlocked", default: false },
    },
    render: ({ orientation, withSelection, keepOpen, isBlocked }) => (
      <>
        <RailOrientationKnob orientation={orientation as (typeof ORIENTATIONS)[number]} />
        <ShellDemo key={String(withSelection)} startSelected={withSelection} keepOpen={keepOpen} isBlocked={isBlocked} height={320} />
      </>
    ),
    code: ({ orientation, withSelection, keepOpen, isBlocked }) => {
      const attrs = [
        `contextual={${withSelection ? "<SelectionActions />" : "null"}}`,
        "persistent={<ScreenActions />}",
        keepOpen ? "keepOpen" : "",
        isBlocked ? "isBlocked" : "",
      ]
        .filter(Boolean)
        .join("\n  ");
      const preference =
        orientation === "vertical"
          ? '// La orientación es una preferencia compartida (localStorage):\nsetRailOrientation("vertical");\n\n'
          : "";
      return `${preference}<ActionRailShell\n  ${attrs}\n/>`;
    },
  }),
  examples: [
    {
      id: "full-rail",
      title: "Barra completa con selección",
      description:
        "Marca filas de la tabla: el grupo contextual entra con stagger (AnimatedActionItem), la barra brilla (RailGroupShimmer) y se queda abierta mientras haya selección (keepOpen). El botón primario abre un popover con RailCreateOption.",
      layout: "stretch",
      code: FULL_RAIL_CODE,
      render: () => <ShellDemo />,
    },
    {
      id: "blocked",
      title: "Bloqueada por un panel modal",
      description:
        "Con `isBlocked` la barra se recoge a su pastilla y deja de responder al cursor, aunque haya selección. Al cerrar el panel vuelve sola.",
      layout: "stretch",
      code: `const [panelOpen, setPanelOpen] = React.useState(false);

<ActionRailShell
  contextual={<SelectionActions />}
  persistent={<ScreenActions />}
  keepOpen
  isBlocked={panelOpen}
/>`,
      render: () => <BlockedShellDemo />,
    },
    {
      id: "context-key",
      title: "useContextChangeKey y RailGroupShimmer",
      description:
        "La clave sube cada vez que cambia el contexto que se le pasa; pásala como `animKey` para re-disparar el stagger y el brillo sin remontar la barra.",
      code: `const animKey = useContextChangeKey(context);

<RailGroupShimmer animKey={animKey} />
<AnimatedActionItem animKey={animKey} staggerIndex={0}>
  <RailButton icon={<Download />} label="Acción 1" onClick={run} />
</AnimatedActionItem>`,
      render: () => <ContextKeyDemo />,
    },
    {
      id: "divider",
      title: "RailDivider",
      description: "La regla fina entre grupos. Se dibuja en el eje que toque: vertical en una barra horizontal y viceversa.",
      code: `<RailButton icon={<Download />} label="Exportar" onClick={exportAll} />
<RailDivider />
<RailButton icon={<Trash2 />} label="Eliminar" tone="danger" onClick={remove} />
<RailDivider />
<RailPrimaryAction icon={<Plus />} label="Crear" />`,
      render: () => (
        <RailBar>
          <RailButton icon={<Download className="h-[20px] w-[20px]" strokeWidth={2} />} label="Exportar" onClick={() => undefined} />
          <RailDivider />
          <RailButton icon={<Trash2 className="h-[20px] w-[20px]" strokeWidth={2} />} label="Eliminar" tone="danger" onClick={() => undefined} />
          <RailDivider />
          <RailPrimaryAction icon={<Plus className="size-4" strokeWidth={2.5} />} label="Crear" />
        </RailBar>
      ),
    },
  ],
  props: [
    { name: "persistent", type: "React.ReactNode", description: "Acciones que la pantalla ofrece siempre. Van al final de la barra." },
    { name: "contextual", type: "React.ReactNode", default: "null", description: "Acciones que dependen de la selección actual. Con `null` el grupo y su divisoria desaparecen del todo." },
    { name: "keepOpen", type: "boolean", default: "false", description: "Mantiene la barra abierta aunque la preferencia sea auto-ocultar. Enciéndelo mientras exista una selección." },
    { name: "isBlocked", type: "boolean", default: "false", description: "Recoge la barra a su pastilla y la deja inerte; para cuando un panel modal ocupa la pantalla." },
    { name: "RailDivider", type: "() => JSX.Element", description: "Regla fina entre grupos; lee la orientación del contexto del shell." },
    { name: "RailGroupShimmer", type: "{ animKey: number }", description: "Brillo que recorre la barra cuando cambia el grupo contextual. Necesita un ancestro `relative`." },
    { name: "useContextChangeKey", type: "(context: string) => number", description: "Devuelve una clave que sube cada vez que `context` cambia; alimenta `animKey`." },
  ],
  guidelines: {
    do: [
      "Monta un solo shell por pantalla y cambia solo su contenido; para el lector es la misma barra en todas partes.",
      "Pasa `keepOpen` mientras haya selección: una acción que necesita filas marcadas no puede desaparecer al mover el cursor.",
      "Deriva `contextual` a `null` cuando no hay nada marcado; no dejes botones apagados colgando.",
    ],
    dont: [
      "No pongas ajustes de la barra (orientación, auto-ocultar) entre las acciones: ya viven en RailSettingsMenu.",
      "No reimplementes la pastilla, el asa o la divisoria en una pantalla; extiende el shell.",
      "No la renderices dentro de un contenedor que hace scroll: usa el anclaje `ShellRailSlot` del AdminShell.",
    ],
  },
  related: ["rail-button", "rail-selection-chip", "rail-settings-menu", "rail-drag-handle", "admin-shell"],
});
