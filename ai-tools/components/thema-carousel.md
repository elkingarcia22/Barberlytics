# ThemaCarousel

Envoltorio del Carousel de shadcn con cabecera de sección, flechas y puntos de paginación resueltos. Recibe cualquier hijo como slide y deja el ancho de cada ítem en manos de `itemClassName`.

Familia: Media · Doc: `/docs#/components/thema-carousel` · Fuente: `src/components/media/ThemaCarousel.tsx`

```ts
import { ThemaCarousel } from "@/components/media"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `children` | `ReactNode` |  | Cada hijo directo se convierte en un slide. |
| `title` | `string` |  | Título de la sección; activa el SectionHeader. |
| `description` | `string` |  | Subtítulo bajo el título. |
| `actions` | `ReactNode` |  | Acciones alineadas a la derecha del título. |
| `showControls` | `boolean` | `true` | Flechas anterior/siguiente (ocultas en móvil). |
| `showDots` | `boolean` | `false` | Puntos de paginación clicables bajo el carrusel. |
| `loop` | `boolean` | `false` | Vuelve al inicio tras el último slide. |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Eje de desplazamiento. |
| `contentClassName` | `string` |  | Clases del contenedor de slides; en vertical fija aquí la altura. |
| `itemClassName` | `string` |  | Clases de cada slide; controla cuántos caben por vista con `basis-*`. |
| `ariaLabel` | `string` |  | Etiqueta accesible; por defecto usa `title`. |
| `className` | `string` |  | Clases del contenedor raíz. |

## Guías

- Sí: Define siempre `itemClassName` con `basis-*` responsivo; sin él cada slide ocupa el 100%.
- Sí: Usa `showDots` cuando hay pocos slides y todos importan (banners); flechas cuando la lista es larga.
- Sí: Pasa `ariaLabel` si no hay `title`.
- No: No lo uses para listas con más de ~20 ítems: una Gallery con paginación se navega mejor.
- No: No anides carruseles ni pongas más de uno con `loop` en la misma vista.

Relacionados: carousel, preview-card, gallery, card

## Ejemplos

### Sección de tarjetas

El caso típico: título, acción a la derecha y tres tarjetas por vista en escritorio.

```tsx
<ThemaCarousel
  title="Cursos recomendados"
  description="Seleccionados según tu rol."
  actions={<Button size="sm" variant="outline"><Plus /> Añadir</Button>}
  itemClassName="md:basis-1/2 lg:basis-1/3"
>
  {courses.map((item) => (
    <PreviewCard key={item.id} item={item} />
  ))}
</ThemaCarousel>
```

### Banner a pantalla completa con puntos

Un slide por vista, `loop` y puntos en lugar de flechas: el patrón de banner de portada.

```tsx
// Placeholder SVG inline; en producción `src` es la URL real
const placeholder = (label: string) =>
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">
    <rect width="640" height="360" fill="#2563eb"/>
    <text x="320" y="180" fill="#fff" font-size="40" text-anchor="middle">${label}</text>
  </svg>`);

<ThemaCarousel loop showControls={false} showDots ariaLabel="Novedades">
  {["Onboarding", "Liderazgo", "Bienestar"].map((label) => (
    <img key={label} src={placeholder(label)} alt={label} className="aspect-[21/9] w-full rounded-lg object-cover" />
  ))}
</ThemaCarousel>
```

### Vertical

En vertical el contenedor necesita una altura fija vía `contentClassName`; cada ítem toma su fracción con `basis-*`.

```tsx
<ThemaCarousel orientation="vertical" contentClassName="h-[260px]" itemClassName="basis-1/2">
  {slides.map((slide) => (
    <img key={slide} src={placeholder(slide)} alt={slide} className="h-full w-full rounded-lg object-cover" />
  ))}
</ThemaCarousel>
```
