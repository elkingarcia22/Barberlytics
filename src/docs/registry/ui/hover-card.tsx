import { CalendarDays, Info } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { defineEntry, definePlayground } from "../types";

const SIDES = ["bottom", "top", "left", "right"] as const;
const ALIGNS = ["center", "start", "end"] as const;

function ProfilePreview() {
  return (
    <div className="flex gap-3">
      <Avatar size="lg">
        <AvatarImage src="https://github.com/shadcn.png" alt="Ana Torres" />
        <AvatarFallback>AT</AvatarFallback>
      </Avatar>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-text-primary">Ana Torres</p>
        <p className="text-[13px] text-text-secondary">Líder de Talento · Bogotá</p>
        <p className="flex items-center gap-1 text-xs text-text-muted">
          <CalendarDays className="size-3" /> En Thema desde marzo 2023
        </p>
      </div>
    </div>
  );
}

export const hoverCardEntry = defineEntry({
  id: "hover-card",
  name: "HoverCard",
  group: "ui",
  description:
    "Panel flotante que aparece al pasar el cursor (o enfocar) un elemento, con el mismo lenguaje visual que Popover. Úsalo para previsualizar información de paso, como un perfil o una definición; para contenido que el usuario abre y cierra a propósito usa Popover.",
  importPath: 'import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"',
  sourcePath: "src/components/ui/hover-card.tsx",
  status: "stable",
  tags: ["radix"],
  playground: definePlayground({
    controls: {
      side: { type: "select", options: SIDES, default: "bottom" },
      align: { type: "select", options: ALIGNS, default: "center" },
      openDelay: { type: "number", label: "Retardo de apertura (ms)", default: 150, min: 0, max: 1000, step: 50 },
    },
    render: ({ side, align, openDelay }) => (
      <HoverCard openDelay={openDelay}>
        <HoverCardTrigger asChild>
          <Button variant="link">@ana.torres</Button>
        </HoverCardTrigger>
        <HoverCardContent side={side as (typeof SIDES)[number]} align={align as (typeof ALIGNS)[number]}>
          <ProfilePreview />
        </HoverCardContent>
      </HoverCard>
    ),
    code: ({ side, align, openDelay }) => {
      const contentAttrs = [side !== "bottom" ? `side="${side}"` : "", align !== "center" ? `align="${align}"` : ""].filter(Boolean).join(" ");
      return `<HoverCard${openDelay !== 150 ? ` openDelay={${openDelay}}` : ""}>
  <HoverCardTrigger asChild>
    <Button variant="link">@ana.torres</Button>
  </HoverCardTrigger>
  <HoverCardContent${contentAttrs ? ` ${contentAttrs}` : ""}>
    <ProfilePreview />
  </HoverCardContent>
</HoverCard>`;
    },
  }),
  examples: [
    {
      id: "profile",
      title: "Vista previa de perfil",
      description: "Pasa el cursor sobre la mención. El trigger es un enlace real, así que también se abre con el foco del teclado.",
      code: `<HoverCard>
  <HoverCardTrigger asChild>
    <a href="#/people/ana" className="font-medium text-primary hover:underline">@ana.torres</a>
  </HoverCardTrigger>
  <HoverCardContent>
    <div className="flex gap-3">
      <Avatar size="lg"><AvatarImage src="…" /><AvatarFallback>AT</AvatarFallback></Avatar>
      <div>
        <p className="text-sm font-semibold">Ana Torres</p>
        <p className="text-[13px] text-text-secondary">Líder de Talento · Bogotá</p>
      </div>
    </div>
  </HoverCardContent>
</HoverCard>`,
      render: () => (
        <p className="text-sm text-text-secondary">
          Asignado por{" "}
          <HoverCard>
            <HoverCardTrigger asChild>
              <a href="#/people/ana" className="font-medium text-primary hover:underline">
                @ana.torres
              </a>
            </HoverCardTrigger>
            <HoverCardContent>
              <ProfilePreview />
            </HoverCardContent>
          </HoverCard>{" "}
          hace 2 días.
        </p>
      ),
    },
    {
      id: "definition",
      title: "Definición de un término",
      description: "Un icono de información junto a una métrica explica cómo se calcula sin ocupar espacio.",
      code: `<HoverCard>
  <HoverCardTrigger asChild>
    <button type="button" aria-label="¿Qué es la tasa de finalización?"><Info className="size-4" /></button>
  </HoverCardTrigger>
  <HoverCardContent side="right" className="w-64">
    <p className="text-sm font-medium">Tasa de finalización</p>
    <p className="text-[13px] text-text-secondary">Porcentaje de inscritos que completaron todos los módulos en los últimos 30 días.</p>
  </HoverCardContent>
</HoverCard>`,
      render: () => (
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-surface px-4 py-3">
          <div>
            <p className="text-xs text-text-muted">Tasa de finalización</p>
            <p className="text-2xl font-bold text-text-primary">78%</p>
          </div>
          <HoverCard>
            <HoverCardTrigger asChild>
              <button type="button" aria-label="¿Qué es la tasa de finalización?" className="ml-2 rounded-md p-1 text-text-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                <Info className="size-4" />
              </button>
            </HoverCardTrigger>
            <HoverCardContent side="right" className="w-64">
              <p className="text-sm font-medium text-text-primary">Tasa de finalización</p>
              <p className="text-[13px] text-text-secondary">Porcentaje de inscritos que completaron todos los módulos en los últimos 30 días.</p>
            </HoverCardContent>
          </HoverCard>
        </div>
      ),
    },
    {
      id: "status",
      title: "Detalle de un badge",
      code: `<HoverCard openDelay={300}>
  <HoverCardTrigger asChild>
    <Badge variant="outline" className="cursor-default border-warning/40 text-warning">Pendiente</Badge>
  </HoverCardTrigger>
  <HoverCardContent side="top" className="w-56">
    <p className="text-[13px] text-text-secondary">Esperando aprobación del manager desde el 12 de septiembre.</p>
  </HoverCardContent>
</HoverCard>`,
      render: () => (
        <HoverCard openDelay={300}>
          <HoverCardTrigger asChild>
            <Badge variant="outline" className="cursor-default border-warning/40 text-warning" tabIndex={0}>
              Pendiente
            </Badge>
          </HoverCardTrigger>
          <HoverCardContent side="top" className="w-56">
            <p className="text-[13px] text-text-secondary">Esperando aprobación del manager desde el 12 de septiembre.</p>
          </HoverCardContent>
        </HoverCard>
      ),
    },
  ],
  props: [
    { name: "openDelay", type: "number", default: "150", description: "Milisegundos antes de abrir tras entrar con el cursor." },
    { name: "closeDelay", type: "number", default: "100", description: "Milisegundos antes de cerrar tras salir." },
    { name: "open / onOpenChange", type: "boolean / (open) => void", description: "Control externo del estado." },
    { name: "HoverCardContent.side", type: '"top" | "bottom" | "left" | "right"', default: '"bottom"', description: "Lado preferido; se invierte si no cabe." },
    { name: "HoverCardContent.align", type: '"start" | "center" | "end"', default: '"center"', description: "Alineación respecto al trigger." },
    { name: "HoverCardContent.sideOffset", type: "number", default: "4", description: "Separación con el trigger en px." },
    { name: "HoverCardContent.className", type: "string", description: "Sobrescribe el ancho (`w-72` por defecto) u otros estilos." },
  ],
  guidelines: {
    do: ["Usa un trigger enfocable (enlace o botón) para que funcione con teclado.", "Limita el contenido a texto, avatar y badges; nada que requiera clic.", "Sube el `openDelay` si el trigger está en una lista densa para evitar aperturas accidentales."],
    dont: ["No metas botones ni formularios dentro; el panel se cierra al salir.", "No lo uses en pantallas táctiles como único acceso a información importante.", "No lo confundas con Tooltip: si cabe en una línea, usa Tooltip."],
  },
  related: ["popover", "tooltip", "avatar"],
});
