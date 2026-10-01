# HairCanvas

Cabello cayendo sobre una portada: hebras finas y curvas que bajan, se mecen y giran, la mitad en el color de marca y la otra mitad en el del texto. Es un canvas 2D que se detiene fuera de pantalla y con la pestaña oculta, relee la paleta al cambiar el tema y con prefers-reduced-motion no se monta.

Familia: Atmósfera y marca · Doc: `/docs#/components/hair-canvas` · Fuente: `src/components/atmosphere/HairCanvas.tsx`

```ts
import { HairCanvas } from "@/components/atmosphere"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `density` | `number` | `1` | Multiplicador de hebras: 1 es una hebra por cada 22 000 px², con tope en 70. |
| `onChrome` | `boolean` | `false` | Sobre el cromo oscuro (bg-surface-nav) las hebras de texto toman --nav-foreground en vez de --foreground, para verse también en modo claro. |
| `className` | `string` |  | Clases extra para el <canvas>, que ya es absolute inset-0 y no intercepta el puntero. |

## Guías

- Sí: Úsalo en la portada y, con menos densidad, en el cierre: dos veces por página como mucho.
- Sí: El contenedor tiene que ser `relative` y con `overflow-hidden`; el canvas mide al padre.
- Sí: Confía en que se apaga solo fuera de pantalla: no lo desmontes a mano al hacer scroll.
- No: No lo pongas detrás de texto largo ni de un formulario: es textura para titulares.
- No: No lo dupliques dentro de cards; una card no tiene atmósfera propia.
- No: No le des colores: los toma del tema (`--primary` y `--foreground`).

Relacionados: pole-ring, halo, grain

## Ejemplos

### Portada

Va como primer hijo de una sección `relative overflow-hidden`; el contenido después, también `relative`, para quedar por delante.

```tsx
<section className="relative overflow-hidden">
  <HairCanvas />
  <div className="relative mx-auto max-w-4xl text-center">…</div>
</section>
```

### Cierre con menos densidad

En el cierre de la página baja a 0.7 para no repetir la portada con la misma fuerza.

```tsx
<HairCanvas density={0.7} />
```
