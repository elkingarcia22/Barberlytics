import { Plus } from "lucide-react";
import { UbitsCarousel, PreviewCard, type CarouselOrientation } from "@/components/media";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";
import { COURSE_ITEMS, PLACEHOLDER_SNIPPET, placeholder } from "./fixtures";

const ORIENTATIONS = ["horizontal", "vertical"] as const;

/** Un slide simple con imagen a sangre, para ejemplos sin tarjeta. */
function Slide({ label, tone, className }: { label: string; tone: Parameters<typeof placeholder>[1]; className?: string }) {
  return (
    <div className={className}>
      <img src={placeholder(label, tone)} alt={label} className="h-full w-full rounded-lg object-cover" />
    </div>
  );
}

export const ubitsCarouselEntry = defineEntry({
  id: "ubits-carousel",
  name: "UbitsCarousel",
  group: "media",
  description:
    "Envoltorio del Carousel de shadcn con cabecera de sección, flechas y puntos de paginación resueltos. Recibe cualquier hijo como slide y deja el ancho de cada ítem en manos de `itemClassName`.",
  importPath: 'import { UbitsCarousel } from "@/components/media"',
  sourcePath: "src/components/media/UbitsCarousel.tsx",
  status: "stable",
  tags: ["embla", "carousel", "seccion"],
  playground: definePlayground({
    controls: {
      title: { type: "text", label: "Título", default: "Cursos recomendados" },
      orientation: { type: "select", options: ORIENTATIONS, default: "horizontal" },
      showControls: { type: "boolean", label: "Flechas", default: true },
      showDots: { type: "boolean", label: "Puntos", default: true },
      loop: { type: "boolean", default: false },
    },
    layout: "stretch",
    render: ({ title, orientation, showControls, showDots, loop }) => {
      const isVertical = orientation === "vertical";
      return (
        <div className="w-full px-10">
          <UbitsCarousel
            key={`${orientation}-${loop}`}
            title={title || undefined}
            description={title ? "Seleccionados según tu rol y tus últimas rutas." : undefined}
            orientation={orientation as CarouselOrientation}
            showControls={showControls}
            showDots={showDots}
            loop={loop}
            contentClassName={isVertical ? "h-[260px]" : undefined}
            itemClassName={isVertical ? "basis-1/2" : "md:basis-1/2 lg:basis-1/3"}
          >
            {COURSE_ITEMS.map((item) => (
              <PreviewCard key={item.id} item={item} />
            ))}
          </UbitsCarousel>
        </div>
      );
    },
    code: ({ title, orientation, showControls, showDots, loop }) => {
      const isVertical = orientation === "vertical";
      const attrs = [
        title ? `title="${title}"` : "",
        isVertical ? 'orientation="vertical"' : "",
        !showControls ? "showControls={false}" : "",
        showDots ? "showDots" : "",
        loop ? "loop" : "",
        isVertical ? 'contentClassName="h-[260px]"' : "",
        `itemClassName="${isVertical ? "basis-1/2" : "md:basis-1/2 lg:basis-1/3"}"`,
      ]
        .filter(Boolean)
        .map((attr) => `\n  ${attr}`)
        .join("");
      return `<UbitsCarousel${attrs}
>
  {courses.map((item) => (
    <PreviewCard key={item.id} item={item} />
  ))}
</UbitsCarousel>`;
    },
  }),
  examples: [
    {
      id: "cards",
      title: "Sección de tarjetas",
      description: "El caso típico: título, acción a la derecha y tres tarjetas por vista en escritorio.",
      layout: "stretch",
      code: `<UbitsCarousel
  title="Cursos recomendados"
  description="Seleccionados según tu rol."
  actions={<Button size="sm" variant="outline"><Plus /> Añadir</Button>}
  itemClassName="md:basis-1/2 lg:basis-1/3"
>
  {courses.map((item) => (
    <PreviewCard key={item.id} item={item} />
  ))}
</UbitsCarousel>`,
      render: () => (
        <div className="w-full px-10">
          <UbitsCarousel
            title="Cursos recomendados"
            description="Seleccionados según tu rol."
            actions={
              <Button size="sm" variant="outline">
                <Plus /> Añadir
              </Button>
            }
            itemClassName="md:basis-1/2 lg:basis-1/3"
          >
            {COURSE_ITEMS.map((item) => (
              <PreviewCard key={item.id} item={item} />
            ))}
          </UbitsCarousel>
        </div>
      ),
    },
    {
      id: "hero",
      title: "Banner a pantalla completa con puntos",
      description: "Un slide por vista, `loop` y puntos en lugar de flechas: el patrón de banner de portada.",
      layout: "stretch",
      code: `${PLACEHOLDER_SNIPPET}

<UbitsCarousel loop showControls={false} showDots ariaLabel="Novedades">
  {["Onboarding", "Liderazgo", "Bienestar"].map((label) => (
    <img key={label} src={placeholder(label)} alt={label} className="aspect-[21/9] w-full rounded-lg object-cover" />
  ))}
</UbitsCarousel>`,
      render: () => (
        <div className="w-full">
          <UbitsCarousel loop showControls={false} showDots ariaLabel="Novedades">
            <Slide label="Onboarding" tone="azul" className="aspect-[21/9]" />
            <Slide label="Liderazgo" tone="violeta" className="aspect-[21/9]" />
            <Slide label="Bienestar" tone="verde" className="aspect-[21/9]" />
          </UbitsCarousel>
        </div>
      ),
    },
    {
      id: "vertical",
      title: "Vertical",
      description: "En vertical el contenedor necesita una altura fija vía `contentClassName`; cada ítem toma su fracción con `basis-*`.",
      layout: "stretch",
      frameClassName: "min-h-[320px]",
      code: `<UbitsCarousel orientation="vertical" contentClassName="h-[260px]" itemClassName="basis-1/2">
  {slides.map((slide) => (
    <img key={slide} src={placeholder(slide)} alt={slide} className="h-full w-full rounded-lg object-cover" />
  ))}
</UbitsCarousel>`,
      render: () => (
        <div className="w-full max-w-md py-10">
          <UbitsCarousel orientation="vertical" contentClassName="h-[260px]" itemClassName="basis-1/2">
            <Slide label="Excel" tone="verde" className="h-full" />
            <Slide label="Ventas" tone="rosa" className="h-full" />
            <Slide label="Feedback" tone="naranja" className="h-full" />
            <Slide label="Seguridad" tone="gris" className="h-full" />
          </UbitsCarousel>
        </div>
      ),
    },
  ],
  props: [
    { name: "children", type: "ReactNode", description: "Cada hijo directo se convierte en un slide." },
    { name: "title", type: "string", description: "Título de la sección; activa el SectionHeader." },
    { name: "description", type: "string", description: "Subtítulo bajo el título." },
    { name: "actions", type: "ReactNode", description: "Acciones alineadas a la derecha del título." },
    { name: "showControls", type: "boolean", default: "true", description: "Flechas anterior/siguiente (ocultas en móvil)." },
    { name: "showDots", type: "boolean", default: "false", description: "Puntos de paginación clicables bajo el carrusel." },
    { name: "loop", type: "boolean", default: "false", description: "Vuelve al inicio tras el último slide." },
    { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "Eje de desplazamiento." },
    { name: "contentClassName", type: "string", description: "Clases del contenedor de slides; en vertical fija aquí la altura." },
    { name: "itemClassName", type: "string", description: "Clases de cada slide; controla cuántos caben por vista con `basis-*`." },
    { name: "ariaLabel", type: "string", description: "Etiqueta accesible; por defecto usa `title`." },
    { name: "className", type: "string", description: "Clases del contenedor raíz." },
  ],
  guidelines: {
    do: [
      "Define siempre `itemClassName` con `basis-*` responsivo; sin él cada slide ocupa el 100%.",
      "Usa `showDots` cuando hay pocos slides y todos importan (banners); flechas cuando la lista es larga.",
      "Pasa `ariaLabel` si no hay `title`.",
    ],
    dont: [
      "No lo uses para listas con más de ~20 ítems: una Gallery con paginación se navega mejor.",
      "No anides carruseles ni pongas más de uno con `loop` en la misma vista.",
    ],
  },
  related: ["carousel", "preview-card", "gallery", "card"],
});
