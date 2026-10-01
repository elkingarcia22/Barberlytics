# Reveal

Envoltorio que aparece al entrar en pantalla: 14px de ascenso y opacidad, una sola vez, con un IntersectionObserver por elemento y ningún manejador de scroll. Para lo que está bajo el pliegue; lo que está sobre él usa Enter, que no espera a nadie. Con prefers-reduced-motion se muestra sin transición.

Familia: Atmósfera y marca · Doc: `/docs#/components/reveal` · Fuente: `src/components/atmosphere/Reveal.tsx`

```ts
import { Reveal } from "@/components/atmosphere"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `delay` | `number` | `0` | Retardo de la transición en ms, para escalonar listas y rejillas (60–120 ms entre ítems). |
| `as` | `"div" \| "li" \| "article" \| "section"` | `"div"` | Etiqueta a renderizar; `li` dentro de una lista para no romper el marcado. |
| `...props` | `React.HTMLAttributes<HTMLElement>` |  | Atributos del elemento. |

## Guías

- Sí: Envuelve bloques, no palabras: una sección, una card, una fila.
- Sí: Escalona con `delay` solo dentro de una misma rejilla; entre secciones el scroll ya escalona.
- No: No lo uses sobre el pliegue: el titular de portada es el LCP y no puede esperar a un observador (usa Enter).
- No: No lo anides: un Reveal dentro de otro se revela dos veces.

Relacionados: enter, cut-line, tilt

## Ejemplos

### Un bloque entero

Lo habitual: el contenido de una sección envuelto una vez. La cabecera de sección y su cuerpo entran juntos.

```tsx
<Reveal className="mx-auto max-w-3xl text-center">
  <Heading level={2}>La construimos juntos.</Heading>
  <Text variant="lead">Entra al canal y preséntate con el nombre de tu barbería.</Text>
</Reveal>
```
