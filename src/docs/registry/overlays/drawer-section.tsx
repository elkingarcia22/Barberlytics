import * as React from "react";
import { ListChecks, Plus, Sparkles, Target, Trash2, Users } from "lucide-react";
import { DrawerSection } from "@/components/overlays";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Tone } from "@/lib/tone";
import { defineEntry, definePlayground } from "../types";

const TONES = ["brand", "positive", "warning", "negative", "neutral", "ai"] as const;

const PEOPLE = ["Elena Martínez", "Carlos Ruiz", "Ana Torres"];

function OptionsDemo() {
  const [options, setOptions] = React.useState(["Muy en desacuerdo", "En desacuerdo", "De acuerdo"]);
  const add = () => setOptions((prev) => [...prev, `Opción ${prev.length + 1}`]);
  const remove = (index: number) => setOptions((prev) => prev.filter((_, i) => i !== index));
  return (
    <DrawerSection
      icon={ListChecks}
      tone="brand"
      title="Opciones de respuesta"
      hint="Lo que la persona puede elegir al contestar."
      badge={`${options.length}`}
      action={<Button size="xs" variant="outline" onClick={add}><Plus /> Agregar</Button>}
      className="w-full max-w-md"
    >
      <ul className="space-y-2">
        {options.map((option, index) => (
          <li key={`${option}-${index}`} className="flex items-center gap-2">
            <Input defaultValue={option} className="h-8 text-[13px]" />
            <Button size="icon-sm" variant="ghost" aria-label="Quitar" onClick={() => remove(index)}>
              <Trash2 />
            </Button>
          </li>
        ))}
      </ul>
    </DrawerSection>
  );
}

function StickyDemo() {
  const rows = Array.from({ length: 14 }, (_, index) => PEOPLE[index % PEOPLE.length]);
  return (
    <div className="h-[280px] w-full max-w-md overflow-y-auto rounded-2xl bg-surface-subtle p-3">
      <DrawerSection
        icon={Users}
        tone="neutral"
        title="Participantes"
        hint="Desplázate: la cabecera se queda arriba."
        badge={`${rows.length}`}
        stickyHeader
        action={<Button size="xs" variant="outline"><Plus /> Invitar</Button>}
      >
        <ul className="divide-y divide-border/50">
          {rows.map((name, index) => (
            <li key={index} className="flex items-center justify-between py-2 text-[13px]">
              <span className="text-text-primary">{name}</span>
              <span className="text-text-muted">Pendiente</span>
            </li>
          ))}
        </ul>
      </DrawerSection>
    </div>
  );
}

