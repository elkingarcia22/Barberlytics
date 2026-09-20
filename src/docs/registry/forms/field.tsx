import * as React from "react";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/forms";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { defineEntry, definePlayground } from "../types";

function EmailValidationDemo() {
  const [value, setValue] = React.useState("ana@ubits");
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  return (
    <Field
      label="Correo corporativo"
      required
      description="Usaremos este correo para enviarte las invitaciones."
      error={isValid ? undefined : "Escribe un correo válido, por ejemplo ana@empresa.com"}
    >
      <Input type="email" value={value} onChange={(event) => setValue(event.target.value)} />
    </Field>
  );
}

function ComposedDemo() {
  const [enabled, setEnabled] = React.useState(true);
  return (
    <div className="flex items-start justify-between gap-6 rounded-xl border border-border/60 bg-surface p-4">
      <div className="space-y-1">
        <FieldLabel htmlFor="notify">Notificaciones semanales</FieldLabel>
        <FieldDescription>Resumen de avances cada lunes a las 8:00.</FieldDescription>
        {!enabled && <FieldError>Sin notificaciones no recibirás recordatorios.</FieldError>}
      </div>
      <Switch id="notify" checked={enabled} onCheckedChange={setEnabled} />
    </div>
  );
}

export const fieldEntry = defineEntry({
  id: "field",
  name: "Field",
  group: "forms",
  description:
    "El envoltorio de un control de formulario: etiqueta, descripción, error y estado deshabilitado, con los ids y aria-describedby inyectados en el hijo. Úsalo alrededor de cualquier Input, Textarea o Select para que todos los campos compartan la misma jerarquía y accesibilidad.",
  importPath: 'import { Field } from "@/components/forms"',
  sourcePath: "src/components/forms/Field.tsx",
  status: "stable",
  tags: ["a11y", "wrapper"],
  playground: definePlayground({
    layout: "stretch",
    controls: {
      label: { type: "text", default: "Nombre del programa" },
      description: { type: "text", label: "Descripción", default: "Visible para todos los colaboradores." },
      error: { type: "text", default: "", placeholder: "Mensaje de error" },
      required: { type: "boolean", label: "Requerido", default: true },
      disabled: { type: "boolean", label: "Deshabilitado", default: false },
    },
    render: ({ label, description, error, required, disabled }) => (
      <Field label={label} description={description || undefined} error={error || undefined} required={required} disabled={disabled}>
        <Input placeholder="Escribe aquí…" />
      </Field>
    ),
    code: ({ label, description, error, required, disabled }) => {
      const attrs = [
        `label="${label}"`,
        description ? `description="${description}"` : "",
        error ? `error="${error}"` : "",
        required ? "required" : "",
        disabled ? "disabled" : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `<Field ${attrs}>\n  <Input placeholder="Escribe aquí…" />\n</Field>`;
    },
  }),
  examples: [
    {
      id: "basic",
      title: "Etiqueta y descripción",
      description: "El hijo recibe el id de la etiqueta y el aria-describedby de la descripción sin configurar nada.",
      layout: "stretch",
      code: `<Field label="Nombre del equipo" description="Aparece en los reportes y en la sidebar.">
  <Input placeholder="Ej. Producto LATAM" />
</Field>`,
      render: () => (
        <Field label="Nombre del equipo" description="Aparece en los reportes y en la sidebar.">
          <Input placeholder="Ej. Producto LATAM" />
        </Field>
      ),
    },
    {
      id: "validation",
      title: "Error en vivo",
      description: "Cuando hay error, la descripción se oculta y el mensaje toma su lugar. Edita el correo para verlo.",
      layout: "stretch",
      code: `const [value, setValue] = React.useState("ana@ubits");
const isValid = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value);

<Field
  label="Correo corporativo"
  required
  description="Usaremos este correo para enviarte las invitaciones."
  error={isValid ? undefined : "Escribe un correo válido, por ejemplo ana@empresa.com"}
>
  <Input type="email" value={value} onChange={(e) => setValue(e.target.value)} />
</Field>`,
      render: () => <EmailValidationDemo />,
    },
    {
      id: "textarea",
      title: "Con Textarea y deshabilitado",
      layout: "stretch",
      code: `<Field label="Objetivo del programa" disabled description="Solo un administrador puede editar este campo.">
  <Textarea defaultValue="Fortalecer las habilidades de liderazgo del equipo comercial." />
</Field>`,
      render: () => (
        <Field label="Objetivo del programa" disabled description="Solo un administrador puede editar este campo.">
          <Textarea defaultValue="Fortalecer las habilidades de liderazgo del equipo comercial." />
        </Field>
      ),
    },
    {
      id: "composed",
      title: "Piezas sueltas",
      description: "FieldLabel, FieldDescription y FieldError sirven para layouts que Field no cubre, como un switch alineado a la derecha.",
      layout: "stretch",
      code: `<div className="flex items-start justify-between gap-6 rounded-xl border border-border/60 bg-surface p-4">
  <div className="space-y-1">
    <FieldLabel htmlFor="notify">Notificaciones semanales</FieldLabel>
    <FieldDescription>Resumen de avances cada lunes a las 8:00.</FieldDescription>
    {!enabled && <FieldError>Sin notificaciones no recibirás recordatorios.</FieldError>}
  </div>
  <Switch id="notify" checked={enabled} onCheckedChange={setEnabled} />
</div>`,
      render: () => <ComposedDemo />,
    },
  ],
  props: [
    { name: "label", type: "string", description: "Texto de la etiqueta. Se enlaza al hijo mediante htmlFor/id." },
    { name: "description", type: "string", description: "Ayuda contextual bajo el control. Se oculta mientras haya error." },
    { name: "error", type: "string", description: "Mensaje de error; se anuncia vía aria-describedby." },
    { name: "required", type: "boolean", default: "false", description: "Añade el asterisco rojo a la etiqueta." },
    { name: "disabled", type: "boolean", default: "false", description: "Atenúa la etiqueta y propaga disabled al hijo." },
    { name: "children", type: "React.ReactNode", description: "El control. Si es un elemento válido recibe id, disabled y aria-describedby." },
    { name: "...props", type: 'React.HTMLAttributes<HTMLDivElement>', description: "Atributos del contenedor." },
  ],
  guidelines: {
    do: ["Envuelve cada control de un formulario en un Field, incluso sin descripción.", "Escribe errores accionables: qué pasó y cómo corregirlo.", "Marca como requeridos solo los campos que bloquean el envío."],
    dont: ["No pongas varios controles dentro de un mismo Field: el id solo llega al primero.", "No uses la descripción para repetir la etiqueta."],
  },
  related: ["input", "textarea", "label", "form-section", "single-select"],
});
