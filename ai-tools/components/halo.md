# Halo

Halo: un resplandor del primario en un punto del contenedor relative, que se funde en el fondo. Dos halos (uno arriba a la izquierda, otro al fondo) son la atmósfera de una landing; uno detrás de un titular es su luz. Solo pinta un gradiente: no cuesta scroll.

Familia: Atmósfera y marca · Doc: `/docs#/components/halo` · Fuente: `src/components/atmosphere/Halo.tsx`

```ts
import { Halo } from "@/components/atmosphere"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `x` | `string` | `"50%"` | Centro horizontal del resplandor. |
| `y` | `string` | `"22%"` | Centro vertical del resplandor. |
| `size` | `string` | `"52rem 28rem"` | Tamaño de la elipse, «ancho alto». |
| `strength` | `number` | `0.18` | Opacidad del primario en el centro. |
| `className` | `string` |  | Alto o recorte distintos (`h-[44rem]`, `inset-x-0 top-0`). |

## Guías

- Sí: Uno detrás de cada titular grande; dos como atmósfera de página.
- Sí: Mantén la fuerza por debajo de 0.25: el halo se nota por contraste, no por color.
- No: No lo uses dentro de cards: la atmósfera del tema ya cae sobre la página.
- No: No lo animes; la luz quieta es lo que hace que el cabello y la rueda se lean como movimiento.

Relacionados: pole-ring, grain, vignette, hair-canvas

## Ejemplos

### La atmósfera de una landing

Dos halos sobre el fondo de página: uno grande arriba a la izquierda y otro más suave arriba a la derecha.

```tsx
<div className="relative">
  <Halo x="12%" y="-10%" size="60rem 40rem" strength={0.16} />
  <Halo x="95%" y="8%" size="45rem 30rem" strength={0.08} />
  <main className="relative">…</main>
</div>
```

### Con la rueda detrás del cierre

En el cierre de la landing el halo sube desde abajo y la rueda gira en el centro.

```tsx
<section className="relative overflow-hidden">
  <Halo x="50%" y="100%" size="40rem 20rem" strength={0.22} />
  <PoleRing size="56rem" opacity={0.6} />
  <div className="relative">…</div>
</section>
```
