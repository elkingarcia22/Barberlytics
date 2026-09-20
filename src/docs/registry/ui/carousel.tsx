import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { defineEntry, definePlayground } from "../types";

const ORIENTATIONS = ["horizontal", "vertical"] as const;
const PER_VIEW = ["1", "2", "3"] as const;
const BASIS: Record<(typeof PER_VIEW)[number], string> = { "1": "basis-full", "2": "basis-1/2", "3": "basis-1/3" };

const COURSES = ["Liderazgo", "Feedback", "Negociación", "Datos", "Bienestar"];

function Slide({ label, className }: { label: string; className?: string }) {
  return (
    <Card className={cn("h-full", className)}>
      <CardContent className="flex h-full items-center justify-center p-6 text-lg font-semibold text-text-primary">{label}</CardContent>
    </Card>
  );
}

function CarouselWithApi() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  return (
    <div className="w-full max-w-sm px-12">
      <Carousel setApi={setApi}>
        <CarouselContent>
          {COURSES.map((course) => (
            <CarouselItem key={course}>
              <Slide label={course} className="aspect-video" />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
      <div className="mt-3 flex items-center justify-center gap-1.5" role="tablist" aria-label="Diapositivas">
        {Array.from({ length: count }).map((_, index) => (
          <button
            key={index}
            type="button"
            role="tab"
            aria-selected={index === current}
            aria-label={`Ir a la diapositiva ${index + 1}`}
            onClick={() => api?.scrollTo(index)}
            className={cn("size-2 rounded-full transition-colors", index === current ? "bg-primary" : "bg-border hover:bg-text-muted")}
          />
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-text-muted">
        {current + 1} de {count}
      </p>
    </div>
  );
}

export const carouselEntry = defineEntry({
  id: "carousel",
  name: "Carousel",
  group: "ui",
  description:
    "Carrusel accesible construido sobre Embla, con flechas, navegación por teclado y soporte de arrastre. Úsalo para recorrer colecciones de tarjetas o imágenes cuando no cabe todo en pantalla y el orden importa.",
  importPath: 'import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from "@/components/ui/carousel"',
  sourcePath: "src/components/ui/carousel.tsx",
  status: "stable",
  tags: ["embla"],
  playground: definePlayground({
    controls: {
      orientation: { type: "select", options: ORIENTATIONS, default: "horizontal" },
      perView: { type: "select", label: "Ítems visibles", options: PER_VIEW, default: "1" },
      loop: { type: "boolean", label: "Bucle", default: false },
    },
    render: ({ orientation, perView, loop }) => {
      const isVertical = orientation === "vertical";
      const basis = BASIS[perView as (typeof PER_VIEW)[number]];
      return (
        <div className={cn("w-full max-w-sm", isVertical ? "py-12" : "px-12")}>
          <Carousel key={`${orientation}-${loop}`} orientation={orientation as (typeof ORIENTATIONS)[number]} opts={{ loop }}>
            <CarouselContent className={isVertical ? "h-[220px]" : undefined}>
              {COURSES.map((course) => (
                <CarouselItem key={course} className={basis}>
                  <Slide label={course} className={isVertical ? "h-[100px]" : "aspect-square"} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      );
    },
    code: ({ orientation, perView, loop }) => {
      const isVertical = orientation === "vertical";
      const attrs = [isVertical ? 'orientation="vertical"' : "", loop ? "opts={{ loop: true }}" : ""].filter(Boolean).join(" ");
      const basis = perView === "1" ? "" : ` className="${BASIS[perView as (typeof PER_VIEW)[number]]}"`;
      return `<Carousel${attrs ? ` ${attrs}` : ""}>
  <CarouselContent${isVertical ? ' className="h-[220px]"' : ""}>
    {courses.map((course) => (
      <CarouselItem key={course}${basis}>
        <Card><CardContent>{course}</CardContent></Card>
      </CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>`;
    },
  }),
  examples: [
    {
      id: "basic",
      title: "Básico",
      description: "Las flechas se colocan fuera del viewport (-48px); deja margen lateral al contenedor.",
      frameClassName: "min-h-[320px]",
      code: `<div className="w-full max-w-sm px-12">
  <Carousel>
    <CarouselContent>
      {courses.map((course) => (
        <CarouselItem key={course}>
          <Card><CardContent className="flex aspect-video items-center justify-center">{course}</CardContent></Card>
        </CarouselItem>
      ))}
    </CarouselContent>
    <CarouselPrevious />
    <CarouselNext />
  </Carousel>
</div>`,
      render: () => (
        <div className="w-full max-w-sm px-12">
          <Carousel>
            <CarouselContent>
              {COURSES.map((course) => (
                <CarouselItem key={course}>
                  <Slide label={course} className="aspect-video" />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      ),
    },
    {
      id: "multiple",
      title: "Varios ítems por vista",
      description: "El ancho de cada slide lo define `basis-*` en `CarouselItem`; `align: \"start\"` alinea al borde.",
      layout: "stretch",
      frameClassName: "min-h-[260px]",
      code: `<Carousel opts={{ align: "start" }} className="px-12">
  <CarouselContent>
    {courses.map((course) => (
      <CarouselItem key={course} className="md:basis-1/2 lg:basis-1/3">
        <Card><CardContent className="flex aspect-square items-center justify-center">{course}</CardContent></Card>
      </CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious className="left-0" />
  <CarouselNext className="right-0" />
</Carousel>`,
      render: () => (
        <Carousel opts={{ align: "start" }} className="w-full px-12">
          <CarouselContent>
            {COURSES.map((course) => (
              <CarouselItem key={course} className="md:basis-1/2 lg:basis-1/3">
                <Slide label={course} className="aspect-square" />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-0" />
          <CarouselNext className="right-0" />
        </Carousel>
      ),
    },
    {
      id: "api",
      title: "Indicadores con la API",
      description: "`setApi` expone la instancia de Embla para leer el slide activo, contar snaps o saltar a uno concreto.",
      frameClassName: "min-h-[340px]",
      code: `const [api, setApi] = React.useState<CarouselApi>();
const [current, setCurrent] = React.useState(0);
const [count, setCount] = React.useState(0);

React.useEffect(() => {
  if (!api) return;
  setCount(api.scrollSnapList().length);
  setCurrent(api.selectedScrollSnap());
  const onSelect = () => setCurrent(api.selectedScrollSnap());
  api.on("select", onSelect);
  return () => { api.off("select", onSelect); };
}, [api]);

<Carousel setApi={setApi}>…</Carousel>
{Array.from({ length: count }).map((_, index) => (
  <button key={index} aria-label={\`Ir a la diapositiva \${index + 1}\`} onClick={() => api?.scrollTo(index)} className={index === current ? "bg-primary" : "bg-border"} />
))}`,
      render: () => <CarouselWithApi />,
    },
    {
      id: "vertical",
      title: "Vertical",
      description: "Fija una altura en `CarouselContent`; las flechas rotan y se colocan arriba y abajo.",
      frameClassName: "min-h-[360px]",
      code: `<Carousel orientation="vertical" className="w-full max-w-xs">
  <CarouselContent className="h-[220px]">
    {courses.map((course) => (
      <CarouselItem key={course} className="basis-1/2">
        <Card><CardContent className="flex h-[100px] items-center justify-center">{course}</CardContent></Card>
      </CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>`,
      render: () => (
        <div className="w-full max-w-xs py-12">
          <Carousel orientation="vertical">
            <CarouselContent className="h-[220px]">
              {COURSES.map((course) => (
                <CarouselItem key={course} className="basis-1/2">
                  <Slide label={course} className="h-[100px]" />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      ),
    },
  ],
  props: [
    { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "Eje de desplazamiento. En vertical fija una altura en CarouselContent." },
    { name: "opts", type: "EmblaOptionsType", description: "Opciones de Embla: `loop`, `align`, `dragFree`, `skipSnaps`…" },
    { name: "plugins", type: "EmblaPluginType[]", description: "Plugins de Embla (autoplay, wheel gestures, etc.)." },
    { name: "setApi", type: "(api: CarouselApi) => void", description: "Recibe la instancia de Embla para controlar el carrusel desde fuera." },
    { name: "CarouselItem.className", type: "string", description: "Usa `basis-1/2`, `basis-1/3`… para mostrar varios ítems por vista." },
    { name: "CarouselPrevious / CarouselNext", type: "ButtonProps", description: "Botones absolutos; aceptan `variant`, `size` y `className` para reposicionarlos." },
  ],
  guidelines: {
    do: ["Deja espacio lateral (`px-12`) para las flechas o reposiciónalas con `className`.", "Muestra indicadores cuando hay más de 3 slides.", "Activa `loop` solo en colecciones cortas donde tenga sentido volver al inicio."],
    dont: ["No lo uses como único acceso a contenido importante; el usuario puede no desplazarse.", "No añadas autoplay sin control de pausa.", "No mezcles alturas distintas entre slides del mismo carrusel."],
  },
  related: ["card", "button"],
});
