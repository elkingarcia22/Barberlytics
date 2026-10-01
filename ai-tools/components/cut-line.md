# CutLine

Separador entre secciones: unas tijeras cruzan la página y dejan la línea continua convertida en línea de puntos. La continua se recorta con clip-path y las tijeras viajan con transform hasta el ancho que mide el propio componente. Arranca la primera vez que entra en pantalla; con prefers-reduced-motion queda en su estado final, ya cortada.

Familia: Atmósfera y marca · Doc: `/docs#/components/cut-line` · Fuente: `src/components/atmosphere/CutLine.tsx`

```ts
import { CutLine } from "@/components/atmosphere"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `className` | `string` |  | Márgenes verticales o ancho; el alto es fijo (2.5rem) para que la línea no salte. |

## Guías

- Sí: Úsalo como regla entre secciones grandes, una vez entre cada par.
- Sí: Déjale aire: el corte se lee cuando hay espacio arriba y abajo.
- No: No lo uses dentro de cards ni de listas: para eso está Separator.
- No: No lo pongas encima del pliegue: espera al scroll y ahí nadie lo ve moverse.

Relacionados: separator, reveal, marquee

## Ejemplos

### Entre dos secciones

Ocupa el ancho de su contenedor; el padding lateral lo pone la página, como con cualquier separador.

```tsx
<Section id="programa">…</Section>
<CutLine />
<Section id="camino">…</Section>
```
