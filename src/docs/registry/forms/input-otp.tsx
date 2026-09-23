import * as React from "react";
import { Field, InputOtp } from "@/components/forms";
import { defineEntry, definePlayground } from "../types";

const TYPES = ["numeric", "alphanumeric"] as const;
type OtpType = (typeof TYPES)[number];

function PlaygroundDemo({ length, mask, grouped, type, disabled }: { length: number; mask: boolean; grouped: boolean; type: OtpType; disabled: boolean }) {
  const [value, setValue] = React.useState("");
  const half = Math.floor(length / 2);
  return (
    <InputOtp
      length={length}
      value={value}
      onChange={setValue}
      mask={mask}
      groups={grouped && half > 0 ? [half, length - half] : undefined}
      type={type}
      disabled={disabled}
    />
  );
}

function LoginDemo() {
  const [code, setCode] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "checking" | "ok">("idle");

  const handleComplete = (value: string) => {
    setStatus("checking");
    // En producción aquí va la mutación; el timeout solo simula la espera.
    window.setTimeout(() => setStatus(value === "482915" ? "ok" : "idle"), 600);
  };

  return (
    <div className="w-full space-y-3">
      <Field label="Verificación en dos pasos" description="Escribe el código de 6 dígitos que enviamos a tu correo. Prueba con 482915.">
        <InputOtp value={code} onChange={setCode} onComplete={handleComplete} groups={[3, 3]} />
      </Field>
      <p className="text-xs text-text-muted">
        {status === "checking" ? "Verificando…" : status === "ok" ? "Código correcto." : "Esperando el código."}
      </p>
    </div>
  );
}

function MaskedDemo() {
  const [code, setCode] = React.useState("");
  return <InputOtp length={4} value={code} onChange={setCode} mask aria-label="PIN de la sesión" />;
}

function AlphanumericDemo() {
  const [code, setCode] = React.useState("");
  return (
    <div className="w-full space-y-2">
      <InputOtp length={6} value={code} onChange={setCode} type="alphanumeric" groups={[3, 3]} aria-label="Código de invitación" />
      <p className="text-xs text-text-muted">Valor: {code || "—"}</p>
    </div>
  );
}

export const inputOtpEntry = defineEntry({
  id: "input-otp",
  name: "InputOtp",
  group: "forms",
  description:
    "Código de un solo uso repartido en celdas. Pegar el código completo lo distribuye desde la primera celda, Backspace retrocede y las flechas mueven. Cada celda es un input real con `autoComplete=\"one-time-code\"`, así que el autorrelleno del teléfono lo encuentra.",
  importPath: 'import { InputOtp } from "@/components/forms"',
  sourcePath: "src/components/forms/InputOtp.tsx",
  status: "stable",
  tags: ["form", "auth", "a11y"],
  playground: definePlayground({
    layout: "start",
    controls: {
      length: { type: "number", label: "Celdas", default: 6, min: 4, max: 8, step: 1 },
      grouped: { type: "boolean", label: "Con separador", default: true },
      mask: { type: "boolean", label: "Ocultar", default: false },
      type: { type: "select", options: TYPES, default: "numeric" },
      disabled: { type: "boolean", label: "Deshabilitado", default: false },
    },
    render: ({ length, grouped, mask, type, disabled }) => (
      <PlaygroundDemo length={length} grouped={grouped} mask={mask} type={type as OtpType} disabled={disabled} />
    ),
    code: ({ length, grouped, mask, type, disabled }) => {
      const half = Math.floor(length / 2);
      const attrs = [
        length !== 6 ? `length={${length}}` : "",
        "value={code}",
        "onChange={setCode}",
        "onComplete={verificar}",
        grouped ? `groups={[${half}, ${length - half}]}` : "",
        mask ? "mask" : "",
        type !== "numeric" ? `type="${type}"` : "",
        disabled ? "disabled" : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `const [code, setCode] = React.useState("");

<InputOtp ${attrs} />`;
    },
  }),
  examples: [
    {
      id: "login",
      title: "Verificación en dos pasos del login",
      description: "`onComplete` se dispara al llenar la última celda: es el momento de verificar, sin botón de por medio.",
      layout: "start",
      code: `const [code, setCode] = React.useState("");

<Field label="Verificación en dos pasos" description="Escribe el código de 6 dígitos que enviamos a tu correo.">
  <InputOtp value={code} onChange={setCode} onComplete={verificar} groups={[3, 3]} />
</Field>`,
      render: () => (
        <div className="w-full max-w-md">
          <LoginDemo />
        </div>
      ),
    },
    {
      id: "masked",
      title: "PIN oculto de 4 celdas",
      description: "`mask` convierte cada celda en un campo de contraseña. Úsalo solo si el código es reutilizable.",
      layout: "start",
      code: `<InputOtp length={4} value={code} onChange={setCode} mask aria-label="PIN de la sesión" />`,
      render: () => <MaskedDemo />,
    },
    {
      id: "alphanumeric",
      title: "Código de invitación alfanumérico",
      description: "Con `type=\"alphanumeric\"` se aceptan letras y se guardan en mayúsculas.",
      layout: "start",
      code: `<InputOtp length={6} value={code} onChange={setCode} type="alphanumeric" groups={[3, 3]} aria-label="Código de invitación" />`,
      render: () => (
        <div className="w-full max-w-md">
          <AlphanumericDemo />
        </div>
      ),
    },
    {
      id: "disabled",
      title: "Deshabilitado",
      description: "Mientras se verifica el código, apaga el campo en vez de dejarlo editable.",
      layout: "start",
      code: `<InputOtp value="482915" disabled groups={[3, 3]} />`,
      render: () => <InputOtp value="482915" disabled groups={[3, 3]} aria-label="Código en verificación" />,
    },
  ],
  props: [
    { name: "length", type: "number", default: "6", description: "Número de celdas." },
    { name: "value / onChange", type: "string / (value: string) => void", description: "Valor controlado. Siempre es una cadena compacta, sin huecos." },
    { name: "onComplete", type: "(value: string) => void", description: "Se dispara al llenar la última celda." },
    { name: "mask", type: "boolean", default: "false", description: "Oculta los caracteres, como una contraseña." },
    { name: "groups", type: "number[]", description: "Separadores visuales: `[3, 3]` pinta una raya en la mitad." },
    { name: "type", type: '"numeric" | "alphanumeric"', default: '"numeric"', description: "Qué caracteres se aceptan. El alfanumérico pasa a mayúsculas." },
    { name: "disabled", type: "boolean", description: "Apaga todas las celdas." },
    { name: "autoFocus", type: "boolean", description: "Enfoca la primera celda al montar." },
    { name: "aria-label", type: "string", default: '"Código de verificación"', description: "Etiqueta del grupo; cada celda anuncia su posición." },
  ],
  guidelines: {
    do: [
      "Verifica en `onComplete`: quien escribe un código no espera tener que pulsar «Continuar».",
      "Di en la descripción a dónde se envió el código y ofrece reenviarlo.",
      "Usa `groups` a partir de 6 celdas: leer 482 915 es más fácil que 482915.",
    ],
    dont: [
      "No lo uses para contraseñas ni para códigos largos: a partir de 8 celdas, Input normal.",
      "No borres el código al fallar la verificación sin decirlo; deja el foco en la primera celda y explica el error.",
      "No pongas `mask` en un código de un solo uso que caduca en minutos: estorba más de lo que protege.",
    ],
  },
  related: ["field", "input", "phone-input"],
});
