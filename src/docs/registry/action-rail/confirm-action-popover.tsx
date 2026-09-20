import * as React from "react";
import { Archive, Download, Send, Trash2 } from "lucide-react";
import {
  ConfirmActionPopover,
  RailButton,
  RailConfirmButton,
  railButtonClass,
  type ConfirmTone,
  type RailOrientation,
} from "@/components/action-rail";
import { defineEntry, definePlayground } from "../types";
import { DemoTable, RAIL_ICON, RailBar, useDemoSelection } from "./railDemo";

const CONFIRM_TONES = ["destructive", "warning", "primary"] as const;
const BUTTON_TONES = ["default", "danger"] as const;
const ORIENTATIONS = ["horizontal", "vertical"] as const;

/** Un RailConfirmButton suelto, con el resultado de la confirmación a la vista. */
function ConfirmButtonDemo({
  orientation = "horizontal",
  confirmTone = "destructive",
  tone = "danger",
  blocked = false,
}: {
  orientation?: RailOrientation;
  confirmTone?: ConfirmTone;
  tone?: "default" | "danger";
  blocked?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [confirmedAt, setConfirmedAt] = React.useState<string | null>(null);
  return (
    <div className="flex flex-col items-center gap-3">
      <RailBar orientation={orientation}>
        <RailButton icon={<Download className={RAIL_ICON} strokeWidth={2} />} label="Exportar" onClick={() => undefined} />
        <RailConfirmButton
          icon={<Trash2 className={RAIL_ICON} strokeWidth={2} />}
          label="Eliminar"
          tone={tone}
          blockedReason={blocked ? "Selecciona al menos una fila" : null}
          open={open}
          onOpenChange={setOpen}
          title="¿Eliminar las encuestas marcadas?"
          description="Se borran sus respuestas y no se pueden recuperar."
          confirmLabel="Eliminar"
          confirmTone={confirmTone}
          onConfirm={() => {
            setConfirmedAt(new Date().toLocaleTimeString());
            setOpen(false);
          }}
        />
      </RailBar>
      <p className="text-xs text-text-muted">{confirmedAt ? `Confirmado a las ${confirmedAt}` : "Pulsa el icono de eliminar"}</p>
    </div>
  );
}

/** La barra pregunta antes de eliminar las filas marcadas en la tabla. */
function TableConfirmDemo() {
  const { selected, toggle, clear } = useDemoSelection(["r2"]);
  const [open, setOpen] = React.useState(false);
  const [removed, setRemoved] = React.useState(0);
  const count = selected.length;
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <DemoTable selected={selected} onToggle={toggle} className="w-full max-w-sm rounded-xl border border-border/60 bg-surface p-2" />
      <RailBar>
        <RailConfirmButton
          icon={<Trash2 className={RAIL_ICON} strokeWidth={2} />}
          label="Eliminar"
          tone="danger"
          blockedReason={count === 0 ? "Marca al menos una encuesta" : null}
          open={open}
          onOpenChange={setOpen}
          title={count === 1 ? "¿Eliminar 1 encuesta?" : `¿Eliminar ${count} encuestas?`}
          description="Se borran sus respuestas y no se pueden recuperar."
          confirmLabel="Eliminar"
          confirmTone="destructive"
          onConfirm={() => {
            setRemoved((value) => value + count);
            clear();
            setOpen(false);
          }}
        />
      </RailBar>
      <p className="text-xs text-text-muted">Eliminadas en esta sesión: {removed}</p>
    </div>
  );
}

/** ConfirmActionPopover con un disparador propio: el botón con rótulo de un drawer. */
function DrawerTriggerDemo() {
  const [open, setOpen] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  return (
    <div className="flex flex-col items-center gap-3">
      <RailBar>
        <button type="button" className={railButtonClass("ghost", false)} onClick={() => setSent(false)}>
          <Archive className="size-4" strokeWidth={2.2} /> Guardar borrador
        </button>
        <ConfirmActionPopover
          open={open}
          onOpenChange={setOpen}
          title="¿Publicar la encuesta?"
          description="Los participantes recibirán la invitación de inmediato."
          confirmLabel="Publicar"
          tone="primary"
          onConfirm={() => {
            setSent(true);
            setOpen(false);
          }}
          trigger={
            <button type="button" className={railButtonClass("primary", false)}>
              <Send className="size-4" strokeWidth={2.2} /> Publicar
            </button>
          }
        />
      </RailBar>
      <p className="text-xs text-text-muted">{sent ? "Encuesta publicada" : "Borrador sin publicar"}</p>
    </div>
  );
}

