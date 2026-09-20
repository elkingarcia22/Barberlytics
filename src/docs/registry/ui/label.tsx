import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { defineEntry, definePlayground } from "../types";

function LabelledSwitch() {
  const [enabled, setEnabled] = React.useState(true);
  return (
    <div className="flex items-center gap-3">
      <Switch id="label-notifications" checked={enabled} onCheckedChange={setEnabled} />
      <Label htmlFor="label-notifications">Notificaciones por correo {enabled ? "activadas" : "desactivadas"}</Label>
    </div>
  );
}

export const labelEntry = defineEntry({
  id: "label",
  name: "Label",
  group: "ui",
  description:
    "Etiqueta accesible para controles de formulario, en 14px medium. Asóciala por `htmlFor` a un Input, Checkbox, Switch o Select para ampliar el área de clic y que los lectores de pantalla anuncien el campo.",
  importPath: 'import { Label } from "@/components/ui/label"',
  sourcePath: "src/components/ui/label.tsx",
  status: "stable",
  tags: ["cva", "native"],
  playground: definePlayground({
    controls: {
      text: { type: "text", label: "Texto", default: "Nombre del equipo" },
      required: { type: "boolean", label: "Obligatorio", default: false },
      disabled: { type: "boolean", label: "Campo deshabilitado", default: false },
    },
    render: ({ text, required, disabled }) => (
      <div className="w-full max-w-sm space-y-1.5">
        <Label htmlFor="pg-label" className={disabled ? "text-text-muted" : undefined}>
          {text}
          {required && (
            <span className="ml-0.5 text-destructive" aria-hidden>
              *
            </span>
          )}
        </Label>
        <Input id="pg-label" placeholder="Ventas LATAM" disabled={disabled} required={required} />
      </div>
    ),
    code: ({ text, required, disabled }) => `<Label htmlFor="team"${disabled ? ' className="text-text-muted"' : ""}>
  ${text}${required ? '<span className="ml-0.5 text-destructive" aria-hidden>*</span>' : ""}
</Label>
<Input id="team" placeholder="Ventas LATAM"${disabled ? " disabled" : ""}${required ? " required" : ""} />`,
  }),
  examples: [
    {
      id: "input",
      title: "Con Input",
      description: "El patrón base: etiqueta encima, campo debajo, 6px de separación.",
      code: `<div className="space-y-1.5">
  <Label htmlFor="email">Correo</Label>
  <Input id="email" type="email" placeholder="nombre@empresa.com" />
</div>`,
      render: () => (
        <div className="w-full max-w-sm space-y-1.5">
          <Label htmlFor="label-email">Correo</Label>
          <Input id="label-email" type="email" placeholder="nombre@empresa.com" />
        </div>
      ),
    },
    {
      id: "checkbox",
      title: "Con Checkbox",
      description: "Hacer clic en el texto también marca la casilla.",
      code: `<div className="flex items-center gap-2">
  <Checkbox id="remember" />
  <Label htmlFor="remember">Recordar este dispositivo</Label>
</div>`,
      render: () => (
        <div className="flex items-center gap-2">
          <Checkbox id="label-remember" />
          <Label htmlFor="label-remember">Recordar este dispositivo</Label>
        </div>
      ),
    },
    {
      id: "switch",
      title: "Con Switch",
      code: `const [enabled, setEnabled] = React.useState(true);

<div className="flex items-center gap-3">
  <Switch id="notifications" checked={enabled} onCheckedChange={setEnabled} />
  <Label htmlFor="notifications">Notificaciones por correo</Label>
</div>`,
      render: () => <LabelledSwitch />,
    },
    {
      id: "peer-disabled",
      title: "Deshabilitado por el control",
      description: "Con la clase `peer` en el control, la etiqueta que le sigue se atenúa sola (`peer-disabled`).",
      code: `<div className="flex items-center gap-2">
  <Checkbox id="locked" disabled className="peer" />
  <Label htmlFor="locked">Opción bloqueada por el administrador</Label>
</div>`,
      render: () => (
        <div className="flex items-center gap-2">
          <Checkbox id="label-locked" disabled className="peer" />
          <Label htmlFor="label-locked">Opción bloqueada por el administrador</Label>
        </div>
      ),
    },
  ],
  props: [
    { name: "htmlFor", type: "string", description: "`id` del control asociado. Obligatorio salvo que el control esté dentro del label." },
    { name: "children", type: "React.ReactNode", description: "Texto de la etiqueta; puede incluir un asterisco o un icono." },
    { name: "className", type: "string", description: "Clases extra (color, tamaño)." },
    { name: "...props", type: 'React.ComponentProps<"label">', description: "Cualquier atributo nativo de <label>." },
  ],
  guidelines: {
    do: ["Usa frases cortas en forma de sustantivo: «Correo», «Fecha de inicio».", "Marca los campos obligatorios de forma consistente en todo el formulario.", "Coloca la etiqueta a la izquierda para Checkbox y Switch, encima para Input y Select."],
    dont: ["No termines las etiquetas con dos puntos.", "No uses el label para instrucciones largas; usa un texto de ayuda debajo del campo.", "No dejes controles sin etiqueta aunque tengan placeholder."],
  },
  related: ["input", "checkbox", "switch", "select"],
});
