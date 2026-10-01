# Spinner

Indicador de carga indeterminado en cuatro tamaños (12, 16, 24 y 32px) y tres tonos. Anuncia el estado con `role="status"` y un texto solo para lectores de pantalla; con `prefers-reduced-motion` el arco se queda quieto. Para cargas largas con progreso conocido, prefiere Progress.

Familia: Feedback · Doc: `/docs#/components/spinner` · Fuente: `src/components/feedback/Spinner.tsx`

```ts
import { Spinner } from "@/components/feedback/Spinner"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `size` | `"xs" \| "sm" \| "md" \| "lg"` | `"md"` | 12, 16, 24 o 32px. |
| `tone` | `"default" \| "primary" \| "inverse"` | `"default"` | Texto secundario, primario o blanco sobre fondos oscuros. |
| `label` | `string` | `"Cargando"` | Texto para lectores de pantalla (`sr-only`). |
| `...props` | `React.HTMLAttributes<"span">` |  | Atributos del contenedor; ya lleva `role="status"` y `aria-live="polite"`. |

## Guías

- Sí: Describe qué se carga en `label` («Importando usuarios»), no solo «Cargando».
- Sí: Reserva el espacio del contenido mientras carga para no provocar saltos.
- Sí: Muéstralo solo si la espera supera ~300ms; para menos, no hace falta feedback.
- No: No uses varios spinners a la vez en la misma vista: uno por zona que carga.
- No: No lo uses para progresos con porcentaje conocido; ahí va Progress.
- No: No lo pongas sobre texto que siga interactivo sin deshabilitarlo.

Relacionados: progress, skeleton, button, empty-state

## Ejemplos

### Tamaños

`xs` cabe en un badge, `sm` en un botón, `md` en una tarjeta y `lg` en un estado vacío o una página.

```tsx
<Spinner size="xs" />
<Spinner size="sm" />
<Spinner size="md" />
<Spinner size="lg" />
```

### Dentro de un botón

Al lanzar la importación de usuarios el icono se sustituye por el spinner en tono `inverse` y el botón se deshabilita. La etiqueta describe la acción, no «Cargando».

```tsx
<Button onClick={start} disabled={isImporting}>
  {isImporting ? <Spinner size="sm" tone="inverse" label="Importando usuarios" /> : <Upload />}
  {isImporting ? "Importando…" : "Importar usuarios"}
</Button>
```

### En línea con texto

Tono `primary` junto a un mensaje de estado; el texto visible y el `label` deben decir lo mismo.

```tsx
<div className="flex items-center gap-2 text-sm text-text-secondary">
  <Spinner size="sm" tone="primary" label="Calculando resultados" />
  Calculando resultados de la encuesta…
</div>
```

### Bloqueando un panel

Centrado en el área que se está cargando, con una frase corta debajo. Mantén la altura del panel para evitar saltos.

```tsx
<div className="flex h-40 flex-col items-center justify-center gap-3 rounded-xl border border-border/60 bg-surface">
  <Spinner size="lg" tone="primary" label="Cargando el plan de formación" />
  <span className="text-sm text-text-secondary">Cargando el plan de formación…</span>
</div>
```
