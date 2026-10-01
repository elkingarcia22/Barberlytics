# IconTile

Un icono sobre una baldosa tintada: fondo al 10 % del tono y glifo en el color pleno, en tres tamaños (28, 36 y 48px) y dos formas. Es la pieza que da color a atajos, filas de lista y cabeceras de tarjeta sin recurrir a un avatar.

Familia: Utilidades · Doc: `/docs#/components/icon-tile` · Fuente: `src/components/utility/IconTile.tsx`

```ts
import { IconTile } from "@/components/utility/IconTile"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `icon` | `React.ReactNode` |  | El icono. La baldosa fija su tamaño (14, 18 o 24px). |
| `tone` | `"primary" \| "neutral" \| "positive" \| "negative" \| "warning" \| "info" \| "ai"` | `"primary"` | Color del tinte y del glifo. `ai` usa el gradiente de IA. |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 28, 36 o 48px. |
| `shape` | `"rounded" \| "circle"` | `"rounded"` | Esquinas según el tamaño o círculo completo. |
| `...props` | `React.HTMLAttributes<"span">` |  | Atributos del span. Lleva `aria-hidden`: el significado va en el texto contiguo. |

## Guías

- Sí: Asocia un tono a un dominio y mantenlo: formación en `positive`, selección en `primary`, IA en `ai`.
- Sí: Acompaña siempre la baldosa de un texto; es decorativa (`aria-hidden`).
- Sí: Usa `lg` en atajos y cabeceras de tarjeta, `md` en filas de lista y `sm` en tablas densas.
- No: No mezcles baldosas y avatares en la misma lista: elige una convención por lista.
- No: No uses `negative` o `warning` de forma decorativa; son estados.
- No: No cambies el tamaño del icono con clases: lo controla la baldosa.

Relacionados: list-item, avatar, badge, tag

## Ejemplos

### Tonos

Seis tonos semánticos más `ai`, que usa el gradiente de IA del sistema con el glifo en blanco.

```tsx
<IconTile icon={<BookOpen />} tone="primary" />
<IconTile icon={<ClipboardList />} tone="neutral" />
<IconTile icon={<CheckCircle2 />} tone="positive" />
<IconTile icon={<XCircle />} tone="negative" />
<IconTile icon={<AlertTriangle />} tone="warning" />
<IconTile icon={<Info />} tone="info" />
<IconTile icon={<Sparkles />} tone="ai" />
```

### Tamaños y formas

El radio crece con el tamaño (`sm`→`rounded-sm`, `md`→`rounded-md`, `lg`→`rounded-lg`); `circle` lo iguala al avatar.

```tsx
<IconTile icon={<BarChart3 />} size="sm" />
<IconTile icon={<BarChart3 />} size="md" />
<IconTile icon={<BarChart3 />} size="lg" />
<IconTile icon={<BarChart3 />} size="lg" shape="circle" />
```

### Atajos del home

Cada atajo lleva una baldosa `lg` con el tono de su dominio; el texto cuelga a la derecha con 12px de separación.

```tsx
<a className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface p-3 hover:bg-surface-subtle">
  <IconTile icon={<UserPlus />} tone="primary" size="lg" />
  <span className="flex flex-col">
    <span className="text-sm font-medium text-text-primary">Nueva vacante</span>
    <span className="text-xs text-text-secondary">Publica en 4 pasos</span>
  </span>
</a>
```
