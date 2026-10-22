import { Text } from "@/components/typography";
import { defineEntry, definePlayground } from "../types";

const LONG_NAME = "Corte clásico con degradado bajo, perfilado de barba con navaja y toalla caliente";
const LONG_NOTE =
  "El cliente prefiere que no le pasen la máquina por la nuca y pide que se le avise por SMS si el barbero se retrasa más de diez minutos. Trae su propia cera.";

function WidthDemo({ width }: { width: number }) {
  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div className="rounded-md border border-border bg-card p-3" style={{ width }}>
        <Text weight="medium" truncate>
          {LONG_NAME}
        </Text>
        <Text size="sm" tone="secondary" truncate>
          Daniela Osorio · 45 min
        </Text>
      </div>
      <p className="text-[12px] text-text-muted">Pasa el ratón por el texto: solo sale el tooltip si de verdad se corta.</p>
    </div>
  );
}

export const truncationTooltipEntry = defineEntry({
  id: "truncation-tooltip",
  name: "TruncationTooltip",
  group: "overlays",
  description:
    "La regla del sistema para el texto cortado: todo texto que se corta con elipsis muestra el texto completo en un tooltip al pasar el ratón o al llegar con el teclado. Se monta una sola vez junto al `TooltipProvider` global (app, centro de ayuda y reserva) y vigila el documento entero, así que vale para `<Text truncate>`, `truncate`, `text-ellipsis` y `line-clamp-*` en cualquier componente o pantalla, sin envolver nada. Solo aparece cuando el texto no cabe: en móvil, al angostar la ventana o con nombres largos.",
  importPath: 'import { TruncationTooltip } from "@/components/overlays"',
  sourcePath: "src/components/overlays/TruncationTooltip.tsx",
  status: "stable",
  tags: ["tooltip", "truncate", "line-clamp", "global", "a11y"],
  playground: definePlayground({
    controls: {
      width: { type: "select", options: ["160", "240", "360", "640"], default: "240", label: "Ancho (px)" },
    },
    render: ({ width }) => <WidthDemo width={Number(width)} />,
    code: () => `// Nada que montar: ya está en los providers de la app.
<Text weight="medium" truncate>{service.name}</Text>
<span className="truncate">{client.note}</span>`,
  }),
  examples: [
    {
      id: "line-clamp",
      title: "Varias líneas",
      description: "Con `line-clamp-N` pasa lo mismo: si sobran líneas, el tooltip enseña el texto entero.",
      code: `<Text size="sm" className="line-clamp-2">{appointment.note}</Text>`,
      render: () => (
        <div className="w-72 rounded-md border border-border bg-card p-3">
          <Text size="sm" className="line-clamp-2">
            {LONG_NOTE}
          </Text>
        </div>
      ),
    },
    {
      id: "fits",
      title: "Si cabe, no hay tooltip",
      description: "La misma clase `truncate` sobre un texto corto no muestra nada: el tooltip depende de si el texto se corta, no de la clase.",
      code: `<Text truncate>Corte clásico</Text>`,
      render: () => (
        <div className="w-72 rounded-md border border-border bg-card p-3">
          <Text truncate>Corte clásico</Text>
        </div>
      ),
    },
    {
      id: "opt-out",
      title: "Apagarlo en un caso concreto",
      description:
        "`data-truncation-tooltip=\"off\"` en el elemento o en un padre lo apaga, para cuando el texto completo ya se ve al lado o el elemento ya trae su propio tooltip con más contexto. Si ya lleva `Tooltip` o `title`, no hace falta: no se duplica.",
      code: `<div data-truncation-tooltip="off">
  <Text truncate>{LONG_NAME}</Text>
</div>`,
      render: () => (
        <div data-truncation-tooltip="off" className="w-60 rounded-md border border-border bg-card p-3">
          <Text truncate>{LONG_NAME}</Text>
        </div>
      ),
    },
  ],
  props: [
    { name: "(sin props)", type: "—", description: "Se monta una vez en los providers globales. No se usa en pantallas ni componentes." },
    { name: "data-truncation-tooltip=\"off\"", type: "atributo", description: "En el elemento cortado o en un padre: no muestra el tooltip ahí." },
    { name: "isTextTruncated(element)", type: "(element: HTMLElement) => boolean", description: "La comprobación que usa: elipsis o `line-clamp` en el estilo calculado y texto que de verdad sobra." },
  ],
  guidelines: {
    do: [
      "Corta con `truncate` o `line-clamp-N` cuando el espacio manda: el texto completo queda a un hover o un Tab.",
      "Dale al texto cortado un ancho que lo limite (`min-w-0` en flex, un ancho de columna): sin eso no se corta y no hay nada que mostrar.",
      "Lo imprescindible, además, en la ficha o el detalle: en táctil no hay hover.",
    ],
    dont: [
      "No pongas un `Tooltip` o un `title` a mano solo para enseñar el texto completo: ya lo hace esta capa.",
      "No montes un segundo `TruncationTooltip`: con uno global basta.",
      "No apagues la regla por estética; solo cuando el texto completo ya se ve en otro lugar inmediato.",
    ],
  },
  related: ["tooltip", "text"],
});
