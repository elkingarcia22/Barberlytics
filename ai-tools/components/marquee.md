# Marquee

Ticker de vocabulario en bucle: los extremos se funden con el fondo, cada palabra lleva su rombo del primario y se pausa al pasar el puntero. Es decorativo (aria-hidden): lo que diga tiene que estar también en el contenido. Con prefers-reduced-motion se vuelve una lista fija que envuelve.

Familia: Atmósfera y marca · Doc: `/docs#/components/marquee` · Fuente: `src/components/atmosphere/Marquee.tsx`

```ts
import { Marquee } from "@/components/atmosphere"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `items` | `readonly string[]` |  | Las palabras. Se duplican por dentro para que el bucle no tenga costura. |
| `duration` | `number` | `48` | Segundos que tarda una vuelta completa. |
| `...props` | `React.ComponentProps<"div">` |  | Atributos del contenedor; `className` para márgenes. |

## Guías

- Sí: Ocho a quince palabras cortas; el ticker se lee de reojo.
- Sí: Ponlo a todo el ancho, entre dos bloques, con sus bordes superior e inferior.
- No: No metas enlaces ni botones: es aria-hidden y no recibe foco.
- No: No lo uses para avisos o noticias; un ticker con contenido real es un carrusel sin controles.

Relacionados: cut-line, foil

## Ejemplos

### Bajo la portada

En la landing va justo después del hero, con el vocabulario del oficio y del negocio mezclados.

```tsx
<Marquee items={["Fade", "Taper", "Navaja", "Agenda", "Comisiones", "IA que aprende"]} />
```
