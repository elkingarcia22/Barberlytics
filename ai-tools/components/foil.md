# Foil

Lámina dorada: la palabra de marca de un titular con un barrido de luz cada siete segundos. El oro es --color-brand, así que en un tema azul la lámina es azul. Es el único sitio de la capa donde se anima background-position: una palabra, no una frase.

Familia: Atmósfera y marca · Doc: `/docs#/components/foil` · Fuente: `src/components/atmosphere/Foil.tsx`

```ts
import { Foil } from "@/components/atmosphere"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `as` | `"span" \| "em" \| "strong"` | `"span"` | Etiqueta en línea; `em` para la palabra enfática de un titular. |
| `...props` | `React.HTMLAttributes<HTMLElement>` |  | Atributos del elemento. |

## Guías

- Sí: Una palabra o dos por pantalla, en el titular de portada y en el de cierre.
- Sí: Úsalo sobre un Heading grande: a 14px la lámina no se ve.
- No: No lo apliques a un párrafo ni a un botón.
- No: No lo combines con `text-brand-gradient` en el mismo titular: uno de los dos sobra.

Relacionados: heading, rotating-seal

## Ejemplos

### En el cierre

La misma lámina cierra la página en el último titular; en medio, ninguna.

```tsx
<Heading level={2}>
  La IA que va a mover tu barbería se entrena en <Foil>este grupo</Foil>.
</Heading>
```
