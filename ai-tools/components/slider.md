# Slider

Control deslizante de Radix con pista fina, rango en color primario y un pulgar que crece al pasar el cursor. Acepta uno o varios pulgares (rango), pasos discretos y orientación vertical.

Familia: Primitivos · Doc: `/docs#/components/slider` · Fuente: `src/components/ui/slider.tsx`

```ts
import { Slider } from "@/components/ui/slider"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value / defaultValue` | `number[]` |  | Uno o más valores; cada uno pinta un pulgar. |
| `onValueChange` | `(value: number[]) => void` |  | Se dispara en cada movimiento. Usa `onValueCommit` para reaccionar solo al soltar. |
| `min / max` | `number` | `0 / 100` | Límites de la escala. |
| `step` | `number` | `1` | Incremento entre valores válidos. |
| `minStepsBetweenThumbs` | `number` | `0` | Separación mínima entre pulgares en un rango. |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | En vertical toma la altura del contenedor. |
| `disabled` | `boolean` | `false` | Baja la opacidad al 50% y bloquea la interacción. |

## Guías

- Sí: Muestra el valor numérico al lado; el pulgar solo no basta para leerlo.
- Sí: Usa `step` acorde a la precisión que importa (100 en montos, 1 en porcentajes).
- Sí: Asocia un Label con `htmlFor` al `id` del slider.
- No: No lo uses para elegir entre pocas opciones nombradas: usa RadioGroup o SegmentedControl.
- No: No dispares peticiones en `onValueChange`; usa `onValueCommit`.

Relacionados: range-slider, progress, radio-group

## Ejemplos

### Controlado con etiqueta y valor

`value` es siempre un array; muestra el número al lado para que el ajuste sea preciso.

```tsx
const [value, setValue] = React.useState([65]);

<div className="flex items-center justify-between">
  <Label htmlFor="volume"><Volume2 /> Volumen</Label>
  <span className="text-xs tabular-nums">{value[0]}%</span>
</div>
<Slider id="volume" value={value} onValueChange={setValue} max={100} step={1} />
```

### Rango (dos pulgares)

Con dos valores se pintan dos pulgares; `minStepsBetweenThumbs` evita que se crucen.

```tsx
const [range, setRange] = React.useState([1200, 3600]);

<Slider value={range} onValueChange={setRange} min={0} max={5000} step={100} minStepsBetweenThumbs={2} />
```

### Escala discreta

Pasos enteros con etiquetas debajo: útil para escalas Likert.

```tsx
const LABELS = ["Nunca", "Rara vez", "A veces", "Seguido", "Siempre"];
const [value, setValue] = React.useState([2]);

<Slider value={value} onValueChange={setValue} min={0} max={LABELS.length - 1} step={1} />
<div className="flex justify-between text-[11px]">
  {LABELS.map((label, i) => <span key={label} className={i === value[0] ? "font-semibold text-primary" : ""}>{label}</span>)}
</div>
```

### Vertical

Con `orientation="vertical"` el contenedor define la altura (mínimo 160px).

```tsx
<div className="h-48">
  <Slider orientation="vertical" value={[value]} onValueChange={([v]) => setValue(v)} max={100} step={5} />
</div>
```
