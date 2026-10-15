import * as React from "react";
import { SelectableRow } from "@/components/selection";
import { Text } from "@/components/typography";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon } from "@/icons";
import { defineEntry, definePlayground } from "../types";

const BRANCHES = [
  { id: "ma", name: "Massachusetts", address: "88 Newbury St, Boston", hours: "Hoy 8:00 a. m. – 10:00 p. m." },
  { id: "nc", name: "North Carolina", address: "210 W Trade St, Charlotte", hours: "Hoy 9:00 a. m. – 8:00 p. m." },
  { id: "ri", name: "Rhode Island", address: "134 Thayer St, Providence", hours: "Hoy 9:00 a. m. – 7:00 p. m." },
];

function BranchRow({ branch, checked, onClick, withAction }: { branch: (typeof BRANCHES)[number]; checked: boolean; onClick: () => void; withAction?: boolean }) {
  return (
    <SelectableRow
      role="radio"
      checked={checked}
      label={`${branch.name}, ${branch.address}`}
      leading={<IconTile size="md" icon={<ThemaIcon name="building" />} />}
      onClick={onClick}
      action={withAction ? { label: "Ver detalle", ariaLabel: `Ver detalle: ${branch.name}`, onClick: () => undefined } : undefined}
    >
      <Text as="span" weight="medium" className="truncate">
        {branch.name}
      </Text>
      <Text as="span" size="xs" tone="secondary" className="truncate">
        {branch.address}
      </Text>
      <Text as="span" size="xs" tone="muted" tabular className="truncate">
        {branch.hours}
      </Text>
    </SelectableRow>
  );
}

function PlaygroundDemo({ withAction, disabled }: { withAction: boolean; disabled: boolean }) {
  const [checked, setChecked] = React.useState(true);
  return (
    <div className="w-full max-w-sm">
      <SelectableRow
        role="radio"
        checked={checked}
        label="Massachusetts, 88 Newbury St, Boston"
        leading={<IconTile size="md" icon={<ThemaIcon name="building" />} />}
        onClick={() => setChecked((value) => !value)}
        disabled={disabled}
        action={withAction ? { label: "Ver detalle", ariaLabel: "Ver detalle: Massachusetts", onClick: () => undefined } : undefined}
      >
        <Text as="span" weight="medium" className="truncate">
          Massachusetts
        </Text>
        <Text as="span" size="xs" tone="secondary" className="truncate">
          88 Newbury St, Boston
        </Text>
      </SelectableRow>
    </div>
  );
}

function RadioListDemo() {
  const [value, setValue] = React.useState("ma");
  return (
    <div role="radiogroup" aria-label="Sede" className="flex w-full max-w-sm flex-col gap-0.5">
      {BRANCHES.map((branch) => (
        <BranchRow key={branch.id} branch={branch} checked={value === branch.id} onClick={() => setValue(branch.id)} withAction />
      ))}
    </div>
  );
}

const SERVICES = ["Corte clásico", "Fade", "Arreglo de barba"];

function CheckboxListDemo() {
  const [picked, setPicked] = React.useState<string[]>(["Fade"]);
  const toggle = (name: string) => setPicked((current) => (current.includes(name) ? current.filter((item) => item !== name) : [...current, name]));
  return (
    <div role="group" aria-label="Servicios" className="flex w-full max-w-sm flex-col gap-0.5">
      {SERVICES.map((name) => (
        <SelectableRow key={name} role="checkbox" checked={picked.includes(name)} label={name} leading={<IconTile size="md" icon={<ThemaIcon name="scissors" />} />} onClick={() => toggle(name)}>
          <Text as="span" weight="medium" className="truncate">
            {name}
          </Text>
          <Text as="span" size="xs" tone="muted">
            30 min · desde US$ 26
          </Text>
        </SelectableRow>
      ))}
    </div>
  );
}

