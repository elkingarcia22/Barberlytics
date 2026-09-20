import * as React from "react";
import { Plus } from "lucide-react";
import { Field, FormSection } from "@/components/forms";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { defineEntry, definePlayground } from "../types";

function SaveDemo() {
  const [name, setName] = React.useState("Onboarding comercial");
  const [saved, setSaved] = React.useState(true);
  return (
    <FormSection
      title="Información general"
      description="Estos datos se muestran a los colaboradores invitados."
      actions={
        <Button size="sm" disabled={saved} onClick={() => setSaved(true)}>
          {saved ? "Guardado" : "Guardar"}
        </Button>
      }
    >
      <Field label="Nombre del programa" required>
        <Input
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setSaved(false);
          }}
        />
      </Field>
      <Field label="Descripción" description="Máximo 280 caracteres.">
        <Textarea placeholder="¿De qué trata este programa?" onChange={() => setSaved(false)} />
      </Field>
    </FormSection>
  );
}

function SettingsDemo() {
  const [remind, setRemind] = React.useState(true);
  const [certificate, setCertificate] = React.useState(false);
  const rows = [
    { id: "remind", label: "Recordatorios automáticos", checked: remind, onChange: setRemind },
    { id: "certificate", label: "Certificado al finalizar", checked: certificate, onChange: setCertificate },
  ];
  return (
    <FormSection title="Preferencias">
      {rows.map((row) => (
        <label key={row.id} htmlFor={row.id} className="flex items-center justify-between text-sm text-text-primary">
          {row.label}
          <Switch id={row.id} checked={row.checked} onCheckedChange={row.onChange} />
        </label>
      ))}
    </FormSection>
  );
}

export const formSectionEntry = defineEntry({
  id: "form-section",
  name: "FormSection",
  group: "forms",
  description:
    "Una tarjeta que agrupa campos relacionados bajo un título, una descripción y un slot de acciones. Úsala para dividir formularios largos en bloques con sentido propio: datos generales, configuración, permisos.",
  importPath: 'import { FormSection } from "@/components/forms"',
  sourcePath: "src/components/forms/FormSection.tsx",
  status: "stable",
  tags: ["card", "layout"],
  playground: definePlayground({
    layout: "stretch",
    controls: {
      title: { type: "text", label: "Título", default: "Información general" },
      description: { type: "text", label: "Descripción", default: "Visible para los colaboradores invitados." },
      withActions: { type: "boolean", label: "Con acciones", default: true },
    },
    render: ({ title, description, withActions }) => (
      <FormSection
        title={title || undefined}
        description={description || undefined}
        actions={
          withActions ? (
            <Button size="sm" variant="outline">
              <Plus /> Añadir
            </Button>
          ) : undefined
        }
      >
        <Field label="Nombre">
          <Input placeholder="Ej. Onboarding comercial" />
        </Field>
        <Field label="Responsable">
          <Input placeholder="Buscar persona…" />
        </Field>
      </FormSection>
    ),
    code: ({ title, description, withActions }) => {
      const attrs = [title ? `title="${title}"` : "", description ? `description="${description}"` : ""].filter(Boolean);
      const actions = withActions ? `  actions={<Button size="sm" variant="outline"><Plus /> Añadir</Button>}\n` : "";
      const open = attrs.length || actions ? `<FormSection\n${attrs.map((a) => `  ${a}\n`).join("")}${actions}>` : "<FormSection>";
      return `${open}
  <Field label="Nombre">
    <Input placeholder="Ej. Onboarding comercial" />
  </Field>
  <Field label="Responsable">
    <Input placeholder="Buscar persona…" />
  </Field>
</FormSection>`;
    },
  }),
  examples: [
    {
      id: "with-actions",
      title: "Con acción de guardado",
      description: "El slot de acciones queda alineado con el título. Edita un campo para habilitar el botón.",
      layout: "stretch",
      code: `<FormSection
  title="Información general"
  description="Estos datos se muestran a los colaboradores invitados."
  actions={<Button size="sm" disabled={saved} onClick={save}>{saved ? "Guardado" : "Guardar"}</Button>}
>
  <Field label="Nombre del programa" required>
    <Input value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} />
  </Field>
  <Field label="Descripción" description="Máximo 280 caracteres.">
    <Textarea placeholder="¿De qué trata este programa?" />
  </Field>
</FormSection>`,
      render: () => <SaveDemo />,
    },
    {
      id: "settings",
      title: "Filas de configuración",
      description: "El contenido no tiene por qué ser inputs: cualquier fila con space-y-6 encaja.",
      layout: "stretch",
      code: `<FormSection title="Preferencias">
  <label className="flex items-center justify-between text-sm">
    Recordatorios automáticos
    <Switch checked={remind} onCheckedChange={setRemind} />
  </label>
  <label className="flex items-center justify-between text-sm">
    Certificado al finalizar
    <Switch checked={certificate} onCheckedChange={setCertificate} />
  </label>
</FormSection>`,
      render: () => <SettingsDemo />,
    },
    {
      id: "headless",
      title: "Sin encabezado",
      description: "Sin título ni acciones, la tarjeta añade el padding superior por sí sola.",
      layout: "stretch",
      code: `<FormSection>
  <Field label="Código de acceso">
    <Input placeholder="UB-2024-…" />
  </Field>
</FormSection>`,
      render: () => (
        <FormSection>
          <Field label="Código de acceso">
            <Input placeholder="UB-2024-…" />
          </Field>
        </FormSection>
      ),
    },
  ],
  props: [
    { name: "title", type: "string", description: "Título del bloque, en 18px bold." },
    { name: "description", type: "string", description: "Texto secundario bajo el título." },
    { name: "actions", type: "React.ReactNode", description: "Botones o menús alineados a la derecha del encabezado." },
    { name: "children", type: "React.ReactNode", description: "Los campos; se separan con space-y-6." },
    { name: "...props", type: 'React.HTMLAttributes<HTMLDivElement>', description: "Atributos de la Card contenedora." },
  ],
  guidelines: {
    do: ["Agrupa de 2 a 6 campos por sección; más de eso, divide.", "Usa el título para nombrar el bloque, no la pantalla completa.", "Reserva las acciones para operaciones locales al bloque (añadir fila, restablecer)."],
    dont: ["No anides FormSection dentro de FormSection.", "No pongas el botón de envío global dentro de una sección: va al pie del formulario."],
  },
  related: ["field", "card", "section-header", "button"],
});
