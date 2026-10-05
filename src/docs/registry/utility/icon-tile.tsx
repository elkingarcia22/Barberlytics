import type * as React from "react";
import { AlertTriangle, BarChart3, BookOpen, CalendarPlus, CheckCircle2, ClipboardList, Info, Package, Sparkles, UserPlus, XCircle } from "lucide-react";
import { IconTile } from "@/components/utility/IconTile";
import { defineEntry, definePlayground } from "../types";

const TONES = ["primary", "neutral", "positive", "negative", "warning", "info", "ai"] as const;
type Tone = (typeof TONES)[number];
const SIZES = ["sm", "md", "lg", "xl"] as const;
type Size = (typeof SIZES)[number];
const SHAPES = ["rounded", "circle"] as const;
const SAMPLE_PHOTO = "https://images.unsplash.com/photo-1655394009794-df4f7cd8582a?w=320&h=320&fit=crop&auto=format&q=70";
type Shape = (typeof SHAPES)[number];

const TONE_ICON: Record<Tone, React.ReactNode> = {
  primary: <BookOpen />,
  neutral: <ClipboardList />,
  positive: <CheckCircle2 />,
  negative: <XCircle />,
  warning: <AlertTriangle />,
  info: <Info />,
  ai: <Sparkles />,
};

const SHORTCUTS = [
  { icon: <UserPlus />, tone: "primary", label: "Nueva vacante", hint: "Publica en 4 pasos" },
  { icon: <BookOpen />, tone: "positive", label: "Asignar curso", hint: "A una persona o equipo" },
  { icon: <CalendarPlus />, tone: "warning", label: "Agendar 1:1", hint: "Con tu equipo directo" },
  { icon: <Sparkles />, tone: "ai", label: "Resumen con IA", hint: "De la última encuesta" },
] as const;

