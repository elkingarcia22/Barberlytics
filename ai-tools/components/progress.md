# Progress

Barra de progreso determinada, de 2px de radio completo, que se desplaza con transform. Úsala cuando se conoce el avance de una tarea: cargas, pasos completados, cuotas.

Familia: Primitivos · Doc: `/docs#/components/progress` · Fuente: `src/components/ui/progress.tsx`

```ts
import { Progress } from "@/components/ui/progress"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value` | `number` | `0` | Avance de 0 a 100. |
| `color` | `"primary" \| "success" \| "warning" \| "destructive"` | `"primary"` | Color del indicador. |
| `className` | `string` |  | Clases del riel; cambia `h-*` para otra altura. |
| `...props` | `React.ComponentProps<ProgressPrimitive.Root>` |  | Atributos Radix y nativos (aria-label, max…). |

## Guías

- Sí: Acompáñala de un porcentaje o un texto que diga qué avanza.
- Sí: Usa `success` al llegar al 100% de una tarea.
- Sí: Añade `aria-label` cuando no hay texto asociado.
- No: No la uses para esperas indeterminadas: usa un loader.
- No: No cambies el color solo por decoración.

Relacionados: skeleton, slider

## Ejemplos

### Colores semánticos

El color dice algo del estado: verde al completar, ámbar cerca del límite, rojo al superarlo.

```tsx
<Progress value={45} />
<Progress value={100} color="success" />
<Progress value={85} color="warning" />
<Progress value={100} color="destructive" />
```

### Carga simulada

El valor cambia con un intervalo; la transición la pone el componente.

```tsx
const [value, setValue] = React.useState(0);
// …un setInterval que suma hasta 100

<div className="flex items-center justify-between text-xs">
  <span>Subiendo respuestas.csv</span>
  <span className="tabular-nums">{value}%</span>
</div>
<Progress value={value} color={value === 100 ? "success" : "primary"} />
```

### Con etiqueta y cuota

Combínala con un texto de contexto y altura mayor si necesita más presencia.

```tsx
<div className="space-y-2">
  <div className="flex justify-between text-sm">
    <span className="font-medium">Licencias usadas</span>
    <span className="text-text-secondary">184 / 250</span>
  </div>
  <Progress value={74} className="h-3" aria-label="Licencias usadas" />
</div>
```
