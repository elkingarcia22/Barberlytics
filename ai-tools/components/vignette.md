# Vignette

Viñeta: los bordes se hunden y el centro respira. En oscuro es sombra; en claro, un velo del primario del tema. Va una vez, sobre el fondo de la página o de una portada, y nunca sobre una card.

Familia: Atmósfera y marca · Doc: `/docs#/components/vignette` · Fuente: `src/components/atmosphere/Vignette.tsx`

```ts
import { Vignette } from "@/components/atmosphere"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `scope` | `"page" \| "container"` | `"container"` | `page` lo fija al viewport; `container`, al padre relative. |
| `className` | `string` |  | Clases extra. |

## Guías

- Sí: Combínala con Grain y con la atmósfera del tema: las tres juntas son el fondo de una landing.
- Sí: Ponla antes del contenido en el árbol y deja el contenido `relative`.
- No: No la uses en el shell de producto: el sidebar y las tablas no quieren bordes hundidos.
- No: No apiles dos viñetas (página y sección).

Relacionados: grain, halo

## Ejemplos

### Sobre una portada

Cambia el modo con el conmutador de la doc: en claro el hundimiento toma el matiz del primario.

```tsx
<section className="relative overflow-hidden">
  <Vignette />
  <div className="relative">…</div>
</section>
```
