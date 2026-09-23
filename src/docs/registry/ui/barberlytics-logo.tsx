import type * as React from "react";
import { BarberlyticsLogo, type BarberlyticsLogoGradient, type BarberlyticsLogoVariant } from "@/components/ui/BarberlyticsLogo";
import { cn } from "@/lib/utils";
import { defineEntry, definePlayground } from "../types";

const VARIANTS = ["wordmark", "mark"] as const;
const GRADIENTS = ["brand", "ai", "mono"] as const;
const SIZES = [16, 24, 32, 48];

function Surface({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-center justify-center gap-8 rounded-xl border border-border/60 bg-surface p-6 text-text-primary", className)}>{children}</div>;
}

export const barberlyticsLogoEntry = defineEntry({
  id: "barberlytics-logo",
  name: "BarberlyticsLogo",
  group: "ui",
  description:
    "El logotipo de Barberlytics como SVG inline que sigue al tema: «Barber» en `currentColor`, «lytics» y la flecha en el gradiente de marca del tema activo. Sin props de color; el modo claro u oscuro lo resuelve el contenedor. `variant=\"mark\"` deja la flecha sola como isotipo.",
  importPath: 'import { BarberlyticsLogo } from "@/components/ui/BarberlyticsLogo"',
  sourcePath: "src/components/ui/BarberlyticsLogo.tsx",
  status: "stable",
  tags: ["marca", "logo", "svg", "tema"],
  playground: definePlayground({
    controls: {
      variant: { type: "select", options: VARIANTS, default: "wordmark" },
      gradient: { type: "select", options: GRADIENTS, default: "brand" },
      height: { type: "number", label: "Alto", default: 40, min: 16, max: 120, step: 4 },
    },
    render: ({ variant, gradient, height }) => (
      <Surface>
        <BarberlyticsLogo variant={variant as BarberlyticsLogoVariant} gradient={gradient as BarberlyticsLogoGradient} height={height} />
      </Surface>
    ),
    code: ({ variant, gradient, height }) => {
      const attrs = [
        variant !== "wordmark" ? `variant="${variant}"` : "",
        gradient !== "brand" ? `gradient="${gradient}"` : "",
        height !== 32 ? `height={${height}}` : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `<div className="text-text-primary">
  <BarberlyticsLogo${attrs ? ` ${attrs}` : ""} />
</div>`;
    },
  }),
  examples: [
    {
      id: "gradients",
      title: "Los tres colores",
      description: "`brand` es el uso normal; `ai` solo en superficies de IA; `mono` cuando no hay gradiente posible (una tinta, grabado, cromo oscuro).",
      code: `<BarberlyticsLogo />
<BarberlyticsLogo gradient="ai" />
<BarberlyticsLogo gradient="mono" />`,
      render: () => (
        <Surface>
          <BarberlyticsLogo />
          <BarberlyticsLogo gradient="ai" />
          <BarberlyticsLogo gradient="mono" />
        </Surface>
      ),
    },
    {
      id: "mark",
      title: "Isotipo: la flecha sola",
      description: "Para favicon, avatar e icono de app. Cambia solo `height`; el ancho sale de la proporción.",
      code: `<BarberlyticsLogo variant="mark" height={16} />
<BarberlyticsLogo variant="mark" height={24} />
<BarberlyticsLogo variant="mark" height={32} />
<BarberlyticsLogo variant="mark" height={48} />`,
      render: () => (
        <Surface>
          {SIZES.map((height) => (
            <BarberlyticsLogo key={height} variant="mark" height={height} />
          ))}
        </Surface>
      ),
    },
    {
      id: "chrome",
      title: "Sobre el cromo oscuro",
      description: "El rail y la cabecera son oscuros en los dos modos: el contenedor pone `text-nav-foreground` y «Barber» pasa a blanco solo.",
      code: `<div className="bg-surface-nav text-nav-foreground p-6">
  <BarberlyticsLogo height={24} />
</div>`,
      render: () => (
        <div className="flex items-center justify-center rounded-xl bg-surface-nav p-6 text-nav-foreground">
          <BarberlyticsLogo height={24} />
        </div>
      ),
    },
  ],
  props: [
    { name: "variant", type: '"wordmark" | "mark"', default: '"wordmark"', description: "Logotipo completo o la flecha sola (isotipo)." },
    { name: "gradient", type: '"brand" | "ai" | "mono"', default: '"brand"', description: "Color de «lytics» y la flecha: gradiente de marca del tema, gradación de IA del tema o una tinta (`currentColor`)." },
    { name: "height", type: "number", default: "32", description: "Alto en px de la tinta. El ancho es `height × 4,44` (wordmark) o `height × 1,5` (mark)." },
    { name: "title", type: "string", default: '"Barberlytics"', description: "Nombre accesible del `role=\"img\"`." },
    { name: "...props", type: "React.SVGAttributes<SVGSVGElement>", description: "Atributos del `<svg>`, incluido `className` para el layout de afuera." },
  ],
  guidelines: {
    do: [
      "Colócalo en un contenedor con `text-text-primary`; sobre el cromo oscuro, `text-nav-foreground`.",
      "Deja alrededor al menos el alto de la «B» (0,5 × `height`) libre de otros elementos.",
      "Usa `variant=\"mark\"` a partir de 16px y el logotipo completo a partir de 20px de alto.",
    ],
    dont: [
      "No lo estires ni le pases `width`: cambia solo `height`.",
      "No le pongas colores a mano ni lo saques del tema; `gradient=\"ai\"` es solo para superficies de IA.",
      "No uses «lytics» con la flecha sin «Barber», ni la flecha girada o en espejo.",
    ],
  },
  related: ["thema-logo", "thema-product-header"],
});
