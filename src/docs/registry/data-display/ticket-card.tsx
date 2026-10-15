import { TicketCard } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/typography";
import { defineEntry, definePlayground } from "../types";

function Stub({ current, total }: { current: number; total: number }) {
  return (
    <>
      <span className="text-xs font-semibold uppercase tracking-wide opacity-80">Parte</span>
      <span className="text-3xl font-semibold tabular-nums">{current}</span>
      <span className="text-xs tabular-nums opacity-80">de {total}</span>
    </>
  );
}

function PlaygroundDemo({ tone, current, total }: { tone: "brand" | "neutral"; current: number; total: number }) {
  return (
    <div className="w-full max-w-sm">
      <TicketCard tone={tone} stub={<Stub current={current} total={total} />} aria-label={`Parte ${current} de ${total} de tu visita`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col">
            <Text size="lg" weight="semibold" truncate>
              Fade
            </Text>
            <Text size="xs" tone="muted" truncate>
              Luego: Corte niño
            </Text>
          </div>
          <Button type="button" variant="ghost" size="sm" className="-mr-2 -mt-1 h-7 shrink-0 text-text-secondary">
            Juntar todo
          </Button>
        </div>
      </TicketCard>
    </div>
  );
}

export const ticketCardEntry = defineEntry({
  id: "ticket-card",
  name: "TicketCard",
  group: "data-display",
  description:
    "Una entrada: a la izquierda el talón —un número, una etiqueta— y, tras una línea de puntos con sus dos muescas, el cuerpo con lo que importa. Sirve para decir «en qué parte vas» sin parecer otra tarjeta más; la reserva la usa para marcar cada parte de una visita en la que cada servicio va con su barbero. En oscuro el cuerpo es grafito; en claro, una superficie blanca con filo: el gris suave se confundía con el fondo.",
  importPath: 'import { TicketCard } from "@/components/data-display"',
  sourcePath: "src/components/data-display/TicketCard.tsx",
  status: "stable",
  tags: ["card", "ticket", "step", "booking"],
  playground: definePlayground({
    controls: {
      tone: { type: "select", label: "Talón", options: ["brand", "neutral"], default: "brand" },
      current: { type: "number", label: "Parte", default: 2, min: 1, max: 9 },
      total: { type: "number", label: "De", default: 3, min: 1, max: 9 },
    },
    render: ({ tone, current, total }) => <PlaygroundDemo tone={tone as "brand" | "neutral"} current={current} total={total} />,
    code: ({ tone, current, total }) => `<TicketCard${tone === "neutral" ? ' tone="neutral"' : ""} stub={<Stub current={${current}} total={${total}} />} aria-label="Parte ${current} de ${total} de tu visita">
  <Text size="lg" weight="semibold">Fade</Text>
  <Text size="xs" tone="muted">Luego: Corte niño</Text>
</TicketCard>`,
  }),
  examples: [
    {
      id: "neutral",
      title: "Talón neutro",
      description: "Con `tone=\"neutral\"` el talón es un gris suave: para cuando el dorado ya está en otra parte de la pantalla.",
      layout: "start",
      code: `<TicketCard tone="neutral" stub={<Stub current={1} total={2} />}>…</TicketCard>`,
      render: () => <PlaygroundDemo tone="neutral" current={1} total={2} />,
    },
  ],
  props: [
    { name: "stub", type: "ReactNode", description: "El talón: número y etiqueta. Es decorativo para el lector de pantalla: repite lo importante en el cuerpo o en `aria-label`." },
    { name: "tone", type: '"brand" | "neutral"', default: '"brand"', description: "Talón relleno de marca o gris suave." },
    { name: "children", type: "ReactNode", description: "El cuerpo: título, lo que sigue y las acciones." },
    { name: "className", type: "string", description: "Solo para el layout de afuera." },
  ],
  guidelines: {
    do: ["Dale un `aria-label` que diga lo que dice el talón («Parte 2 de 3 de tu visita»).", "Mantén el cuerpo corto: dos o tres líneas; es una marca, no un formulario."],
    dont: ["No lo repitas en una lista larga: pierde su gracia y se vuelve una tarjeta más.", "No cambies el borde ni el radio con `className`: las muescas dependen de ellos."],
  },
  related: ["card", "timeline", "progress-ring"],
});
