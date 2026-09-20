import * as React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { defineEntry, definePlayground } from "../types";

const MAX_CHARS = 280;
const MIN_CHARS = 20;

function CounterTextarea() {
  const [value, setValue] = React.useState("Reconocer el esfuerzo del equipo en la migración.");
  const remaining = MAX_CHARS - value.length;
  return (
    <div className="grid w-full max-w-md gap-2">
      <Label htmlFor="ta-goal">Objetivo del reconocimiento</Label>
      <Textarea id="ta-goal" value={value} onChange={(event) => setValue(event.target.value.slice(0, MAX_CHARS))} />
      <span className={cn("text-right text-xs tabular-nums", remaining < 30 ? "text-status-warning" : "text-text-muted")}>
        {remaining} caracteres restantes
      </span>
    </div>
  );
}

function ValidatedTextarea() {
  const [value, setValue] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const isInvalid = touched && value.trim().length < MIN_CHARS;
  return (
    <div className="grid w-full max-w-md gap-2">
      <Label htmlFor="ta-feedback">Comentario</Label>
      <Textarea
        id="ta-feedback"
        placeholder="Cuéntanos qué salió bien y qué mejorarías…"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => setTouched(true)}
        aria-invalid={isInvalid}
        aria-describedby="ta-feedback-hint"
        className={cn(isInvalid && "border-destructive focus-visible:ring-destructive/30 focus-visible:border-destructive")}
      />
      <span id="ta-feedback-hint" className={cn("text-xs", isInvalid ? "text-destructive" : "text-text-muted")}>
        {isInvalid ? `Escribe al menos ${MIN_CHARS} caracteres.` : "Mínimo 20 caracteres. Se comparte de forma anónima."}
      </span>
    </div>
  );
}

export const textareaEntry = defineEntry({
  id: "textarea",
  name: "Textarea",
  group: "ui",
  description:
    "Campo de texto multilínea con el mismo borde, radio y anillo de foco que Input, y 120px de alto mínimo. Úsalo para comentarios, descripciones y cualquier texto que no quepa en una línea.",
  importPath: 'import { Textarea } from "@/components/ui/textarea"',
  sourcePath: "src/components/ui/textarea.tsx",
  status: "stable",
  tags: ["form", "nativo"],
  playground: definePlayground({
    controls: {
      placeholder: { type: "text", default: "Escribe una descripción…" },
      rows: { type: "number", label: "Filas", default: 4, min: 2, max: 10, step: 1 },
      disabled: { type: "boolean", default: false },
      readOnly: { type: "boolean", label: "Solo lectura", default: false },
    },
    layout: "stretch",
    render: ({ placeholder, rows, disabled, readOnly }) => (
      <div className="mx-auto grid w-full max-w-md gap-2">
        <Label htmlFor="ta-playground">Descripción</Label>
        <Textarea id="ta-playground" placeholder={placeholder} rows={rows} disabled={disabled} readOnly={readOnly} defaultValue={readOnly ? "Este texto no se puede editar." : undefined} className="min-h-0" />
      </div>
    ),
    code: ({ placeholder, rows, disabled, readOnly }) => {
      const attrs = [`id="description"`, `placeholder="${placeholder}"`, rows !== 4 ? `rows={${rows}}` : "", disabled ? "disabled" : "", readOnly ? "readOnly" : ""]
        .filter(Boolean)
        .join(" ");
      return `<div className="grid gap-2">
  <Label htmlFor="description">Descripción</Label>
  <Textarea ${attrs} />
</div>`;
    },
  }),
  examples: [
    {
      id: "with-label",
      title: "Con etiqueta y ayuda",
      code: `<div className="grid gap-2">
  <Label htmlFor="notes">Notas internas</Label>
  <Textarea id="notes" placeholder="Solo las verá el equipo de People." />
  <span className="text-xs text-text-muted">Opcional.</span>
</div>`,
      render: () => (
        <div className="grid w-full max-w-md gap-2">
          <Label htmlFor="ta-notes">Notas internas</Label>
          <Textarea id="ta-notes" placeholder="Solo las verá el equipo de People." />
          <span className="text-xs text-text-muted">Opcional.</span>
        </div>
      ),
    },
    {
      id: "counter",
      title: "Con contador de caracteres",
      description: "Controlado; el contador cambia a advertencia cuando quedan pocos caracteres.",
      code: `const MAX = 280;
const [value, setValue] = React.useState("");

<Textarea value={value} onChange={(e) => setValue(e.target.value.slice(0, MAX))} />
<span className={cn("text-right text-xs tabular-nums", MAX - value.length < 30 ? "text-status-warning" : "text-text-muted")}>
  {MAX - value.length} caracteres restantes
</span>`,
      render: () => <CounterTextarea />,
    },
    {
      id: "validation",
      title: "Validación al salir del campo",
      description: "Se marca inválido solo después del primer `blur`, con `aria-invalid` y el mensaje enlazado por `aria-describedby`.",
      code: `<Textarea
  value={value}
  onChange={(e) => setValue(e.target.value)}
  onBlur={() => setTouched(true)}
  aria-invalid={isInvalid}
  aria-describedby="hint"
  className={cn(isInvalid && "border-destructive focus-visible:ring-destructive/30 focus-visible:border-destructive")}
/>
<span id="hint" className={isInvalid ? "text-xs text-destructive" : "text-xs text-text-muted"}>…</span>`,
      render: () => <ValidatedTextarea />,
    },
    {
      id: "disabled",
      title: "Deshabilitado",
      code: `<Textarea disabled defaultValue="La encuesta está cerrada; no se pueden editar las instrucciones." />`,
      render: () => (
        <Textarea className="w-full max-w-md" disabled defaultValue="La encuesta está cerrada; no se pueden editar las instrucciones." aria-label="Instrucciones" />
      ),
    },
  ],
  props: [
    { name: "rows", type: "number", description: "Filas visibles. El `min-h-[120px]` manda salvo que lo bajes con `className=\"min-h-0\"`." },
    { name: "placeholder", type: "string", description: "Texto de ayuda en color muted." },
    { name: "disabled", type: "boolean", default: "false", description: "Cursor not-allowed y opacidad al 50%." },
    { name: "readOnly", type: "boolean", default: "false", description: "Se puede seleccionar y copiar, no editar." },
    { name: "aria-invalid", type: "boolean", description: "Marca el campo como inválido para lectores de pantalla; combina con clases destructivas." },
    { name: "...props", type: 'React.ComponentProps<"textarea">', description: "Cualquier atributo nativo: value, onChange, maxLength, name…" },
  ],
  guidelines: {
    do: ["Etiqueta siempre con Label y `htmlFor`.", "Indica límites o requisitos en la línea de ayuda, no solo en el error.", "Valida al salir del campo o al enviar, no en cada tecla."],
    dont: ["No lo uses para una sola línea: usa Input.", "No fijes `resize: none` sin motivo; la persona debe poder ampliarlo."],
  },
  related: ["input", "label", "field", "form-section"],
});
