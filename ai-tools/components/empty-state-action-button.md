# EmptyStateActionButton

La acción secundaria dentro de un estado vacío: una píldora de contorno que invita a crear el primer elemento sin competir con la acción primaria de la página. Comparte el hover de borde y tinte con su alternativa de IA para que ambas se lean como un par.

Familia: Feedback · Doc: `/docs#/components/empty-state-action-button` · Fuente: `src/components/feedback/EmptyStateActionButton.tsx`

```ts
import { EmptyStateActionButton } from "@/components/feedback/EmptyStateActionButton"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `icon` | `React.ReactNode` |  | Icono a la izquierda del texto; pásalo ya con su tamaño (`size-4`). |
| `children` | `React.ReactNode` |  | El texto del botón. |
| `className` | `string` |  | Clases extra sobre el botón. |
| `...props` | `React.ButtonHTMLAttributes<HTMLButtonElement>` |  | `onClick`, `disabled` y cualquier atributo nativo de <button>. |

## Guías

- Sí: Úsalo solo dentro de un estado vacío, como invitación a crear el primero.
- Sí: Combínalo en pares (manual + IA, crear + importar) con el mismo peso.
- No: No lo uses como acción primaria de una página; para eso está `Button`.
- No: No mezcles un `Button` relleno y este contorno en el mismo par: rompe la equivalencia.

Relacionados: empty-state, button, ai-button

## Ejemplos

### Par de opciones

Dos botones con el mismo peso visual dentro de `EmptyState`.

```tsx
<EmptyState
  title="Aún no hay competencias"
  description="Crea la primera o importa tu catálogo."
  action={
    <div className="flex flex-wrap justify-center gap-2">
      <EmptyStateActionButton icon={<Plus className="size-4" />}>Crear competencia</EmptyStateActionButton>
      <EmptyStateActionButton icon={<Upload className="size-4" />}>Importar catálogo</EmptyStateActionButton>
    </div>
  }
/>
```

### Cargando

Es un `<button>` nativo: `disabled` y el icono se controlan desde fuera.

```tsx
const [isLoading, setIsLoading] = React.useState(false);

<EmptyStateActionButton
  icon={isLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
  disabled={isLoading}
  onClick={start}
>
  {isLoading ? "Generando…" : "Sugerir con IA"}
</EmptyStateActionButton>
```

### Sin icono

```tsx
<EmptyStateActionButton>Ver ejemplos</EmptyStateActionButton>
```
