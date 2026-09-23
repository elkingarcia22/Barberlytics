import * as React from "react";
import { Field, PhoneInput } from "@/components/forms";
import type { CountryCode } from "@/components/forms/phoneCountries";
import { defineEntry, definePlayground } from "../types";

const DEFAULT_COUNTRIES = ["CO", "MX", "AR", "ES", "US"] as const;

function CandidatePhoneDemo() {
  const [phone, setPhone] = React.useState("");
  return (
    <div className="w-full space-y-2">
      <PhoneInput value={phone} onValueChange={setPhone} defaultCountry="CO" aria-label="Teléfono del candidato" />
      <p className="text-xs text-text-muted">Valor emitido: {phone || "(vacío)"}</p>
    </div>
  );
}

function CandidatePhoneFieldDemo() {
  const [phone, setPhone] = React.useState("+57300");
  const digits = phone.replace(/^\+\d{1,3}/, "");
  const incomplete = digits.length > 0 && digits.length < 10;
  return (
    <Field
      label="Teléfono de contacto"
      description="Lo usamos para confirmar la entrevista por WhatsApp."
      error={incomplete ? "Verifica el número: faltan dígitos." : undefined}
    >
      <PhoneInput value={phone} onValueChange={setPhone} defaultCountry="CO" />
    </Field>
  );
}

export const phoneInputEntry = defineEntry({
  id: "phone-input",
  name: "PhoneInput",
  group: "forms",
  description:
    "Teléfono con selector de país y prefijo. Hacia dentro se escribe agrupado («300 123 4567»); hacia fuera siempre emite E.164 («+573001234567»), que es el formato que guarda el backend.",
  importPath: 'import { PhoneInput } from "@/components/forms"',
  sourcePath: "src/components/forms/PhoneInput.tsx",
  status: "stable",
  tags: ["form", "controlled", "e164"],
  playground: definePlayground({
    layout: "start",
    controls: {
      defaultCountry: { type: "select", label: "País por defecto", options: DEFAULT_COUNTRIES, default: "CO" },
      placeholder: { type: "text", label: "Placeholder", default: "" },
      required: { type: "boolean", label: "Requerido", default: false },
      disabled: { type: "boolean", label: "Deshabilitado", default: false },
    },
    render: ({ defaultCountry, placeholder, required, disabled }) => (
      <div className="w-full max-w-xs">
        <PhoneInput
          defaultCountry={defaultCountry as CountryCode}
          placeholder={placeholder || undefined}
          required={required}
          disabled={disabled}
          aria-label="Teléfono"
        />
      </div>
    ),
    code: ({ defaultCountry, placeholder, required, disabled }) => {
      const attrs = [
        defaultCountry !== "CO" ? `defaultCountry="${defaultCountry}"` : "",
        placeholder ? `placeholder="${placeholder}"` : "",
        required ? "required" : "",
        disabled ? "disabled" : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `<PhoneInput aria-label="Teléfono" ${attrs} />`.replace(/\s+/g, " ").trim();
    },
  }),
  examples: [
    {
      id: "candidate",
      title: "Teléfono de contacto de un candidato",
      description: "Controlado: `onValueChange` entrega el número en E.164, listo para guardar tal cual.",
      layout: "start",
      code: `const [phone, setPhone] = React.useState("");

<PhoneInput value={phone} onValueChange={setPhone} defaultCountry="CO" aria-label="Teléfono del candidato" />`,
      render: () => (
        <div className="w-full max-w-sm">
          <CandidatePhoneDemo />
        </div>
      ),
    },
    {
      id: "field-error",
      title: "Dentro de Field, con error de validación",
      description: "El error se calcula sobre el número nacional; `Field` inyecta la descripción y el error por `aria-describedby`.",
      layout: "start",
      code: `<Field
  label="Teléfono de contacto"
  description="Lo usamos para confirmar la entrevista por WhatsApp."
  error={incompleto ? "Verifica el número: faltan dígitos." : undefined}
>
  <PhoneInput value={phone} onValueChange={setPhone} defaultCountry="CO" />
</Field>`,
      render: () => (
        <div className="w-full max-w-sm">
          <CandidatePhoneFieldDemo />
        </div>
      ),
    },
    {
      id: "other-country",
      title: "Otro país por defecto",
      description: "`defaultCountry` fija el prefijo inicial cuando el campo empieza vacío; la persona puede cambiarlo desde el selector.",
      layout: "start",
      code: `<PhoneInput defaultCountry="MX" aria-label="Teléfono" />`,
      render: () => (
        <div className="w-full max-w-sm">
          <PhoneInput defaultCountry="MX" aria-label="Teléfono" />
        </div>
      ),
    },
    {
      id: "readonly-summary",
      title: "Deshabilitado, en un resumen de perfil",
      description: "`disabled` con un valor ya cargado, para mostrar el dato guardado sin permitir edición.",
      layout: "start",
      code: `<PhoneInput value="+573001234567" disabled aria-label="Teléfono registrado" />`,
      render: () => (
        <div className="w-full max-w-sm">
          <PhoneInput value="+573001234567" disabled aria-label="Teléfono registrado" />
        </div>
      ),
    },
  ],
  props: [
    { name: "value", type: "string", description: "Valor controlado en E.164, p. ej. «+573001234567»." },
    { name: "onValueChange", type: "(value: string) => void", description: "Se llama con el número en E.164; cadena vacía si no hay dígitos." },
    { name: "defaultCountry", type: "CountryCode", default: '"CO"', description: "País preseleccionado cuando el campo empieza vacío (sin `value`)." },
    { name: "countries", type: "readonly Country[]", default: "PHONE_COUNTRIES", description: "Lista de países a ofrecer en el selector; por defecto LATAM + España + EE. UU." },
    { name: "placeholder", type: "string", description: "Si no se pasa, se arma con ceros agrupados según el país (p. ej. «300 123 4567»)." },
    { name: "disabled", type: "boolean", description: "Apaga el selector de país y el input." },
    { name: "id / className", type: "string", description: "Se aplican al contenedor externo del selector y el input." },
    { name: "...props", type: 'React.ComponentProps<"input">', description: "Resto de atributos nativos del input (excepto `value`, `defaultValue`, `onChange`, `type` y `prefix`, que controla el propio componente)." },
  ],
  guidelines: {
    do: [
      "Guarda siempre el E.164 que emite `onValueChange`; no reconstruyas el número a mano concatenando el prefijo.",
      "Deja `defaultCountry` en el país donde opera la mayoría de tus usuarios para no obligarlos a cambiarlo.",
      "Valida sobre el número nacional (longitud según el país), no sobre el string completo con el prefijo.",
    ],
    dont: [
      "No lo uses para documentos o códigos que no sean un teléfono real (cédula, NIT): ahí va `Input` o `NumberField`.",
      "No fuerces `type=\"tel\"` ni un patrón propio por encima del componente; ya normaliza dígitos y formato.",
      "No amplíes `countries` con un catálogo mundial completo si el producto solo opera en un puñado de países: la lista corta agiliza el selector.",
    ],
  },
  related: ["field", "input", "single-select"],
});
