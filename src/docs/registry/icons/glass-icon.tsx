import { GlassIcon, iconRegistry, type GlassSize, type GlassTone, type IconName } from "@/icons";
import { defineEntry, definePlayground } from "../types";

const ICON_NAMES = Object.keys(iconRegistry) as IconName[];
const TONES = ["violet", "blue", "green", "orange", "rose", "amber", "teal", "brand"] as const;
const SIZES = ["48", "64", "96"] as const;

const SHORTCUTS: readonly { name: IconName; tone: GlassTone; title: string; description: string }[] = [
  { name: "survey", tone: "violet", title: "Encuestas", description: "Mide el clima de tu equipo." },
  { name: "graduation", tone: "blue", title: "Aprendizaje", description: "Rutas y cursos asignados." },
  { name: "users", tone: "teal", title: "Colaboradores", description: "Altas, bajas y organigrama." },
];

export const glassIconEntry = defineEntry({
  id: "glass-icon",
  name: "GlassIcon",
  group: "icons",
  description:
    "Ilustración «glass» de 48, 64 o 96px: dos capas de cristal con gradiente, brillo superior y el glifo del registro en blanco. Es para atajos del inicio, indicadores y estados vacíos, siempre acompañada de texto; para iconos en línea sigue siendo ThemaIcon.",
  importPath: 'import { GlassIcon } from "@/icons"',
  sourcePath: "src/icons/GlassIcon.tsx",
  status: "stable",
  tags: ["registro", "svg", "ilustración"],
  playground: definePlayground({
    controls: {
      name: { type: "select", label: "Nombre", options: ICON_NAMES, default: "survey" },
      tone: { type: "select", options: TONES, default: "violet" },
      size: { type: "select", options: SIZES, default: "64" },
      label: { type: "text", label: "Label (vacío = decorativo)", default: "" },
    },
    render: ({ name, tone, size, label }) => (
      <GlassIcon name={name as IconName} tone={tone as GlassTone} size={Number(size) as GlassSize} label={label || undefined} />
    ),
    code: ({ name, tone, size, label }) => {
      const attrs = [`name="${name}"`, tone !== "violet" ? `tone="${tone}"` : "", size !== "64" ? `size={${size}}` : "", label ? `label="${label}"` : ""].filter(Boolean);
      return `<GlassIcon ${attrs.join(" ")} />`;
    },
  }),
  examples: [
    {
      id: "tones",
      title: "Tonos",
      description: "Siete pares de gradiente fijos más `brand`, que sigue al gradiente de marca del tema activo (`--color-brand-gradient-*`).",
      code: `<GlassIcon name="survey" tone="violet" />
<GlassIcon name="calendar" tone="blue" />
<GlassIcon name="success" tone="green" />
<GlassIcon name="bolt" tone="orange" />
<GlassIcon name="notification" tone="rose" />
<GlassIcon name="award" tone="amber" />
<GlassIcon name="analytics" tone="teal" />
<GlassIcon name="sparkles" tone="brand" />`,
      render: () => (
        <div className="flex flex-wrap items-end gap-4">
          {(
            [
              ["survey", "violet"],
              ["calendar", "blue"],
              ["success", "green"],
              ["bolt", "orange"],
              ["notification", "rose"],
              ["award", "amber"],
              ["analytics", "teal"],
              ["sparkles", "brand"],
            ] as const
          ).map(([name, tone]) => (
            <div key={tone} className="flex flex-col items-center gap-2">
              <GlassIcon name={name} tone={tone} />
              <span className="font-mono text-[11px] text-text-muted">{tone}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "sizes",
      title: "Tamaños",
      description: "Tres tamaños cerrados: 48 para indicadores, 64 para atajos y tarjetas, 96 para estados vacíos. El glifo escala con el cristal.",
      code: `<GlassIcon name="users" tone="blue" size={48} />
<GlassIcon name="users" tone="blue" />
<GlassIcon name="users" tone="blue" size={96} />`,
      render: () => (
        <div className="flex items-end gap-6">
          {([48, 64, 96] as const).map((size) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <GlassIcon name="users" tone="blue" size={size} />
              <span className="font-mono text-[11px] text-text-muted">{size}px</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "shortcut",
      title: "Atajo con texto",
      description: "El uso típico: ilustración a la izquierda, título y descripción al lado. La ilustración es decorativa (`aria-hidden`) porque el texto ya la describe.",
      layout: "stretch",
      code: `<a href="/encuestas" className="flex items-center gap-4 rounded-2xl border border-border/60 bg-surface p-4">
  <GlassIcon name="survey" tone="violet" />
  <span>
    <strong className="block text-sm font-semibold text-text-primary">Encuestas</strong>
    <span className="text-[13px] text-text-secondary">Mide el clima de tu equipo.</span>
  </span>
</a>`,
      render: () => (
        <div className="grid gap-3 sm:grid-cols-3">
          {SHORTCUTS.map((shortcut) => (
            <a
              key={shortcut.name}
              href="#/components/glass-icon"
              className="flex items-center gap-4 rounded-2xl border border-border/60 bg-surface p-4 shadow-card transition-colors hover:border-primary/40"
            >
              <GlassIcon name={shortcut.name} tone={shortcut.tone} />
              <span className="min-w-0">
                <strong className="block truncate text-sm font-semibold text-text-primary">{shortcut.title}</strong>
                <span className="block text-[13px] text-text-secondary">{shortcut.description}</span>
              </span>
            </a>
          ))}
        </div>
      ),
    },
    {
      id: "empty-state",
      title: "Estado vacío",
      description: "A 96px y con `tone=\"brand\"` encabeza un estado vacío sin competir con el título.",
      layout: "stretch",
      code: `<div className="flex flex-col items-center gap-3 py-8 text-center">
  <GlassIcon name="users" tone="brand" size={96} />
  <p className="text-base font-semibold text-text-primary">Aún no hay colaboradores</p>
  <p className="text-sm text-text-secondary">Importa tu plantilla o invita al primero.</p>
</div>`,
      render: () => (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <GlassIcon name="users" tone="brand" size={96} />
          <p className="text-base font-semibold text-text-primary">Aún no hay colaboradores</p>
          <p className="text-sm text-text-secondary">Importa tu plantilla o invita al primero.</p>
        </div>
      ),
    },
    {
      id: "accessibility",
      title: "Accesibilidad",
      description: "Sin `label` el SVG lleva `aria-hidden`. Si la ilustración es la única señal (un indicador sin texto), dale `label` y pasa a `role=\"img\"`.",
      code: `{/* Decorativa: el texto la describe */}
<GlassIcon name="success" tone="green" size={48} /> Publicada

{/* Significativa: sin texto al lado */}
<GlassIcon name="success" tone="green" size={48} label="Publicada" />`,
      render: () => (
        <div className="flex flex-wrap items-center gap-8">
          <span className="inline-flex items-center gap-3 text-sm text-text-primary">
            <GlassIcon name="success" tone="green" size={48} /> Publicada
          </span>
          <GlassIcon name="success" tone="green" size={48} label="Publicada" />
        </div>
      ),
    },
  ],
  props: [
    { name: "name", type: "IconName", description: "Nombre semántico del glifo; reutiliza el mismo registro que ThemaIcon. Obligatorio." },
    { name: "tone", type: '"violet" | "blue" | "green" | "orange" | "rose" | "amber" | "teal" | "brand"', default: '"violet"', description: "Par de gradiente. `brand` usa las variables del gradiente de marca del tema." },
    { name: "size", type: "48 | 64 | 96", default: "64", description: "Lado del cuadrado en píxeles." },
    { name: "label", type: "string", description: "Etiqueta accesible. Sin ella la ilustración es decorativa (`aria-hidden`); con ella pasa a `role=\"img\"`." },
    { name: "className", type: "string", description: "Clases extra del SVG (p. ej. una sombra o un margen)." },
  ],
  guidelines: {
    do: [
      "Acompáñala siempre de texto: es una ilustración, no un icono de acción.",
      "Elige un tono por significado y mantenlo en toda la app: la misma función, el mismo color.",
      "Usa `brand` cuando la ilustración represente al producto o a la empresa, no a un módulo.",
    ],
    dont: [
      "No la uses en botones, celdas de tabla ni a menos de 48px; ahí va ThemaIcon.",
      "No mezcles más de tres o cuatro tonos en la misma vista.",
      "No pongas `label` si ya hay texto al lado: se leería dos veces.",
    ],
  },
  related: ["thema-icon", "empty-state", "badge"],
});
