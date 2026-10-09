import * as React from "react";
import { CreditCard, Globe, Lock, Shield, Smartphone, Store, Users } from "lucide-react";
import { OptionTile, type SelectionOption } from "@/components/selection";
import { defineEntry, definePlayground } from "../types";

const VISIBILITY: SelectionOption[] = [
  { value: "public", label: "Pública", description: "Cualquier colaborador puede unirse.", icon: Globe },
  { value: "team", label: "Solo mi equipo", description: "Visible para las personas de tu área.", icon: Users, badge: "Sugerido" },
  { value: "private", label: "Privada", description: "Solo por invitación directa.", icon: Lock },
  { value: "admin", label: "Administradores", description: "Requiere permisos elevados.", icon: Shield, disabled: true },
];

function PlaygroundDemo({ compact, disabled, withIcon }: { compact: boolean; disabled: boolean; withIcon: boolean }) {
  const [selected, setSelected] = React.useState(true);
  const option: SelectionOption = { ...VISIBILITY[1], icon: withIcon ? VISIBILITY[1].icon : undefined };
  return (
    <div className="w-full max-w-sm">
      <OptionTile option={option} selected={selected} compact={compact} disabled={disabled} onSelect={() => setSelected((value) => !value)} />
    </div>
  );
}

function ListDemo() {
  const [value, setValue] = React.useState<string | undefined>("team");
  return (
    <div className="w-full max-w-md space-y-2" role="radiogroup" aria-label="Visibilidad">
      {VISIBILITY.map((option) => (
        <OptionTile key={option.value} option={option} selected={value === option.value} onSelect={setValue} />
      ))}
    </div>
  );
}

const METHODS: SelectionOption[] = [
  { value: "card", label: "Tarjeta", icon: CreditCard },
  { value: "wallet", label: "Apple Pay o Google Pay", icon: Smartphone },
  { value: "shop", label: "Pagar en la barbería", icon: Store },
];

function StackedDemo() {
  const [value, setValue] = React.useState<string>("card");
  return (
    <div className="grid w-full max-w-md grid-cols-3 gap-2" role="radiogroup" aria-label="Cómo pagas">
      {METHODS.map((option) => (
        <OptionTile key={option.value} option={option} layout="stacked" compact selected={value === option.value} onSelect={setValue} />
      ))}
    </div>
  );
}

function CompactDemo() {
  const [values, setValues] = React.useState<string[]>(["public"]);
  const toggle = (next: string) => setValues((prev) => (prev.includes(next) ? prev.filter((item) => item !== next) : [...prev, next]));
  return (
    <div className="w-full max-w-md space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {VISIBILITY.slice(0, 3).map((option) => (
          <OptionTile key={option.value} option={option} compact selected={values.includes(option.value)} onSelect={toggle} />
        ))}
      </div>
      <p className="text-xs text-text-muted">Elegidos: {values.join(", ") || "ninguno"}</p>
    </div>
  );
}

export const optionTileEntry = defineEntry({
  id: "option-tile",
  name: "OptionTile",
  group: "selection",
  description:
    "Un tile horizontal y compacto con icono, label, descripción y un radio a la derecha, pensado para listas densas. Úsalo cuando hay muchas opciones o poco espacio y las tarjetas grandes serían un exceso.",
  importPath: 'import { OptionTile } from "@/components/selection"',
  sourcePath: "src/components/selection/OptionTile.tsx",
  status: "stable",
  tags: ["primitive", "dense"],
  playground: definePlayground({
    controls: {
      compact: { type: "boolean", label: "Compacto", default: false },
      withIcon: { type: "boolean", label: "Con icono", default: true },
      disabled: { type: "boolean", label: "Deshabilitado", default: false },
    },
    render: ({ compact, withIcon, disabled }) => <PlaygroundDemo compact={compact} withIcon={withIcon} disabled={disabled} />,
    code: ({ compact, withIcon, disabled }) => {
      const attrs = [compact ? "compact" : "", disabled ? "disabled" : ""].filter(Boolean).join(" ");
      return `const [selected, setSelected] = React.useState(true);

<OptionTile
  option={{ value: "team", label: "Solo mi equipo", description: "Visible para las personas de tu área."${withIcon ? ", icon: Users" : ""}, badge: "Sugerido" }}
  selected={selected}
  onSelect={() => setSelected((v) => !v)}${attrs ? `\n  ${attrs}` : ""}
/>`;
    },
  }),
  examples: [
    {
      id: "list",
      title: "Lista de selección única",
      description: "Los tiles se apilan con space-y-2; el consumidor pone el role=radiogroup.",
      layout: "start",
      code: `const [value, setValue] = React.useState<string>("team");

<div className="space-y-2" role="radiogroup" aria-label="Visibilidad">
  {options.map((option) => (
    <OptionTile key={option.value} option={option} selected={value === option.value} onSelect={setValue} />
  ))}
</div>`,
      render: () => <ListDemo />,
    },
    {
      id: "compact",
      title: "Compacto en grilla, selección múltiple",
      description: "En modo compacto la descripción se oculta y el padding baja a 8px.",
      layout: "start",
      code: `<div className="grid grid-cols-2 gap-2">
  {options.map((option) => (
    <OptionTile key={option.value} option={option} compact selected={values.includes(option.value)} onSelect={toggle} />
  ))}
</div>`,
      render: () => <CompactDemo />,
    },
    {
      id: "stacked",
      title: "Apilado, lado a lado",
      description: "Con layout=\"stacked\" el icono va arriba, el nombre debajo (hasta dos líneas) y el radio en la esquina: pocas opciones caben en una fila, como las formas de pago de la reserva.",
      layout: "start",
      code: `<div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Cómo pagas">
  {methods.map((option) => (
    <OptionTile key={option.value} option={option} layout="stacked" compact selected={value === option.value} onSelect={setValue} />
  ))}
</div>`,
      render: () => <StackedDemo />,
    },
  ],
  props: [
    { name: "option", type: "SelectionOption", description: "value, label, description, badge, icon y disabled. El eyebrow no se muestra." },
    { name: "selected", type: "boolean", default: "false", description: "Estado elegido: borde primario, ring y radio relleno." },
    { name: "disabled", type: "boolean", default: "false", description: "Deshabilita el tile además de option.disabled." },
    { name: "onSelect", type: "(value: string) => void", description: "Se llama con option.value al pulsar." },
    { name: "compact", type: "boolean", default: "false", description: "Reduce padding e icono y oculta la descripción." },
    { name: "layout", type: '"row" | "stacked"', default: '"row"', description: "row: todo en una fila. stacked: icono arriba, nombre debajo y radio en la esquina, para 2 a 4 opciones lado a lado." },
    { name: "className", type: "string", description: "Clases para el botón." },
  ],
  guidelines: {
    do: ["Úsalo en drawers, paneles laterales y listas de 5 o más opciones.", "Añade role=radiogroup o un aria-label al contenedor de la lista."],
    dont: ["No lo mezcles con SelectableCard en la misma lista.", "No uses compact si la descripción es lo que diferencia las opciones."],
  },
  related: ["selectable-card", "card-selection", "radio-group"],
});