export const selectableRowEntry = defineEntry({
  id: "selectable-row",
  name: "SelectableRow",
  group: "selection",
  description:
    "Una fila de lista para elegir, con foto, texto y la marca de elegir a la derecha (SelectMark). El fondo —puntero y elegido— es de la fila entera, también cuando lleva un enlace o algo más debajo. Es la fila de las hojas de sede, servicios y barbero de la reserva en línea.",
  importPath: 'import { SelectableRow } from "@/components/selection"',
  sourcePath: "src/components/selection/SelectableRow.tsx",
  status: "stable",
  tags: ["selection", "list", "radio", "checkbox"],
  playground: definePlayground({
    controls: {
      withAction: { type: "boolean", label: "Con «Ver detalle»", default: false },
      disabled: { type: "boolean", label: "Deshabilitada", default: false },
    },
    render: ({ withAction, disabled }) => <PlaygroundDemo withAction={withAction} disabled={disabled} />,
    code: ({ withAction, disabled }) => `<SelectableRow
  role="radio"
  checked={checked}
  label="Massachusetts, 88 Newbury St, Boston"
  leading={<IconTile size="md" icon={<ThemaIcon name="building" />} />}
  onClick={() => setChecked(true)}${disabled ? "\n  disabled" : ""}${withAction ? '\n  action={{ label: "Ver detalle", ariaLabel: "Ver detalle: Massachusetts", onClick: openDetail }}' : ""}
>
  <Text as="span" weight="medium">Massachusetts</Text>
  <Text as="span" size="xs" tone="secondary">88 Newbury St, Boston</Text>
</SelectableRow>`,
  }),
  examples: [
    {
      id: "radio",
      title: "Elegir una: sedes",
      description: "Con role=\"radio\" la marca es un círculo; el contenedor pone role=\"radiogroup\". «Ver detalle» es otro botón al lado de la fila, no dentro.",
      layout: "start",
      code: `<div role="radiogroup" aria-label="Sede" className="flex flex-col gap-0.5">
  {branches.map((branch) => (
    <SelectableRow key={branch.id} role="radio" checked={value === branch.id} label={\`\${branch.name}, \${branch.address}\`} leading={<IconTile … />} onClick={() => setValue(branch.id)} action={{ label: "Ver detalle", ariaLabel: …, onClick: … }}>
      …
    </SelectableRow>
  ))}
</div>`,
      render: () => <RadioListDemo />,
    },
    {
      id: "checkbox",
      title: "Elegir varias: servicios",
      description: "Con role=\"checkbox\" la marca es una casilla.",
      layout: "start",
      code: `<div role="group" aria-label="Servicios" className="flex flex-col gap-0.5">
  {services.map((service) => (
    <SelectableRow key={service.id} role="checkbox" checked={picked.includes(service.id)} label={service.name} leading={<IconTile … />} onClick={() => toggle(service.id)}>
      …
    </SelectableRow>
  ))}
</div>`,
      render: () => <CheckboxListDemo />,
    },
  ],
  props: [
    { name: "role", type: '"radio" | "checkbox"', description: "Una sola opción o varias: pone el rol, `aria-checked` y la forma de la marca." },
    { name: "checked", type: "boolean", description: "Elegida: fondo de marca y marca rellena." },
    { name: "label", type: "string", description: "El nombre completo de la opción para el lector de pantalla." },
    { name: "leading", type: "ReactNode", description: "Lo de la izquierda: foto, avatar o IconTile." },
    { name: "onClick", type: "() => void", description: "Se llama al elegir." },
    { name: "disabled", type: "boolean", default: "false", description: "Atenuada y sin respuesta." },
    { name: "size", type: '"default" | "lg"', default: '"default"', description: "`lg` sube el alto mínimo para el dedo (tablet, kiosco)." },
    { name: "action", type: "{ label; ariaLabel; onClick }", description: "Un enlace bajo el texto («Ver perfil»), como botón aparte." },
    { name: "below", type: "ReactNode", description: "Algo más bajo el texto, dentro de la misma tarjeta." },
    { name: "className", type: "string", description: "Para el layout de afuera." },
  ],
  guidelines: {
    do: ["Úsala en listas dentro de hojas y paneles, con el rol de grupo en el contenedor.", "Pon la foto en `leading` con IconTile: sin imagen cae a su icono."],
    dont: ["No metas un botón dentro del texto: usa `action`.", "No la uses para acciones: elegir no navega ni ejecuta."],
  },
  related: ["select-mark", "option-tile", "list-item", "selectable-card"],
});