export const drawerSectionEntry = defineEntry({
  id: "drawer-section",
  name: "DrawerSection",
  group: "overlays",
  description:
    "La tarjeta con la que se arman todos los drawers del producto: chip de icono en su tono, título, una línea de ayuda y, bajo la divisoria, el contenido. Cambian el icono, el tono y el texto; nunca la anatomía.",
  importPath: 'import { DrawerSection } from "@/components/overlays"',
  sourcePath: "src/components/overlays/DrawerSection.tsx",
  status: "stable",
  tags: ["tone", "collapsible", "sticky"],
  playground: definePlayground({
    controls: {
      tone: { type: "select", options: TONES, default: "brand" },
      title: { type: "text", label: "Título", default: "Objetivo del ciclo" },
      badge: { type: "text", label: "Badge", default: "" },
      withAction: { type: "boolean", label: "Con acción", default: false },
      collapsible: { type: "boolean", label: "Plegable", default: false },
      defaultOpen: { type: "boolean", label: "Abierta al inicio", default: true },
    },
    render: ({ tone, title, badge, withAction, collapsible, defaultOpen }) => (
      <DrawerSection
        key={`${collapsible}-${defaultOpen}`}
        icon={Target}
        tone={tone as Tone}
        title={title}
        hint="Lo que el equipo se compromete a lograr este trimestre."
        badge={badge || undefined}
        action={withAction ? <Button size="xs" variant="outline"><Plus /> Agregar</Button> : undefined}
        collapsible={collapsible}
        defaultOpen={defaultOpen}
        className="w-full max-w-md"
      >
        <p className="text-[13px] text-text-secondary">Reducir el tiempo de onboarding de 30 a 20 días manteniendo la satisfacción por encima de 4,5.</p>
      </DrawerSection>
    ),
    code: ({ tone, title, badge, withAction, collapsible, defaultOpen }) => {
      const attrs = [
        "icon={Target}",
        `tone="${tone}"`,
        `title="${title}"`,
        'hint="Lo que el equipo se compromete a lograr este trimestre."',
        badge ? `badge="${badge}"` : "",
        withAction ? "action={<Button size=\"xs\" variant=\"outline\"><Plus /> Agregar</Button>}" : "",
        collapsible ? "collapsible" : "",
        collapsible && defaultOpen ? "defaultOpen" : "",
      ].filter(Boolean);
      return `<DrawerSection\n  ${attrs.join("\n  ")}\n>\n  <p>Reducir el tiempo de onboarding de 30 a 20 días…</p>\n</DrawerSection>`;
    },
  }),
  examples: [
    {
      id: "action",
      title: "Con acción y badge",
      description: "La acción opera sobre el contenido y vive en la cabecera; el badge cuenta lo que hay dentro.",
      code: `const [options, setOptions] = React.useState(["Muy en desacuerdo", "En desacuerdo", "De acuerdo"]);

<DrawerSection
  icon={ListChecks}
  tone="brand"
  title="Opciones de respuesta"
  hint="Lo que la persona puede elegir al contestar."
  badge={String(options.length)}
  action={<Button size="xs" variant="outline" onClick={add}><Plus /> Agregar</Button>}
>
  {options.map((option) => <Input defaultValue={option} />)}
</DrawerSection>`,
      render: () => <OptionsDemo />,
    },
    {
      id: "collapsible",
      title: "Plegable",
      description: "La cabecera entera es el disparador; el chevron indica el estado. Para contenido de referencia.",
      code: `<DrawerSection
  icon={Sparkles}
  tone="ai"
  title="Sugerencias de IA"
  hint="Tres redacciones alternativas para el objetivo."
  collapsible
>
  <ul>…</ul>
</DrawerSection>`,
      render: () => (
        <DrawerSection icon={Sparkles} tone="ai" title="Sugerencias de IA" hint="Tres redacciones alternativas para el objetivo." collapsible className="w-full max-w-md">
          <ul className="space-y-2 text-[13px] text-text-secondary">
            <li className="rounded-lg bg-surface-subtle p-2">Acortar el onboarding a 20 días sin bajar la satisfacción.</li>
            <li className="rounded-lg bg-surface-subtle p-2">Onboarding en 20 días con NPS ≥ 4,5.</li>
            <li className="rounded-lg bg-surface-subtle p-2">Un tercio menos de tiempo de incorporación.</li>
          </ul>
        </DrawerSection>
      ),
    },
    {
      id: "sticky",
      title: "Cabecera fija",
      description: "`stickyHeader` mantiene título y acción a la vista mientras el contenido se desplaza.",
      layout: "stretch",
      code: `<div className="h-[280px] overflow-y-auto">
  <DrawerSection
    icon={Users}
    tone="neutral"
    title="Participantes"
    hint="Desplázate: la cabecera se queda arriba."
    badge="14"
    stickyHeader
    action={<Button size="xs" variant="outline"><Plus /> Invitar</Button>}
  >
    <ul>…</ul>
  </DrawerSection>
</div>`,
      render: () => <StickyDemo />,
    },
  ],
  props: [
    { name: "icon", type: "LucideIcon", description: "Icono del chip de cabecera." },
    { name: "tone", type: '"brand" | "positive" | "warning" | "negative" | "neutral" | "ai"', description: "Tono del chip: fondo claro y glifo en el acento." },
    { name: "title", type: "string", description: "Título de la sección." },
    { name: "hint", type: "string", description: "Una línea que explica para qué sirve." },
    { name: "badge", type: "string", description: "Dato al vuelo junto al título, p. ej. un recuento." },
    { name: "action", type: "React.ReactNode", description: "Acción alineada a la derecha; sus clics no pliegan la sección." },
    { name: "stickyHeader", type: "boolean", description: "Fija la cabecera al hacer scroll dentro del panel." },
    { name: "collapsible", type: "boolean", default: "false", description: "La cabecera pliega y despliega el contenido." },
    { name: "defaultOpen", type: "boolean", default: "false", description: "Si es plegable, arranca abierta." },
    { name: "className / contentClassName", type: "string", description: "Solo para layout (alto, scroll); nunca color ni borde." },
  ],
  guidelines: {
    do: ["Elige el tono por lo que significa el bloque, no por variar colores.", "Usa `stickyHeader` solo cuando la acción vive en la cabecera.", "Apila varias secciones en un drawer con `space-y-3`."],
    dont: ["No metas un acordeón dentro del cuerpo: usa `collapsible`.", "No cambies el borde ni el fondo por `className`; la anatomía es compartida."],
  },
  related: ["drawer-shell", "modal-shell", "button"],
});
