import * as React from "react";
import { Field, Rating, type RatingSize, type RatingTone } from "@/components/forms";
import { defineEntry, definePlayground } from "../types";

const SIZES = ["sm", "default", "lg"] as const;
const TONES = ["warning", "primary"] as const;

function RateSessionDemo() {
  const [value, setValue] = React.useState(0);
  return (
    <Field
      label="Califica esta sesión de formación"
      description="Se guarda al soltar; una estrella basta para enviar la nota."
      error={value > 0 && value < 2 ? "¿Seguro? Cuéntanos qué falló en los comentarios." : undefined}
    >
      <Rating value={value} onValueChange={setValue} allowHalf label="Calificación de la sesión" />
    </Field>
  );
}

export const ratingEntry = defineEntry({
  id: "rating",
  name: "Rating",
  group: "forms",
  description:
    "Puntuación con estrellas para encuestas de satisfacción y evaluaciones. Editable es un radiogroup con una sola parada de tabulación y flechas; de solo lectura es un dato (`role=\"img\"`), no un control, así que úsalo así en tablas y resúmenes.",
  importPath: 'import { Rating } from "@/components/forms"',
  sourcePath: "src/components/forms/Rating.tsx",
  status: "stable",
  tags: ["form", "a11y", "readonly-o-controlado"],
  playground: definePlayground({
    controls: {
      size: { type: "select", options: SIZES, default: "default" },
      tone: { type: "select", options: TONES, default: "warning" },
      allowHalf: { type: "boolean", label: "Medias estrellas", default: true },
      showValue: { type: "boolean", label: "Mostrar valor", default: true },
    },
    render: ({ size, tone, allowHalf, showValue }) => (
      <Rating
        defaultValue={3.5}
        size={size as RatingSize}
        tone={tone as RatingTone}
        allowHalf={allowHalf}
        showValue={showValue}
        label="Calificación"
      />
    ),
    code: ({ size, tone, allowHalf, showValue }) => {
      const attrs = [
        "defaultValue={3.5}",
        size !== "default" ? `size="${size}"` : "",
        tone !== "warning" ? `tone="${tone}"` : "",
        allowHalf ? "allowHalf" : "",
        showValue ? "showValue" : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `<Rating ${attrs} label="Calificación" />`;
    },
  }),
  examples: [
    {
      id: "satisfaction",
      title: "Satisfacción de una sesión de formación",
      description: "De solo lectura, con `showValue` para leer «4,2 de 5» sin contar estrellas a ojo.",
      code: `<Rating value={4.2} allowHalf readOnly showValue label="Satisfacción con la sesión" />`,
      render: () => <Rating value={4.2} allowHalf readOnly showValue label="Satisfacción con la sesión" />,
    },
    {
      id: "performance-row",
      title: "Evaluación de desempeño en una fila de tabla",
      description: "Tamaño `sm` de solo lectura, alineado con el resto de la fila; no lleva `showValue` porque el número ya está en la columna de al lado.",
      code: `<div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
  <span className="text-text-primary">Renata Gómez · Líder de equipo</span>
  <div className="flex items-center gap-3">
    <Rating value={3} size="sm" tone="primary" readOnly label="Evaluación de desempeño" />
    <span className="tabular-nums text-text-secondary">3,0</span>
  </div>
</div>`,
      render: () => (
        <div className="flex w-full items-center justify-between gap-4 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
          <span className="text-text-primary">Renata Gómez · Líder de equipo</span>
          <div className="flex items-center gap-3">
            <Rating value={3} size="sm" tone="primary" readOnly label="Evaluación de desempeño" />
            <span className="tabular-nums text-text-secondary">3,0</span>
          </div>
        </div>
      ),
      layout: "stretch",
    },
    {
      id: "average",
      title: "Promedio general con media estrella",
      description: "Tamaño `lg` para un dato destacado, como el resumen de una escuela o un programa completo.",
      code: `<Rating value={4.6} allowHalf readOnly showValue size="lg" label="Promedio del programa" />`,
      render: () => <Rating value={4.6} allowHalf readOnly showValue size="lg" label="Promedio del programa" />,
    },
    {
      id: "editable",
      title: "Calificar una sesión (editable)",
      description: "Controlado con `Field`: la nota se emite en cada clic o con las flechas del teclado sobre el radiogroup.",
      code: `const [value, setValue] = React.useState(0);

<Field label="Califica esta sesión de formación">
  <Rating value={value} onValueChange={setValue} allowHalf label="Calificación de la sesión" />
</Field>`,
      render: () => (
        <div className="w-full max-w-sm">
          <RateSessionDemo />
        </div>
      ),
      layout: "start",
    },
  ],
  props: [
    { name: "value", type: "number", description: "Valor controlado, de 0 a `max`." },
    { name: "defaultValue", type: "number", description: "Valor inicial cuando no está controlado." },
    { name: "onValueChange", type: "(value: number) => void", description: "Se llama al elegir una estrella (o media, con `allowHalf`)." },
    { name: "max", type: "number", default: "5", description: "Número de estrellas." },
    { name: "allowHalf", type: "boolean", default: "false", description: "Permite medias estrellas (pasos de 0,5)." },
    { name: "readOnly", type: "boolean", default: "false", description: "Lo convierte en un dato (`role=\"img\"`): sin botones, sin foco, con el puntaje en el `aria-label`." },
    { name: "disabled", type: "boolean", default: "false", description: "Apaga la interacción y baja la opacidad." },
    { name: "size", type: '"sm" | "default" | "lg"', default: '"default"', description: "Tamaño del icono, el texto del valor y el espaciado entre estrellas." },
    { name: "tone", type: '"warning" | "primary"', default: '"warning"', description: "Color de relleno de las estrellas activas." },
    { name: "icon", type: "React.ReactNode", description: "Reemplaza la estrella por otro icono (p. ej. un corazón)." },
    { name: "label", type: "string", description: "Nombre accesible del grupo. Sin él, se anuncia «Puntuación» (editable) o el puntaje leído (solo lectura)." },
    { name: "showValue", type: "boolean", default: "false", description: "Muestra «4,2 de 5» junto a las estrellas, con formato numérico es-CO." },
    { name: "id / className", type: "string", description: "Se aplican al contenedor externo." },
  ],
  guidelines: {
    do: [
      "Usa `readOnly` para mostrar un dato ya calculado (promedios, evaluaciones cerradas): no es un botón.",
      "Pon `allowHalf` solo si el dato realmente tiene precisión de 0,5; si no, el radiogroup ofrece pasos que no existen en tus datos.",
      "Da un `label` descriptivo («Satisfacción con la sesión», no «Rating») para que el lector de pantalla anuncie algo útil.",
    ],
    dont: [
      "No lo uses como un «me gusta» binario: para eso está un botón o un Switch.",
      "No mezcles tamaños de Rating en la misma tabla o listado.",
      "No dupliques el número si ya usas `showValue`; una sola fuente de verdad por fila.",
    ],
  },
  related: ["field", "number-field", "badge"],
});