export const iconTileEntry = defineEntry({
  id: "icon-tile",
  name: "IconTile",
  group: "utility",
  description:
    "Un icono sobre una baldosa tintada: fondo al 10 % del tono y glifo en el color pleno, en cuatro tamaños (28, 36, 48 y 64px) y dos formas. Es la pieza que da color a atajos, filas de lista y cabeceras de tarjeta sin recurrir a un avatar. Con `src` es la miniatura de una cosa con foto —un servicio, un producto— y el icono queda de respaldo.",
  importPath: 'import { IconTile } from "@/components/utility/IconTile"',
  sourcePath: "src/components/utility/IconTile.tsx",
  status: "stable",
  tags: ["cva", "tone"],
  playground: definePlayground({
    controls: {
      tone: { type: "select", options: TONES, default: "primary" },
      size: { type: "select", options: SIZES, default: "md" },
      shape: { type: "select", options: SHAPES, default: "rounded" },
    },
    render: ({ tone, size, shape }) => <IconTile icon={TONE_ICON[tone as Tone]} tone={tone as Tone} size={size as Size} shape={shape as Shape} />,
    code: ({ tone, size, shape }) => {
      const attrs = ["icon={<Sparkles />}", tone !== "primary" ? `tone="${tone}"` : "", size !== "md" ? `size="${size}"` : "", shape !== "rounded" ? `shape="${shape}"` : ""].filter(Boolean);
      return `<IconTile ${attrs.join(" ")} />`;
    },
  }),
  examples: [
    {
      id: "tones",
      title: "Tonos",
      description: "Seis tonos semánticos más `ai`, que usa el gradiente de IA del sistema con el glifo en blanco.",
      code: `<IconTile icon={<BookOpen />} tone="primary" />
<IconTile icon={<ClipboardList />} tone="neutral" />
<IconTile icon={<CheckCircle2 />} tone="positive" />
<IconTile icon={<XCircle />} tone="negative" />
<IconTile icon={<AlertTriangle />} tone="warning" />
<IconTile icon={<Info />} tone="info" />
<IconTile icon={<Sparkles />} tone="ai" />`,
      render: () => (
        <div className="flex flex-wrap items-center gap-3">
          {TONES.map((tone) => (
            <div key={tone} className="flex flex-col items-center gap-1.5">
              <IconTile icon={TONE_ICON[tone]} tone={tone} />
              <span className="text-[11px] text-text-muted">{tone}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "sizes",
      title: "Tamaños y formas",
      description: "El radio crece con el tamaño (`sm`→`rounded-sm`, `md`→`rounded-md`, `lg`→`rounded-lg`); `circle` lo iguala al avatar.",
      code: `<IconTile icon={<BarChart3 />} size="sm" />
<IconTile icon={<BarChart3 />} size="md" />
<IconTile icon={<BarChart3 />} size="lg" />
<IconTile icon={<BarChart3 />} size="lg" shape="circle" />`,
      render: () => (
        <div className="flex items-end gap-4">
          {SIZES.map((size) => (
            <IconTile key={size} icon={<BarChart3 />} size={size} />
          ))}
          <IconTile icon={<BarChart3 />} size="lg" shape="circle" />
        </div>
      ),
    },
    {
      id: "photo",
      title: "Con foto",
      description: "`src` cubre la baldosa con la foto de la cosa. Mientras carga, si falta o si el enlace falla, se ve el icono: la lista nunca queda con un hueco roto.",
      code: `<IconTile icon={<Package />} tone="neutral" src={product.imageUrl} />
<IconTile icon={<Package />} tone="neutral" src={null} />
<IconTile icon={<Package />} tone="neutral" size="xl" src="/ruta-rota.jpg" />`,
      render: () => (
        <div className="flex items-end gap-4">
          <IconTile icon={<Package />} tone="neutral" src={SAMPLE_PHOTO} />
          <IconTile icon={<Package />} tone="neutral" size="lg" src={SAMPLE_PHOTO} />
          <IconTile icon={<Package />} tone="neutral" size="xl" src={SAMPLE_PHOTO} />
          <IconTile icon={<Package />} tone="neutral" size="xl" src={null} />
          <IconTile icon={<Package />} tone="neutral" size="xl" src="/ruta-rota.jpg" />
        </div>
      ),
    },
    {
      id: "shortcuts",
      title: "Atajos del home",
      description: "Cada atajo lleva una baldosa `lg` con el tono de su dominio; el texto cuelga a la derecha con 12px de separación.",
      layout: "stretch",
      code: `<a className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface p-3 hover:bg-surface-subtle">
  <IconTile icon={<UserPlus />} tone="primary" size="lg" />
  <span className="flex flex-col">
    <span className="text-sm font-medium text-text-primary">Nueva vacante</span>
    <span className="text-xs text-text-secondary">Publica en 4 pasos</span>
  </span>
</a>`,
      render: () => (
        <div className="grid w-full gap-3 sm:grid-cols-2">
          {SHORTCUTS.map((shortcut) => (
            <a
              key={shortcut.label}
              href="#"
              onClick={(event) => event.preventDefault()}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface p-3 shadow-card transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <IconTile icon={shortcut.icon} tone={shortcut.tone} size="lg" />
              <span className="flex flex-col">
                <span className="text-sm font-medium text-text-primary">{shortcut.label}</span>
                <span className="text-xs text-text-secondary">{shortcut.hint}</span>
              </span>
            </a>
          ))}
        </div>
      ),
    },
  ],
  props: [
    { name: "icon", type: "React.ReactNode", description: "El icono. La baldosa fija su tamaño (14, 18 o 24px)." },
    { name: "tone", type: '"primary" | "neutral" | "positive" | "negative" | "warning" | "info" | "ai"', default: '"primary"', description: "Color del tinte y del glifo. `ai` usa el gradiente de IA." },
    { name: "size", type: '"sm" | "md" | "lg" | "xl"', default: '"md"', description: "28, 36, 48 o 64px. `xl` es para la cabecera de una ficha con foto." },
    { name: "src", type: "string | null", description: "La foto de la cosa. Cubre la baldosa; sin ella, mientras carga o si falla, se ve el icono." },
    { name: "shape", type: '"rounded" | "circle"', default: '"rounded"', description: "Esquinas según el tamaño o círculo completo." },
    { name: "...props", type: 'React.HTMLAttributes<"span">', description: "Atributos del span. Lleva `aria-hidden`: el significado va en el texto contiguo." },
  ],
  guidelines: {
    do: ["Asocia un tono a un dominio y mantenlo: formación en `positive`, selección en `primary`, IA en `ai`.", "Acompaña siempre la baldosa de un texto; es decorativa (`aria-hidden`).", "Usa `lg` en atajos y cabeceras de tarjeta, `md` en filas de lista y `sm` en tablas densas.", "Con `src`, deja el icono del tipo de cosa: es lo que se ve si la foto no está."],
    dont: ["No mezcles baldosas y avatares en la misma lista: elige una convención por lista.", "No uses `negative` o `warning` de forma decorativa; son estados.", "No cambies el tamaño del icono con clases: lo controla la baldosa."],
  },
  related: ["list-item", "avatar", "badge", "tag"],
});
