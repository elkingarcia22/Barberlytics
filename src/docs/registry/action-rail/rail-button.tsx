import * as React from "react";
import { Copy, Download, FileText, Filter, Plus, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { AnimatedActionItem, RailButton, RailCreateOption, RailPrimaryAction, type RailOrientation } from "@/components/action-rail";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { defineEntry, definePlayground } from "../types";
import { RAIL_ICON, RailBar } from "./railDemo";

const TONES = ["default", "danger"] as const;
const ORIENTATIONS = ["horizontal", "vertical"] as const;

/** El botón primario abre su popover de creación con dos RailCreateOption. */
function CreateMenuDemo({ orientation = "horizontal" }: { orientation?: RailOrientation }) {
  const [open, setOpen] = React.useState(false);
  const [created, setCreated] = React.useState<string | null>(null);
  const choose = (kind: string) => {
    setCreated(kind);
    setOpen(false);
  };
  return (
    <div className="flex flex-col items-center gap-3">
      <RailBar orientation={orientation}>
        <RailButton icon={<Download className={RAIL_ICON} strokeWidth={2} />} label="Exportar" onClick={() => undefined} />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <RailPrimaryAction icon={<Plus className="size-4" strokeWidth={2.5} />} label="Crear encuesta" />
          </PopoverTrigger>
          <PopoverContent
            side={orientation === "vertical" ? "left" : "top"}
            align="end"
            sideOffset={12}
            collisionPadding={16}
            className="w-72 flex-col gap-0 rounded-2xl border-white/10 bg-surface-nav p-2 shadow-rail"
          >
            <RailCreateOption icon={<FileText className={RAIL_ICON} strokeWidth={2} />} title="Desde cero" description="Una encuesta en blanco, pregunta a pregunta." onClick={() => choose("Desde cero")} />
            <RailCreateOption icon={<Sparkles className={RAIL_ICON} strokeWidth={2} />} title="Con IA" description="Describe el objetivo y la IA propone las preguntas." onClick={() => choose("Con IA")} />
          </PopoverContent>
        </Popover>
      </RailBar>
      <p className="text-xs text-text-muted">{created ? `Elegiste: ${created}` : "Pulsa «Crear encuesta»"}</p>
    </div>
  );
}

/** Tres acciones que entran escalonadas; el botón re-dispara la animación subiendo animKey. */
function StaggerDemo() {
  const [animKey, setAnimKey] = React.useState(0);
  const actions = [
    { icon: Download, label: "Exportar" },
    { icon: Copy, label: "Duplicar" },
    { icon: Trash2, label: "Eliminar", tone: "danger" as const },
  ];
  return (
    <div className="flex flex-col items-center gap-3">
      <RailBar className="relative">
        {actions.map((action, index) => (
          <AnimatedActionItem key={action.label} animKey={animKey} staggerIndex={index}>
            <RailButton icon={<action.icon className={RAIL_ICON} strokeWidth={2} />} label={action.label} tone={action.tone} onClick={() => undefined} />
          </AnimatedActionItem>
        ))}
      </RailBar>
      <button
        type="button"
        onClick={() => setAnimKey((value) => value + 1)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary transition-colors hover:bg-surface-subtle"
      >
        <RotateCcw className="size-3.5" /> Repetir entrada (animKey = {animKey})
      </button>
    </div>
  );
}

export const railButtonEntry = defineEntry({
  id: "rail-button",
  name: "RailButton",
  group: "action-rail",
  description:
    "Las piezas con las que una pantalla llena su barra flotante: el botón de icono (RailButton), la única acción rellena que admite la barra (RailPrimaryAction), la fila de un popover de creación (RailCreateOption) y el envoltorio que hace entrar cada acción escalonada (AnimatedActionItem). Todas leen la orientación del shell para saber si se ponen de pie y hacia dónde abrir su tooltip.",
  importPath: 'import { RailButton, RailPrimaryAction, RailCreateOption, AnimatedActionItem } from "@/components/action-rail"',
  sourcePath: "src/components/action-rail/RailButton.tsx",
  status: "stable",
  tags: ["tooltip", "orientation-aware"],
  playground: definePlayground({
    controls: {
      orientation: { type: "select", options: ORIENTATIONS, default: "horizontal" },
      tone: { type: "select", options: TONES, default: "default" },
      label: { type: "text", default: "Eliminar" },
      blocked: { type: "boolean", label: "Con blockedReason", default: false },
      withPrimary: { type: "boolean", label: "Con RailPrimaryAction", default: true },
    },
    render: ({ orientation, tone, label, blocked, withPrimary }) => (
      <RailBar orientation={orientation as RailOrientation}>
        <RailButton icon={<Download className={RAIL_ICON} strokeWidth={2} />} label="Exportar" onClick={() => undefined} />
        <RailButton
          icon={<Trash2 className={RAIL_ICON} strokeWidth={2} />}
          label={label}
          tone={tone as (typeof TONES)[number]}
          blockedReason={blocked ? "Selecciona al menos una fila" : null}
          onClick={() => undefined}
        />
        {withPrimary && <RailPrimaryAction icon={<Plus className="size-4" strokeWidth={2.5} />} label="Crear" />}
      </RailBar>
    ),
    code: ({ tone, label, blocked, withPrimary }) => {
      const attrs = [
        `icon={<Trash2 />}`,
        `label="${label}"`,
        tone !== "default" ? `tone="${tone}"` : "",
        blocked ? 'blockedReason="Selecciona al menos una fila"' : "",
        "onClick={remove}",
      ]
        .filter(Boolean)
        .join(" ");
      const primary = withPrimary ? `\n<RailPrimaryAction icon={<Plus />} label="Crear" />` : "";
      return `<RailButton icon={<Download />} label="Exportar" onClick={exportAll} />\n<RailButton ${attrs} />${primary}`;
    },
  }),
  examples: [
    {
      id: "tones",
      title: "Tonos y bloqueo",
      description: "El tono `danger` es para acciones destructivas. Con `blockedReason` el botón se desactiva y el tooltip explica por qué en vez de repetir el rótulo.",
      code: `<RailButton icon={<Download />} label="Exportar" onClick={exportAll} />
<RailButton icon={<Trash2 />} label="Eliminar" tone="danger" onClick={remove} />
<RailButton icon={<Filter />} label="Filtrar" blockedReason="No hay filtros para esta vista" onClick={noop} />`,
      render: () => (
        <RailBar>
          <RailButton icon={<Download className={RAIL_ICON} strokeWidth={2} />} label="Exportar" onClick={() => undefined} />
          <RailButton icon={<Trash2 className={RAIL_ICON} strokeWidth={2} />} label="Eliminar" tone="danger" onClick={() => undefined} />
          <RailButton icon={<Filter className={RAIL_ICON} strokeWidth={2} />} label="Filtrar" blockedReason="No hay filtros para esta vista" onClick={() => undefined} />
        </RailBar>
      ),
    },
    {
      id: "primary",
      title: "RailPrimaryAction en cada eje",
      description: "Tumbada, la acción primaria lleva su rótulo; de pie no hay sitio y el rótulo pasa al tooltip, pero sigue siendo el único botón relleno.",
      code: `<RailPrimaryAction icon={<Plus />} label="Crear encuesta" />`,
      render: () => (
        <div className="flex flex-wrap items-center justify-center gap-8">
          <RailBar>
            <RailButton icon={<Download className={RAIL_ICON} strokeWidth={2} />} label="Exportar" onClick={() => undefined} />
            <RailPrimaryAction icon={<Plus className="size-4" strokeWidth={2.5} />} label="Crear encuesta" />
          </RailBar>
          <RailBar orientation="vertical">
            <RailButton icon={<Download className={RAIL_ICON} strokeWidth={2} />} label="Exportar" onClick={() => undefined} />
            <RailPrimaryAction icon={<Plus className="size-4" strokeWidth={2.5} />} label="Crear encuesta" />
          </RailBar>
        </div>
      ),
    },
    {
      id: "create-option",
      title: "Popover de creación con RailCreateOption",
      description: "RailPrimaryAction reenvía su ref, así que puede ser el `PopoverTrigger asChild`. Cada RailCreateOption es una fila con icono, título y una línea de por qué.",
      code: `<Popover open={open} onOpenChange={setOpen}>
  <PopoverTrigger asChild>
    <RailPrimaryAction icon={<Plus />} label="Crear encuesta" />
  </PopoverTrigger>
  <PopoverContent side={popoutSide} align="end" className="w-72 bg-surface-nav p-2">
    <RailCreateOption icon={<FileText />} title="Desde cero" description="Una encuesta en blanco." onClick={createBlank} />
    <RailCreateOption icon={<Sparkles />} title="Con IA" description="La IA propone las preguntas." onClick={createWithAi} />
  </PopoverContent>
</Popover>`,
      render: () => <CreateMenuDemo />,
    },
    {
      id: "animated",
      title: "AnimatedActionItem",
      description: "Envuelve cada acción contextual: entra con un rebote escalonado por `staggerIndex` y un destello de color. Sube `animKey` para repetir la entrada.",
      code: `{actions.map((action, index) => (
  <AnimatedActionItem key={action.id} animKey={animKey} staggerIndex={index}>
    <RailButton icon={action.icon} label={action.label} onClick={action.run} />
  </AnimatedActionItem>
))}`,
      render: () => <StaggerDemo />,
    },
  ],
  props: [
    { name: "icon", type: "React.ReactNode", description: "El icono del botón. Usa 20px con `strokeWidth={2}` para igualar el resto de la barra." },
    { name: "label", type: "string", description: "Rótulo accesible; se muestra en el tooltip." },
    { name: "onClick", type: "() => void", description: "La acción. No se dispara mientras haya `blockedReason`." },
    { name: "blockedReason", type: "string | null", default: "null", description: "Explica por qué la acción no está disponible; con valor, el botón se desactiva y el tooltip muestra el motivo." },
    { name: "tone", type: '"default" | "danger"', default: '"default"', description: "Color del botón; `danger` para acciones destructivas." },
    { name: "RailPrimaryAction", type: '{ icon; label } & ComponentProps<"button">', description: "La única acción rellena de la barra. Reenvía ref y props sueltas para poder ser trigger de un popover. De pie, el rótulo pasa al tooltip." },
    { name: "RailCreateOption", type: "{ icon; title; description; onClick }", description: "Fila de un popover de creación: icono en tile, título en negrita y una descripción corta." },
    { name: "AnimatedActionItem", type: "{ animKey: number; staggerIndex: number; skipColorFlash?: boolean }", description: "Entrada escalonada para una acción contextual. `skipColorFlash` evita el destello en chips y divisorias." },
  ],
  guidelines: {
    do: [
      "Una sola RailPrimaryAction por barra: es el botón al que apunta la pantalla.",
      "Usa `blockedReason` en vez de ocultar el botón; la barra mantiene su forma y la persona entiende qué le falta.",
      "Envuelve solo las acciones contextuales con AnimatedActionItem; las persistentes no entran ni salen.",
    ],
    dont: [
      "No cambies el tamaño de icono por botón: 20px en todos, o la barra pierde su ritmo.",
      "No uses `tone=\"danger\"` para acciones reversibles como limpiar una selección.",
      "No pongas RailCreateOption fuera de un popover oscuro: sus colores asumen el fondo `surface-nav`.",
    ],
  },
  related: ["action-rail-shell", "confirm-action-popover", "rail-overflow-menu", "rail-selection-chip"],
});
