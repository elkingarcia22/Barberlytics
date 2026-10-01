# Tilt

Perspectiva hacia el puntero: el panel se inclina siguiendo al ratón (rotateX/rotateY con perspectiva) y vuelve a su sitio al salir. Solo con puntero fino y sin prefers-reduced-motion; en táctil es un div normal. Escribe el transform directamente en el nodo, fuera del ciclo de React.

Familia: Atmósfera y marca · Doc: `/docs#/components/tilt` · Fuente: `src/components/atmosphere/Tilt.tsx`

```ts
import { Tilt } from "@/components/atmosphere"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `maxDegrees` | `number` | `6` | Grados máximos de inclinación en cada eje. |
| `...props` | `React.ComponentProps<"div">` |  | Atributos del div envoltorio. |

## Guías

- Sí: Envuelve la card o el panel completo; el hijo no debe tener `transform` propio.
- Sí: Reserva la inclinación fuerte para cards pequeñas en rejilla.
- No: No lo uses en controles (botones, campos): el foco y el clic se vuelven imprecisos.
- No: No lo pongas en listas largas: un tilt por fila es ruido.

Relacionados: magic-card, reveal

## Ejemplos

### Un panel grande, poca inclinación

A más superficie, menos grados: 2–3 para un panel de sección, 6–7 para una card de rejilla.

```tsx
<Tilt maxDegrees={2.5}>
  <Card className="brand-ring panel-sheen grid gap-8 rounded-3xl p-8 lg:grid-cols-12">…</Card>
</Tilt>
```
