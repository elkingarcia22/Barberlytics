# Grain

Grano: una textura de ruido (un SVG en línea, sin coste de red) fundida sobre el fondo con soft-light y sin interceptar el puntero. Es lo que separa un fondo plano de una superficie con material. Con scope="page" se fija al viewport una sola vez; con "container", al padre relative.

Familia: Atmósfera y marca · Doc: `/docs#/components/grain` · Fuente: `src/components/atmosphere/Grain.tsx`

```ts
import { Grain } from "@/components/atmosphere"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `scope` | `"page" \| "container"` | `"container"` | `page` lo fija al viewport (una vez por página); `container`, al padre relative. |
| `className` | `string` |  | Opacidad o mezcla distintas (`opacity-30`). |

## Guías

- Sí: Uno por página, junto a la atmósfera del tema (`.page-atmosphere`) y la viñeta.
- Sí: Deja el 40 % de opacidad: es un material, no un efecto.
- No: No lo pongas en cards ni en drawers: el grano es del fondo.
- No: No lo uses en pantallas de producto densas (tablas, formularios); es para páginas de marca.

Relacionados: vignette, halo, hair-canvas

## Ejemplos

### En la página entera

Una vez, en el contenedor de página, fijo al viewport. El contenido va `relative` para quedar por delante.

```tsx
<div className="page-atmosphere">
  <Grain scope="page" />
  <Vignette scope="page" />
  <main className="relative">…</main>
</div>
```
