# Carousel

Carrusel accesible construido sobre Embla, con flechas, navegación por teclado y soporte de arrastre. Úsalo para recorrer colecciones de tarjetas o imágenes cuando no cabe todo en pantalla y el orden importa.

Familia: Primitivos · Doc: `/docs#/components/carousel` · Fuente: `src/components/ui/carousel.tsx`

```ts
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from "@/components/ui/carousel"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Eje de desplazamiento. En vertical fija una altura en CarouselContent. |
| `opts` | `EmblaOptionsType` |  | Opciones de Embla: `loop`, `align`, `dragFree`, `skipSnaps`… |
| `plugins` | `EmblaPluginType[]` |  | Plugins de Embla (autoplay, wheel gestures, etc.). |
| `setApi` | `(api: CarouselApi) => void` |  | Recibe la instancia de Embla para controlar el carrusel desde fuera. |
| `CarouselItem.className` | `string` |  | Usa `basis-1/2`, `basis-1/3`… para mostrar varios ítems por vista. |
| `CarouselPrevious / CarouselNext` | `ButtonProps` |  | Botones absolutos; aceptan `variant`, `size` y `className` para reposicionarlos. |

## Guías

- Sí: Deja espacio lateral (`px-12`) para las flechas o reposiciónalas con `className`.
- Sí: Muestra indicadores cuando hay más de 3 slides.
- Sí: Activa `loop` solo en colecciones cortas donde tenga sentido volver al inicio.
- No: No lo uses como único acceso a contenido importante; el usuario puede no desplazarse.
- No: No añadas autoplay sin control de pausa.
- No: No mezcles alturas distintas entre slides del mismo carrusel.

Relacionados: card, button

## Ejemplos

### Básico

Las flechas se colocan fuera del viewport (-48px); deja margen lateral al contenedor.

```tsx
<div className="w-full max-w-sm px-12">
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
</div>
```

### Varios ítems por vista

El ancho de cada slide lo define `basis-*` en `CarouselItem`; `align: "start"` alinea al borde.

```tsx
<Carousel opts={{ align: "start" }} className="px-12">
  <CarouselContent>
    {courses.map((course) => (
      <CarouselItem key={course} className="md:basis-1/2 lg:basis-1/3">
        <Card><CardContent className="flex aspect-square items-center justify-center">{course}</CardContent></Card>
      </CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious className="left-0" />
  <CarouselNext className="right-0" />
</Carousel>
```

### Indicadores con la API

`setApi` expone la instancia de Embla para leer el slide activo, contar snaps o saltar a uno concreto.

```tsx
const [api, setApi] = React.useState<CarouselApi>();
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
  <button key={index} aria-label={`Ir a la diapositiva ${index + 1}`} onClick={() => api?.scrollTo(index)} className={index === current ? "bg-primary" : "bg-border"} />
))}
```

### Vertical

Fija una altura en `CarouselContent`; las flechas rotan y se colocan arriba y abajo.

```tsx
<Carousel orientation="vertical" className="w-full max-w-xs">
  <CarouselContent className="h-[220px]">
    {courses.map((course) => (
      <CarouselItem key={course} className="basis-1/2">
        <Card><CardContent className="flex h-[100px] items-center justify-center">{course}</CardContent></Card>
      </CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>
```
