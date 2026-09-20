import { ArrowRight, Download, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";

const VARIANTS = ["default", "outline", "secondary", "ghost", "destructive", "link"] as const;
const SIZES = ["xs", "sm", "default", "lg", "icon-xs", "icon-sm", "icon", "icon-lg"] as const;

export const buttonEntry = defineEntry({
  id: "button",
  name: "Button",
  group: "ui",
  description:
    "La acción del sistema. Seis variantes por intención (primaria, contorno, secundaria, fantasma, destructiva y enlace) y una escala de tamaños compacta pensada para interfaces densas.",
  importPath: 'import { Button } from "@/components/ui/button"',
  sourcePath: "src/components/ui/button.tsx",
  status: "stable",
  tags: ["cva", "radix-slot"],
  playground: definePlayground({
    controls: {
      variant: { type: "select", options: VARIANTS, default: "default" },
      size: { type: "select", options: SIZES, default: "default" },
      label: { type: "text", default: "Guardar cambios" },
      withIcon: { type: "boolean", label: "Con icono", default: false },
      disabled: { type: "boolean", default: false },
    },
    render: ({ variant, size, label, withIcon, disabled }) => {
      const isIcon = size.startsWith("icon");
      return (
        <Button variant={variant as (typeof VARIANTS)[number]} size={size as (typeof SIZES)[number]} disabled={disabled} aria-label={isIcon ? label : undefined}>
          {(withIcon || isIcon) && <Plus />}
          {!isIcon && label}
        </Button>
      );
    },
    code: ({ variant, size, label, withIcon, disabled }) => {
      const isIcon = size.startsWith("icon");
      const attrs = [
        variant !== "default" ? `variant="${variant}"` : "",
        size !== "default" ? `size="${size}"` : "",
        disabled ? "disabled" : "",
      ]
        .filter(Boolean)
        .join(" ");
      const open = attrs ? `<Button ${attrs}>` : "<Button>";
      const body = isIcon ? "<Plus />" : withIcon ? `<Plus /> ${label}` : label;
      return `${open}${body}</Button>`;
    },
  }),
  examples: [
    {
      id: "variants",
      title: "Variantes",
      description: "Una primaria por pantalla; el resto acompaña.",
      code: `<Button>Primaria</Button>
<Button variant="outline">Contorno</Button>
<Button variant="secondary">Secundaria</Button>
<Button variant="ghost">Fantasma</Button>
<Button variant="destructive">Eliminar</Button>
<Button variant="link">Enlace</Button>`,
      render: () => (
        <div className="flex flex-wrap items-center gap-2">
          <Button>Primaria</Button>
          <Button variant="outline">Contorno</Button>
          <Button variant="secondary">Secundaria</Button>
          <Button variant="ghost">Fantasma</Button>
          <Button variant="destructive">Eliminar</Button>
          <Button variant="link">Enlace</Button>
        </div>
      ),
    },
    {
      id: "sizes",
      title: "Tamaños",
      description: "De xs (24px) a lg (36px). El tamaño por defecto es de 32px, la altura del header.",
      code: `<Button size="xs">Extra pequeño</Button>
<Button size="sm">Pequeño</Button>
<Button>Normal</Button>
<Button size="lg">Grande</Button>`,
      render: () => (
        <div className="flex flex-wrap items-center gap-2">
          <Button size="xs">Extra pequeño</Button>
          <Button size="sm">Pequeño</Button>
          <Button>Normal</Button>
          <Button size="lg">Grande</Button>
        </div>
      ),
    },
    {
      id: "icons",
      title: "Con icono",
      description: "Los SVG heredan 16px y la separación correcta; para solo icono usa las variantes icon-*.",
      code: `<Button><Download /> Descargar</Button>
<Button variant="outline">Siguiente <ArrowRight /></Button>
<Button size="icon" aria-label="Añadir"><Plus /></Button>
<Button size="icon-sm" variant="destructive" aria-label="Eliminar"><Trash2 /></Button>`,
      render: () => (
        <div className="flex flex-wrap items-center gap-2">
          <Button>
            <Download /> Descargar
          </Button>
          <Button variant="outline">
            Siguiente <ArrowRight />
          </Button>
          <Button size="icon" aria-label="Añadir">
            <Plus />
          </Button>
          <Button size="icon-sm" variant="destructive" aria-label="Eliminar">
            <Trash2 />
          </Button>
        </div>
      ),
    },
    {
      id: "states",
      title: "Cargando y deshabilitado",
      code: `<Button disabled><Loader2 className="animate-spin" /> Guardando…</Button>
<Button variant="outline" disabled>Deshabilitado</Button>`,
      render: () => (
        <div className="flex flex-wrap items-center gap-2">
          <Button disabled>
            <Loader2 className="animate-spin" /> Guardando…
          </Button>
          <Button variant="outline" disabled>
            Deshabilitado
          </Button>
        </div>
      ),
    },
    {
      id: "as-child",
      title: "Como enlace (asChild)",
      description: "Con `asChild` el estilo se aplica al hijo, así un enlace real conserva su semántica.",
      code: `<Button asChild>
  <a href="#/foundations/themes">Ir a temas</a>
</Button>`,
      render: () => (
        <Button asChild>
          <a href="#/foundations/themes">Ir a temas</a>
        </Button>
      ),
    },
  ],
  props: [
    { name: "variant", type: '"default" | "outline" | "secondary" | "ghost" | "destructive" | "link"', default: '"default"', description: "Intención visual del botón." },
    { name: "size", type: '"xs" | "sm" | "default" | "lg" | "icon-xs" | "icon-sm" | "icon" | "icon-lg"', default: '"default"', description: "Altura y padding. Las variantes icon-* son cuadradas." },
    { name: "asChild", type: "boolean", default: "false", description: "Renderiza el hijo (p. ej. un <a>) con los estilos del botón." },
    { name: "disabled", type: "boolean", default: "false", description: "Desactiva el botón y baja la opacidad al 50%." },
    { name: "...props", type: 'React.ComponentProps<"button">', description: "Cualquier atributo nativo de <button>." },
  ],
  guidelines: {
    do: ["Una sola acción primaria por vista o por drawer.", "Usa `destructive` solo para acciones irreversibles.", "Añade `aria-label` a los botones de solo icono."],
    dont: ["No uses `link` para acciones que cambian datos.", "No mezcles tamaños dentro del mismo grupo de acciones."],
  },
  related: ["badge", "ai-button"],
});
