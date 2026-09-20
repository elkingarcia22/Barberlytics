import * as React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { defineEntry, definePlayground } from "../types";

const SIZES = ["default", "sm"] as const;
type SwitchSize = (typeof SIZES)[number];

function LabelledSwitch() {
  const [checked, setChecked] = React.useState(true);
  return (
    <div className="flex items-center gap-3">
      <Switch id="switch-notify" checked={checked} onCheckedChange={setChecked} />
      <Label htmlFor="switch-notify">Notificarme por correo</Label>
      <span className="text-xs text-text-muted">{checked ? "Activado" : "Desactivado"}</span>
    </div>
  );
}

interface Setting {
  id: string;
  title: string;
  hint: string;
}

const SETTINGS: Setting[] = [
  { id: "anon", title: "Respuestas anónimas", hint: "Nadie podrá ver quién respondió." },
  { id: "remind", title: "Recordatorios automáticos", hint: "Un correo a quienes no han respondido, cada 3 días." },
  { id: "results", title: "Compartir resultados con el equipo", hint: "Visibles al cerrar la encuesta." },
];

function SettingsList() {
  const [enabled, setEnabled] = React.useState<Record<string, boolean>>({ anon: true, remind: false, results: true });
  const toggle = (id: string) => (value: boolean) => setEnabled((prev) => ({ ...prev, [id]: value }));
  return (
    <div className="w-full max-w-md divide-y divide-border/60 rounded-xl border border-border/60 bg-surface">
      {SETTINGS.map((setting) => (
        <div key={setting.id} className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex flex-col">
            <Label htmlFor={`switch-${setting.id}`} className="text-sm font-medium text-text-primary">
              {setting.title}
            </Label>
            <span className="text-xs text-text-secondary">{setting.hint}</span>
          </div>
          <Switch id={`switch-${setting.id}`} checked={enabled[setting.id]} onCheckedChange={toggle(setting.id)} />
        </div>
      ))}
    </div>
  );
}

const COLUMNS = ["Nombre", "Área", "Líder", "Antigüedad", "Ubicación"];

function DenseColumns() {
  const [visible, setVisible] = React.useState<string[]>(["Nombre", "Área", "Líder"]);
  const toggle = (column: string) => (value: boolean) =>
    setVisible((prev) => (value ? [...prev, column] : prev.filter((item) => item !== column)));
  return (
    <div className="flex w-56 flex-col gap-2 rounded-lg border border-border/60 bg-surface p-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">Columnas</span>
      {COLUMNS.map((column) => (
        <label key={column} className="flex items-center justify-between text-[13px] text-text-primary">
          {column}
          <Switch size="sm" checked={visible.includes(column)} onCheckedChange={toggle(column)} aria-label={`Mostrar ${column}`} />
        </label>
      ))}
    </div>
  );
}

export const switchEntry = defineEntry({
  id: "switch",
  name: "Switch",
  group: "ui",
  description:
    "Interruptor de dos estados con efecto inmediato, en dos tamaños (32px y 24px de ancho). Úsalo para preferencias que se aplican al instante; para opciones que se envían con un formulario, prefiere Checkbox.",
  importPath: 'import { Switch } from "@/components/ui/switch"',
  sourcePath: "src/components/ui/switch.tsx",
  status: "stable",
  tags: ["radix", "form"],
  playground: definePlayground({
    controls: {
      size: { type: "select", options: SIZES, default: "default" },
      checked: { type: "boolean", label: "Activado", default: true },
      disabled: { type: "boolean", default: false },
      label: { type: "text", label: "Etiqueta", default: "Recordatorios" },
    },
    render: ({ size, checked, disabled, label }) => (
      <div className="flex items-center gap-3">
        <Switch id="switch-playground" size={size as SwitchSize} checked={checked} disabled={disabled} aria-readonly />
        <Label htmlFor="switch-playground">{label}</Label>
      </div>
    ),
    code: ({ size, checked, disabled, label }) => {
      const attrs = [`id="pref"`, size !== "default" ? `size="${size}"` : "", `checked={${checked}}`, "onCheckedChange={setChecked}", disabled ? "disabled" : ""]
        .filter(Boolean)
        .join(" ");
      return `<div className="flex items-center gap-3">
  <Switch ${attrs} />
  <Label htmlFor="pref">${label}</Label>
</div>`;
    },
  }),
  examples: [
    {
      id: "labelled",
      title: "Controlado con etiqueta",
      description: "El Label con `htmlFor` hace que el texto también conmute el interruptor.",
      code: `const [checked, setChecked] = React.useState(true);

<Switch id="notify" checked={checked} onCheckedChange={setChecked} />
<Label htmlFor="notify">Notificarme por correo</Label>`,
      render: () => <LabelledSwitch />,
    },
    {
      id: "settings",
      title: "Lista de preferencias",
      description: "Título, línea de ayuda y el interruptor alineado a la derecha; cada fila es independiente.",
      code: `<div className="divide-y rounded-xl border bg-surface">
  {settings.map((s) => (
    <div key={s.id} className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="flex flex-col">
        <Label htmlFor={s.id}>{s.title}</Label>
        <span className="text-xs text-text-secondary">{s.hint}</span>
      </div>
      <Switch id={s.id} checked={enabled[s.id]} onCheckedChange={(v) => setEnabled({ ...enabled, [s.id]: v })} />
    </div>
  ))}
</div>`,
      render: () => <SettingsList />,
    },
    {
      id: "compact",
      title: "Tamaño sm en listas densas",
      description: "El tamaño pequeño encaja en popovers y paneles de configuración de columnas.",
      code: `<label className="flex items-center justify-between text-[13px]">
  {column}
  <Switch size="sm" checked={visible.includes(column)} onCheckedChange={toggle(column)} aria-label={\`Mostrar \${column}\`} />
</label>`,
      render: () => <DenseColumns />,
    },
    {
      id: "states",
      title: "Deshabilitado",
      code: `<Switch checked disabled />
<Switch disabled />`,
      render: () => (
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch checked disabled aria-label="Activado y deshabilitado" />
            <span className="text-xs text-text-muted">Activado</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch disabled aria-label="Desactivado y deshabilitado" />
            <span className="text-xs text-text-muted">Desactivado</span>
          </div>
        </div>
      ),
    },
  ],
  props: [
    { name: "size", type: '"default" | "sm"', default: '"default"', description: "32×18px o 24×14px. El pulgar se ajusta solo." },
    { name: "checked / defaultChecked", type: "boolean", description: "Estado controlado o inicial." },
    { name: "onCheckedChange", type: "(checked: boolean) => void", description: "Se dispara al conmutar." },
    { name: "disabled", type: "boolean", default: "false", description: "Cursor not-allowed y opacidad al 50%." },
    { name: "aria-invalid", type: "boolean", description: "Pinta el borde y el anillo en destructivo." },
    { name: "...props", type: "React.ComponentProps<SwitchPrimitive.Root>", description: "Incluye `name` y `value` para formularios nativos." },
  ],
  guidelines: {
    do: ["Aplica el cambio al instante; si necesita «Guardar», usa Checkbox.", "Etiqueta siempre: Label con `htmlFor` o `aria-label` en listas densas.", "Escribe la etiqueta en positivo («Recordatorios»), no en negativo («No enviar»)."],
    dont: ["No lo uses como selector entre dos opciones equivalentes: ahí va SegmentedControl.", "No agrupes varios switches que dependan entre sí sin explicarlo en la ayuda."],
  },
  related: ["checkbox", "label", "segmented-control"],
});
