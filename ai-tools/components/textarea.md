# Textarea

Campo de texto multilínea con el mismo borde, radio y anillo de foco que Input, y 120px de alto mínimo. Úsalo para comentarios, descripciones y cualquier texto que no quepa en una línea.

Familia: Primitivos · Doc: `/docs#/components/textarea` · Fuente: `src/components/ui/textarea.tsx`

```ts
import { Textarea } from "@/components/ui/textarea"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `rows` | `number` |  | Filas visibles. El `min-h-[120px]` manda salvo que lo bajes con `className="min-h-0"`. |
| `placeholder` | `string` |  | Texto de ayuda en color muted. |
| `disabled` | `boolean` | `false` | Cursor not-allowed y opacidad al 50%. |
| `readOnly` | `boolean` | `false` | Se puede seleccionar y copiar, no editar. |
| `aria-invalid` | `boolean` |  | Marca el campo como inválido para lectores de pantalla; combina con clases destructivas. |
| `...props` | `React.ComponentProps<"textarea">` |  | Cualquier atributo nativo: value, onChange, maxLength, name… |

## Guías

- Sí: Etiqueta siempre con Label y `htmlFor`.
- Sí: Indica límites o requisitos en la línea de ayuda, no solo en el error.
- Sí: Valida al salir del campo o al enviar, no en cada tecla.
- No: No lo uses para una sola línea: usa Input.
- No: No fijes `resize: none` sin motivo; la persona debe poder ampliarlo.

Relacionados: input, label, field, form-section

## Ejemplos

### Con etiqueta y ayuda

```tsx
<div className="grid gap-2">
  <Label htmlFor="notes">Notas internas</Label>
  <Textarea id="notes" placeholder="Solo las verá el equipo de People." />
  <span className="text-xs text-text-muted">Opcional.</span>
</div>
```

### Con contador de caracteres

Controlado; el contador cambia a advertencia cuando quedan pocos caracteres.

```tsx
const MAX = 280;
const [value, setValue] = React.useState("");

<Textarea value={value} onChange={(e) => setValue(e.target.value.slice(0, MAX))} />
<span className={cn("text-right text-xs tabular-nums", MAX - value.length < 30 ? "text-status-warning" : "text-text-muted")}>
  {MAX - value.length} caracteres restantes
</span>
```

### Validación al salir del campo

Se marca inválido solo después del primer `blur`, con `aria-invalid` y el mensaje enlazado por `aria-describedby`.

```tsx
<Textarea
  value={value}
  onChange={(e) => setValue(e.target.value)}
  onBlur={() => setTouched(true)}
  aria-invalid={isInvalid}
  aria-describedby="hint"
  className={cn(isInvalid && "border-destructive focus-visible:ring-destructive/30 focus-visible:border-destructive")}
/>
<span id="hint" className={isInvalid ? "text-xs text-destructive" : "text-xs text-text-muted"}>…</span>
```

### Deshabilitado

```tsx
<Textarea disabled defaultValue="La encuesta está cerrada; no se pueden editar las instrucciones." />
```
