import * as React from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { defineEntry, definePlayground } from "../types";

const TYPES = ["text", "email", "password", "number", "search", "date", "file"] as const;

function ValidatedEmail() {
  const [value, setValue] = React.useState("");
  const isValid = value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  return (
    <div className="w-full max-w-sm space-y-1.5">
      <Label htmlFor="input-email">Correo corporativo</Label>
      <Input
        id="input-email"
        type="email"
        placeholder="nombre@empresa.com"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        aria-invalid={!isValid}
        aria-describedby="input-email-hint"
        className={isValid ? undefined : "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"}
      />
      <p id="input-email-hint" className={`text-xs ${isValid ? "text-text-muted" : "text-destructive"}`}>
        {isValid ? "Usaremos este correo para las notificaciones." : "Introduce un correo válido."}
      </p>
    </div>
  );
}

function SearchForm() {
  const [query, setQuery] = React.useState("");
  const [submitted, setSubmitted] = React.useState<string | null>(null);
  return (
    <form
      className="flex w-full max-w-sm flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(query);
      }}
    >
      <div className="flex gap-2">
        <Input type="search" placeholder="Buscar cursos…" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Buscar cursos" />
        <Button type="submit" size="lg" className="h-10">
          <Search /> Buscar
        </Button>
      </div>
      {submitted !== null && <p className="text-xs text-text-muted">Buscando «{submitted || "todo"}»…</p>}
    </form>
  );
}

export const inputEntry = defineEntry({
  id: "input",
  name: "Input",
  group: "ui",
  description:
    "Campo de texto de una línea (40px) con los estados de foco, deshabilitado y archivo del sistema. Úsalo para cualquier dato corto; para varias líneas usa Textarea y para iconos o botones integrados usa InputGroup.",
  importPath: 'import { Input } from "@/components/ui/input"',
  sourcePath: "src/components/ui/input.tsx",
  status: "stable",
  tags: ["native"],
  playground: definePlayground({
    controls: {
      type: { type: "select", options: TYPES, default: "text" },
      placeholder: { type: "text", default: "Escribe aquí…" },
      label: { type: "text", label: "Etiqueta", default: "Nombre del curso" },
      disabled: { type: "boolean", default: false },
    },
    render: ({ type, placeholder, label, disabled }) => (
      <div className="w-full max-w-sm space-y-1.5">
        <Label htmlFor="pg-input">{label}</Label>
        <Input id="pg-input" type={type} placeholder={placeholder} disabled={disabled} />
      </div>
    ),
    code: ({ type, placeholder, label, disabled }) => {
      const attrs = [type !== "text" ? `type="${type}"` : "", placeholder ? `placeholder="${placeholder}"` : "", disabled ? "disabled" : ""].filter(Boolean).join(" ");
      return `<div className="space-y-1.5">
  <Label htmlFor="course">${label}</Label>
  <Input id="course"${attrs ? ` ${attrs}` : ""} />
</div>`;
    },
  }),
  examples: [
    {
      id: "validated",
      title: "Con etiqueta, ayuda y validación",
      description: "El padre controla el valor y marca `aria-invalid`; el texto de ayuda cambia de tono según el estado.",
      code: `const [value, setValue] = React.useState("");
const isValid = value === "" || EMAIL_RE.test(value);

<Label htmlFor="email">Correo corporativo</Label>
<Input
  id="email"
  type="email"
  value={value}
  onChange={(event) => setValue(event.target.value)}
  aria-invalid={!isValid}
  aria-describedby="email-hint"
  className={isValid ? undefined : "border-destructive focus-visible:ring-destructive/20"}
/>
<p id="email-hint" className={isValid ? "text-text-muted" : "text-destructive"}>…</p>`,
      render: () => <ValidatedEmail />,
    },
    {
      id: "with-button",
      title: "Con botón",
      description: "Input y Button en una fila; el botón se iguala a 40px con `className=\"h-10\"`.",
      code: `<form className="flex gap-2" onSubmit={onSearch}>
  <Input type="search" placeholder="Buscar cursos…" aria-label="Buscar cursos" />
  <Button type="submit" className="h-10"><Search /> Buscar</Button>
</form>`,
      render: () => <SearchForm />,
    },
    {
      id: "types",
      title: "Tipos nativos",
      description: "El navegador aporta teclado, validación y selector según el `type`.",
      layout: "stretch",
      code: `<Input type="number" placeholder="Cupos" min={1} />
<Input type="date" />
<Input type="password" placeholder="Contraseña" />
<Input type="file" />`,
      render: () => (
        <div className="grid w-full gap-3 sm:grid-cols-2">
          <Input type="number" placeholder="Cupos" min={1} aria-label="Cupos" />
          <Input type="date" aria-label="Fecha" />
          <Input type="password" placeholder="Contraseña" aria-label="Contraseña" />
          <Input type="file" aria-label="Archivo" />
        </div>
      ),
    },
    {
      id: "disabled",
      title: "Deshabilitado y solo lectura",
      code: `<Input disabled placeholder="Deshabilitado" />
<Input readOnly value="Solo lectura" />`,
      render: () => (
        <div className="flex w-full max-w-md gap-3">
          <Input disabled placeholder="Deshabilitado" aria-label="Deshabilitado" />
          <Input readOnly value="Solo lectura" aria-label="Solo lectura" />
        </div>
      ),
    },
  ],
  props: [
    { name: "type", type: "string", default: '"text"', description: "Tipo nativo: text, email, password, number, search, date, file…" },
    { name: "value / defaultValue", type: "string", description: "Valor controlado o inicial." },
    { name: "onChange", type: "(event) => void", description: "Se dispara con cada pulsación." },
    { name: "placeholder", type: "string", description: "Texto de ayuda dentro del campo; no sustituye a la etiqueta." },
    { name: "disabled", type: "boolean", default: "false", description: "Bloquea la edición y baja la opacidad." },
    { name: "aria-invalid", type: "boolean", description: "Marca el campo como inválido para tecnologías de asistencia; combina con clases destructivas." },
    { name: "ref", type: "React.Ref<HTMLInputElement>", description: "Acceso al input nativo (forwardRef)." },
    { name: "...props", type: 'React.ComponentProps<"input">', description: "Cualquier atributo nativo de <input>." },
  ],
  guidelines: {
    do: ["Acompaña siempre el campo de un Label asociado por `htmlFor`.", "Usa el `type` correcto para obtener el teclado adecuado en móvil.", "Muestra el error debajo del campo y enlázalo con `aria-describedby`."],
    dont: ["No uses el placeholder como única etiqueta.", "No cambies la altura por campo; mantén los 40px para alinear con botones `lg`.", "No pongas iconos dentro con posicionamiento manual; usa InputGroup."],
  },
  related: ["label", "input-group", "textarea", "select"],
});