export const confirmActionPopoverEntry = defineEntry({
  id: "confirm-action-popover",
  name: "ConfirmActionPopover",
  group: "action-rail",
  description:
    "El sí/no de una acción de la barra, anclado al botón que lo pide en vez de un diálogo centrado con velo. RailConfirmButton lo empaqueta con un botón de la barra que lleva tooltip y popover sobre el mismo elemento, y railButtonClass da las clases de un botón con rótulo para disparadores propios.",
  importPath: 'import { ConfirmActionPopover, RailConfirmButton, railButtonClass } from "@/components/action-rail"',
  sourcePath: "src/components/action-rail/ConfirmActionPopover.tsx",
  status: "stable",
  tags: ["popover", "controlled", "tooltip"],
  playground: definePlayground({
    controls: {
      orientation: { type: "select", options: ORIENTATIONS, default: "horizontal" },
      confirmTone: { type: "select", label: "confirmTone", options: CONFIRM_TONES, default: "destructive" },
      tone: { type: "select", label: "tone del botón", options: BUTTON_TONES, default: "danger" },
      blocked: { type: "boolean", label: "Con blockedReason", default: false },
    },
    render: ({ orientation, confirmTone, tone, blocked }) => (
      <ConfirmButtonDemo
        orientation={orientation as RailOrientation}
        confirmTone={confirmTone as ConfirmTone}
        tone={tone as "default" | "danger"}
        blocked={blocked}
      />
    ),
    code: ({ confirmTone, tone, blocked }) => {
      const attrs = [
        'icon={<Trash2 />}',
        'label="Eliminar"',
        tone !== "default" ? `tone="${tone}"` : "",
        blocked ? 'blockedReason="Selecciona al menos una fila"' : "",
        "open={open}",
        "onOpenChange={setOpen}",
        'title="¿Eliminar las encuestas marcadas?"',
        'description="Se borran sus respuestas y no se pueden recuperar."',
        'confirmLabel="Eliminar"',
        `confirmTone="${confirmTone}"`,
        "onConfirm={remove}",
      ]
        .filter(Boolean)
        .join("\n  ");
      return `const [open, setOpen] = React.useState(false);\n\n<RailConfirmButton\n  ${attrs}\n/>`;
    },
  }),
  examples: [
    {
      id: "table",
      title: "Confirmar sobre la selección",
      description: "El motivo de bloqueo cambia con la selección y el título cuenta las filas: la pregunta se hace con el contexto bajo el puntero.",
      code: `<RailConfirmButton
  icon={<Trash2 />}
  label="Eliminar"
  tone="danger"
  blockedReason={count === 0 ? "Marca al menos una encuesta" : null}
  open={open}
  onOpenChange={setOpen}
  title={\`¿Eliminar \${count} encuestas?\`}
  description="Se borran sus respuestas y no se pueden recuperar."
  confirmLabel="Eliminar"
  confirmTone="destructive"
  onConfirm={() => { removeSelected(); setOpen(false); }}
/>`,
      render: () => <TableConfirmDemo />,
    },
    {
      id: "custom-trigger",
      title: "Disparador propio con railButtonClass",
      description: "Para un botón con rótulo (el pie de un drawer) usa ConfirmActionPopover directo: el `trigger` debe ser un solo elemento del DOM, por eso va un `<button>` crudo con las clases compartidas.",
      code: `<ConfirmActionPopover
  open={open}
  onOpenChange={setOpen}
  title="¿Publicar la encuesta?"
  description="Los participantes recibirán la invitación de inmediato."
  confirmLabel="Publicar"
  tone="primary"
  onConfirm={publish}
  trigger={
    <button type="button" className={railButtonClass("primary", false)}>
      <Send className="size-4" /> Publicar
    </button>
  }
/>`,
      render: () => <DrawerTriggerDemo />,
    },
    {
      id: "vertical",
      title: "De pie, el popover abre hacia la izquierda",
      description: "Sin `side`, el popover y el tooltip usan `useRailPopoutSide`: arriba en una barra tumbada, a la izquierda en una vertical.",
      code: `// Dentro de una barra vertical no hace falta pasar side:
<RailConfirmButton icon={<Trash2 />} label="Eliminar" tone="danger" confirmTone="destructive" … />`,
      render: () => <ConfirmButtonDemo orientation="vertical" />,
    },
  ],
  props: [
    { name: "open / onOpenChange", type: "boolean / (open: boolean) => void", description: "Estado controlado del popover. Cierra tú mismo en `onConfirm`." },
    { name: "trigger", type: "React.ReactNode", description: "Solo en ConfirmActionPopover: un único elemento del DOM que recibe las props del trigger vía `asChild`." },
    { name: "title / description", type: "string", description: "La pregunta y su consecuencia, en una línea cada una." },
    { name: "confirmLabel", type: "string", description: "Texto del botón que confirma; el de cancelar siempre dice «Cancelar»." },
    { name: "tone (ConfirmActionPopover) / confirmTone (RailConfirmButton)", type: '"destructive" | "warning" | "primary"', description: "Color del botón de confirmar según la gravedad de la acción." },
    { name: "onConfirm", type: "() => void", description: "Se ejecuta al confirmar." },
    { name: "side", type: '"top" | "right" | "bottom" | "left"', default: "useRailPopoutSide()", description: "Solo en ConfirmActionPopover: hacia dónde abre; por defecto, lejos de la barra." },
    { name: "tooltip", type: "React.ReactNode", description: "Solo en ConfirmActionPopover: rótulo al pasar por encima cuando el disparador es un icono desnudo." },
    { name: "icon / label / tone / blockedReason", type: "RailButton props", description: "Solo en RailConfirmButton: el botón de la barra que dispara la pregunta. `tone` colorea el botón, no la confirmación." },
    { name: "railButtonClass(variant, iconOnly)", type: '("ghost" | "primary" | "warning" | "danger", boolean) => string', description: "Las clases del botón con rótulo de un drawer, para un `<button>` crudo que hace de trigger." },
  ],
  guidelines: {
    do: [
      "Pregunta solo cuando la acción es irreversible o afecta a varias filas; para el resto, actúa y ofrece deshacer.",
      "Pon el número de filas en el título: «¿Eliminar 3 encuestas?» dice más que «¿Estás seguro?».",
      "Cierra el popover en `onConfirm`; el componente no lo cierra por ti.",
    ],
    dont: [
      "No envuelvas el `trigger` en un Tooltip propio: usa la prop `tooltip`, o el popover nunca abrirá.",
      "No uses `confirmTone=\"primary\"` para borrar: el color anuncia la gravedad.",
      "No abras un ConfirmDialog centrado desde la barra; la decisión es sobre lo que ya está marcado y no necesita tapar la tabla.",
    ],
  },
  related: ["rail-button", "action-rail-shell", "drawer-action-rail", "confirm-dialog"],
});
