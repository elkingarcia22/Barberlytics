import * as React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";

const FAQ = [
  { id: "plans", question: "¿Puedo cambiar de plan más adelante?", answer: "Sí. El cambio se aplica al instante y el cobro se prorratea en la siguiente factura." },
  { id: "seats", question: "¿Cómo se cuentan los asientos?", answer: "Cada usuario activo del mes cuenta como un asiento; los invitados en pausa no se facturan." },
  { id: "support", question: "¿Qué incluye el soporte?", answer: "Chat en horario laboral y respuesta en menos de 24 horas para incidencias críticas." },
] as const;

function FaqItems() {
  return (
    <>
      {FAQ.map((item) => (
        <AccordionItem key={item.id} value={item.id}>
          <AccordionTrigger>{item.question}</AccordionTrigger>
          <AccordionContent>{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </>
  );
}

function ControlledAccordion() {
  const [open, setOpen] = React.useState<string[]>(["plans"]);
  return (
    <div className="w-full space-y-3">
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setOpen(FAQ.map((item) => item.id))}>
          Expandir todo
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen([])}>
          Colapsar todo
        </Button>
      </div>
      <Accordion type="multiple" value={open} onValueChange={setOpen}>
        <FaqItems />
      </Accordion>
    </div>
  );
}

export const accordionEntry = defineEntry({
  id: "accordion",
  name: "Accordion",
  group: "ui",
  description:
    "Lista de secciones plegables con un encabezado que muestra u oculta su contenido. Úsalo para preguntas frecuentes, ajustes agrupados o cualquier contenido largo que el usuario no necesita ver de golpe.",
  importPath: 'import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"',
  sourcePath: "src/components/ui/accordion.tsx",
  status: "stable",
  tags: ["radix"],
  playground: definePlayground({
    controls: {
      type: { type: "select", options: ["single", "multiple"], default: "single" },
      collapsible: { type: "boolean", label: "Colapsable (solo single)", default: true },
      disabled: { type: "boolean", default: false },
    },
    layout: "stretch",
    render: ({ type, collapsible, disabled }) =>
      type === "multiple" ? (
        <Accordion type="multiple" disabled={disabled} defaultValue={["plans"]}>
          <FaqItems />
        </Accordion>
      ) : (
        <Accordion type="single" collapsible={collapsible} disabled={disabled} defaultValue="plans">
          <FaqItems />
        </Accordion>
      ),
    code: ({ type, collapsible, disabled }) => {
      const attrs = [
        `type="${type}"`,
        type === "single" && collapsible ? "collapsible" : "",
        disabled ? "disabled" : "",
        type === "multiple" ? 'defaultValue={["plans"]}' : 'defaultValue="plans"',
      ]
        .filter(Boolean)
        .join(" ");
      return `<Accordion ${attrs}>
  <AccordionItem value="plans">
    <AccordionTrigger>¿Puedo cambiar de plan más adelante?</AccordionTrigger>
    <AccordionContent>Sí. El cambio se aplica al instante…</AccordionContent>
  </AccordionItem>
  <AccordionItem value="seats">…</AccordionItem>
  <AccordionItem value="support">…</AccordionItem>
</Accordion>`;
    },
  }),
  examples: [
    {
      id: "single",
      title: "Una sección a la vez",
      description: "`type=\"single\"` con `collapsible` permite cerrar la sección abierta.",
      layout: "stretch",
      code: `<Accordion type="single" collapsible defaultValue="plans">
  <AccordionItem value="plans">
    <AccordionTrigger>¿Puedo cambiar de plan más adelante?</AccordionTrigger>
    <AccordionContent>Sí. El cambio se aplica al instante y el cobro se prorratea.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="seats">
    <AccordionTrigger>¿Cómo se cuentan los asientos?</AccordionTrigger>
    <AccordionContent>Cada usuario activo del mes cuenta como un asiento.</AccordionContent>
  </AccordionItem>
</Accordion>`,
      render: () => (
        <Accordion type="single" collapsible defaultValue="plans">
          <FaqItems />
        </Accordion>
      ),
    },
    {
      id: "multiple",
      title: "Varias abiertas",
      description: "Con `type=\"multiple\"` cada sección se abre y cierra de forma independiente.",
      layout: "stretch",
      code: `<Accordion type="multiple" defaultValue={["plans", "support"]}>
  <AccordionItem value="plans">…</AccordionItem>
  <AccordionItem value="seats">…</AccordionItem>
  <AccordionItem value="support">…</AccordionItem>
</Accordion>`,
      render: () => (
        <Accordion type="multiple" defaultValue={["plans", "support"]}>
          <FaqItems />
        </Accordion>
      ),
    },
    {
      id: "controlled",
      title: "Controlado",
      description: "El estado vive fuera: útil para botones de «expandir todo» o para sincronizar con la URL.",
      layout: "stretch",
      code: `const [open, setOpen] = React.useState<string[]>(["plans"]);

<Button size="sm" variant="outline" onClick={() => setOpen(["plans", "seats", "support"])}>Expandir todo</Button>
<Button size="sm" variant="ghost" onClick={() => setOpen([])}>Colapsar todo</Button>

<Accordion type="multiple" value={open} onValueChange={setOpen}>
  …
</Accordion>`,
      render: () => <ControlledAccordion />,
    },
  ],
  props: [
    { name: "type", type: '"single" | "multiple"', description: "Si solo una sección puede estar abierta o varias a la vez." },
    { name: "collapsible", type: "boolean", default: "false", description: "En modo single, permite cerrar la sección abierta haciendo clic de nuevo." },
    { name: "value / defaultValue", type: "string | string[]", description: "Sección(es) abierta(s). Usa `value` + `onValueChange` para controlarlo." },
    { name: "onValueChange", type: "(value) => void", description: "Se dispara cuando cambia la sección abierta." },
    { name: "disabled", type: "boolean", default: "false", description: "Desactiva todos los triggers." },
    { name: "AccordionItem.value", type: "string", description: "Identificador único de la sección (obligatorio)." },
  ],
  guidelines: {
    do: ["Redacta los encabezados como preguntas o títulos cortos que anticipen el contenido.", "Abre por defecto la sección más relevante si el usuario la necesita de inmediato.", "Usa `multiple` cuando el usuario compara información entre secciones."],
    dont: ["No escondas en un acordeón contenido crítico o acciones primarias.", "No anides acordeones dentro de acordeones.", "No lo uses para navegación; para eso están Tabs o la sub-navegación."],
  },
  related: ["tabs", "card"],
});
