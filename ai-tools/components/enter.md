# Enter

Entrada de los bloques de portada. A diferencia de Reveal, no espera a un IntersectionObserver: la animación es de CSS, arranca sola y termina en su estado visible, así que el contenido sobre el pliegue se pinta aunque el JavaScript llegue tarde o no llegue.

Familia: Atmósfera y marca · Doc: `/docs#/components/enter` · Fuente: `src/components/atmosphere/Enter.tsx`

```ts
import { Enter } from "@/components/atmosphere"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `delay` | `number` | `0` | Retardo de la animación en ms; la portada escalona de 60 a 80 ms por bloque. |
| `...props` | `React.ComponentProps<"div">` |  | Atributos del div. |

## Guías

- Sí: Úsalo solo en lo que se ve al cargar: eyebrow, titular, párrafo, botones y el sello.
- Sí: Escalona en pasos cortos; la portada entera debe estar en su sitio antes de 600 ms.
- No: No lo uses bajo el pliegue: ahí la animación ya habría terminado cuando el usuario llega (usa Reveal).
- No: No lo combines con Reveal en el mismo bloque.

Relacionados: reveal, rotating-seal
