# BarberGlyph

Grafismos de fondo en línea, un peine y una navaja abierta, dibujados con currentColor a muy baja opacidad detrás de una sección. Son textura, no contenido: siempre aria-hidden, sin puntero, y con `floating` se mecen despacio (14 s) sobre la inclinación que se les dé.

Familia: Atmósfera y marca · Doc: `/docs#/components/barber-glyph` · Fuente: `src/components/atmosphere/BarberGlyph.tsx`

```ts
import { BarberGlyph } from "@/components/atmosphere"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `kind` | `"comb" \| "razor"` |  | El glifo: peine o navaja abierta. |
| `floating` | `boolean` | `false` | Flotación lenta de 14 s sobre la inclinación de `rotate`. |
| `rotate` | `number` | `0` | Grados de inclinación en reposo. |
| `className` | `string` |  | Posición absoluta, ancho, color (`text-text-primary`) y opacidad (`opacity-[0.05]`). |

## Guías

- Sí: Opacidad entre 4 % y 10 %: si se lee como dibujo, sobra.
- Sí: Uno por sección y solo en pantallas anchas (`hidden lg:block`).
- No: No los uses como iconos ni como ilustración de un estado vacío.
- No: No los animes con otra cosa que `floating`: un glifo que se mueve mucho deja de ser fondo.

Relacionados: hair-canvas, pole-ring

## Ejemplos

### La navaja en la esquina de una sección

Como en la sección del acuerdo: abajo a la izquierda, a 5 % de opacidad, solo desde `lg`.

```tsx
<Section className="relative overflow-hidden">
  <BarberGlyph kind="razor" floating rotate={-8} className="absolute -bottom-10 -left-24 hidden w-[40rem] text-text-primary opacity-[0.05] lg:block" />
  …
</Section>
```

### El peine

El peine es horizontal y funciona mejor cruzando el borde superior o inferior de la sección.

```tsx
<BarberGlyph kind="comb" floating rotate={4} className="absolute -right-20 -top-8 w-[30rem] text-primary opacity-[0.08]" />
```
