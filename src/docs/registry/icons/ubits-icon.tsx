import { UbitsIcon, iconRegistry, type IconName, type IconSize, type IconTone } from "@/icons";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";

const ICON_NAMES = Object.keys(iconRegistry) as IconName[];
const SIZES = ["xs", "sm", "md", "lg", "xl"] as const;
const SIZE_PX: Record<IconSize, number> = { xs: 14, sm: 16, md: 24, lg: 32, xl: 40 };
const TONES = ["default", "muted", "primary", "positive", "negative", "warning", "info", "inverse"] as const;

export const ubitsIconEntry = defineEntry({
  id: "ubits-icon",
  name: "UbitsIcon",
  group: "icons",
  description:
    "El wrapper único de iconos del sistema: se pide por nombre semántico del registro, no por proveedor, con tallas de camiseta y tonos semánticos. Así cambiar de Lucide a otro set solo toca `iconRegistry.ts`.",
  importPath: 'import { UbitsIcon } from "@/icons"',
  sourcePath: "src/icons/UbitsIcon.tsx",
  status: "stable",
  tags: ["registro", "lucide", "a11y"],
  playground: definePlayground({
    controls: {
      name: { type: "select", label: "Nombre", options: ICON_NAMES, default: "sparkles" },
      size: { type: "select", options: SIZES, default: "md" },
      tone: { type: "select", options: TONES, default: "default" },
      decorative: { type: "boolean", label: "Decorativo", default: true },
      label: { type: "text", label: "Label (si no es decorativo)", default: "Generado con IA" },
    },
    render: ({ name, size, tone, decorative, label }) => (
      <div className={tone === "inverse" ? "rounded-xl bg-primary p-4" : undefined}>
        <UbitsIcon name={name as IconName} size={size as IconSize} tone={tone as IconTone} decorative={decorative} label={decorative ? undefined : label} />
      </div>
    ),
    code: ({ name, size, tone, decorative, label }) => {
      const attrs = [
        `name="${name}"`,
        size !== "md" ? `size="${size}"` : "",
        tone !== "default" ? `tone="${tone}"` : "",
        decorative ? "" : `decorative={false} label="${label}"`,
      ].filter(Boolean);
      return `<UbitsIcon ${attrs.join(" ")} />`;
    },
  }),
  examples: [
    {
      id: "sizes",
      title: "Tamaños",
      description: "Cinco tallas fijas: xs 14px, sm 16px, md 24px, lg 32px y xl 40px. Dentro de Button el SVG hereda 16px sin necesidad de talla.",
      code: `<UbitsIcon name="analytics" size="xs" />
<UbitsIcon name="analytics" size="sm" />
<UbitsIcon name="analytics" />
<UbitsIcon name="analytics" size="lg" />
<UbitsIcon name="analytics" size="xl" />`,
      render: () => (
        <div className="flex items-end gap-6">
          {SIZES.map((size) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <UbitsIcon name="analytics" size={size} />
              <span className="font-mono text-[11px] text-text-muted">
                {size} · {SIZE_PX[size]}px
              </span>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "tones",
      title: "Tonos",
      description: "Los tonos usan los tokens semánticos del tema; `inverse` es para fondos de color.",
      code: `<UbitsIcon name="success" tone="positive" />
<UbitsIcon name="error" tone="negative" />
<UbitsIcon name="warning" tone="warning" />
<UbitsIcon name="info" tone="info" />
<UbitsIcon name="bolt" tone="primary" />
<UbitsIcon name="settings" tone="muted" />
<span className="rounded-lg bg-primary p-2"><UbitsIcon name="sparkles" tone="inverse" /></span>`,
      render: () => (
        <div className="flex flex-wrap items-center gap-4">
          <UbitsIcon name="success" tone="positive" />
          <UbitsIcon name="error" tone="negative" />
          <UbitsIcon name="warning" tone="warning" />
          <UbitsIcon name="info" tone="info" />
          <UbitsIcon name="bolt" tone="primary" />
          <UbitsIcon name="settings" tone="muted" />
          <span className="rounded-lg bg-primary p-2">
            <UbitsIcon name="sparkles" tone="inverse" />
          </span>
        </div>
      ),
    },
    {
      id: "accessibility",
      title: "Accesibilidad",
      description: "Por defecto el icono es decorativo (`aria-hidden`). Si transmite significado por sí solo, pasa `decorative={false}` y un `label`: se convierte en `role=\"img\"` con `aria-label`.",
      code: `{/* Decorativo: el texto del botón ya lo describe */}
<Button variant="outline"><UbitsIcon name="download" size="sm" /> Exportar</Button>

{/* Significativo: el icono es la única señal */}
<span className="inline-flex items-center gap-2">
  <UbitsIcon name="success" tone="positive" size="sm" decorative={false} label="Encuesta publicada" />
  Clima 2026
</span>`,
      render: () => (
        <div className="flex flex-wrap items-center gap-6">
          <Button variant="outline">
            <UbitsIcon name="download" size="sm" /> Exportar
          </Button>
          <span className="inline-flex items-center gap-2 text-sm text-text-primary">
            <UbitsIcon name="success" tone="positive" size="sm" decorative={false} label="Encuesta publicada" />
            Clima 2026
          </span>
        </div>
      ),
    },
    {
      id: "fallback",
      title: "Nombre desconocido",
      description: "Un nombre que no esté en el registro cae en `IconFallback` (triángulo de alerta), para que se note en revisión en vez de dejar un hueco. TypeScript lo impide en tiempo de compilación.",
      code: `// @ts-expect-error: "rocket" no existe en IconName
<UbitsIcon name="rocket" tone="warning" />`,
      render: () => <UbitsIcon name={"rocket" as IconName} tone="warning" />,
    },
    {
      id: "catalog",
      title: "Catálogo completo",
      description: "Aquí solo una muestra. La rejilla completa con los nombres del registro, copiables y con búsqueda, vive en la página de fundamentos «Iconos».",
      layout: "stretch",
      code: `import { iconRegistry, type IconName } from "@/icons";

const names = Object.keys(iconRegistry) as IconName[];
names.map((name) => <UbitsIcon key={name} name={name} />)`,
      render: () => (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            {ICON_NAMES.slice(0, 16).map((name) => (
              <span key={name} title={name} className="flex size-10 items-center justify-center rounded-lg border border-border/60 bg-surface">
                <UbitsIcon name={name} size="sm" tone="muted" />
              </span>
            ))}
          </div>
          <a href="#/foundations/icons" className="self-start text-sm font-medium text-primary hover:underline">
            Ver los {ICON_NAMES.length} iconos en Fundamentos → Iconos
          </a>
        </div>
      ),
    },
  ],
  props: [
    { name: "name", type: "IconName", description: "Nombre semántico del registro (`iconRegistry.ts`). Obligatorio." },
    { name: "size", type: '"xs" | "sm" | "md" | "lg" | "xl"', default: '"md"', description: "Talla: 14, 16, 24, 32 o 40px." },
    { name: "tone", type: '"default" | "muted" | "primary" | "positive" | "negative" | "warning" | "info" | "inverse"', default: '"default"', description: "Color semántico con tokens del tema." },
    { name: "decorative", type: "boolean", default: "true", description: "Si es `true` se oculta a lectores de pantalla; si es `false` se expone como `role=\"img\"`." },
    { name: "label", type: "string", description: "Texto para `aria-label` cuando `decorative` es `false`." },
    { name: "className", type: "string", description: "Clases extra; útil para el degradado de IA (`text-ai-gradient`) o animaciones." },
  ],
  guidelines: {
    do: ["Pide siempre el icono por su nombre semántico; nunca importes Lucide directamente en un componente.", "Deja `decorative` en `true` cuando hay texto al lado que ya lo describe.", "Añade nombres nuevos al registro y al tipo `IconName` en vez de usar `className` para disfrazar otro icono."],
    dont: ["No uses tamaños arbitrarios con `className`; las cinco tallas son el sistema.", "No uses `tone=\"inverse\"` sobre fondos claros.", "No pongas `label` sin `decorative={false}`: no tendrá efecto."],
  },
  related: ["button", "ai-spark-glyph", "chip"],
});
