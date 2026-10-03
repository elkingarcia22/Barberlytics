# Kbd

Tecla de atajo en un `<kbd>` real, con aspecto de tecla física (20px o 16px de alto). Úsalo para indicar atajos en menús, tooltips, campos de búsqueda y páginas de ayuda; KbdGroup encadena varias teclas con «+».

Familia: Primitivos · Doc: `/docs#/components/kbd` · Fuente: `src/components/ui/kbd.tsx`

```ts
import { Kbd, KbdGroup } from "@/components/ui/kbd"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `size` | `"default" \| "sm"` | `"default"` | 20px de alto con texto de 11px, o 16px con texto de 10px. |
| `...props` | `React.ComponentProps<"kbd">` |  | Atributos nativos del elemento kbd. |
| `KbdGroup.separator` | `React.ReactNode \| null` | `"+"` | Se intercala entre teclas y queda oculto para lectores de pantalla. `null` las pega sin separador. |

## Guías

- Sí: Usa el símbolo del sistema del usuario (⌘ en macOS, Ctrl en el resto) y resuélvelo en tiempo de ejecución.
- Sí: Una tecla por Kbd; la combinación la arma KbdGroup.
- Sí: Añade `aria-label` cuando la tecla solo lleva un icono.
- No: No uses Kbd como botón: no es interactivo y anula los eventos de puntero.
- No: No documentes un atajo que no exista de verdad en la aplicación.
- No: No mezcles tamaños dentro de un mismo grupo.

Relacionados: tooltip, command, dropdown-menu, context-menu

## Ejemplos

### Pista en un campo de búsqueda

El atajo global ⌘K vive dentro del campo, alineado a la derecha, y no captura clics (`pointer-events-none`).

```tsx
<button type="button" className="flex h-9 w-72 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm text-text-muted">
  <Search className="size-4" />
  <span className="flex-1 text-left">Buscar colaboradores, cursos…</span>
  <KbdGroup>
    <Kbd>⌘</Kbd>
    <Kbd>K</Kbd>
  </KbdGroup>
</button>
```

### Dentro de un tooltip

Con `size="sm"` la tecla encaja en la línea de texto del tooltip sin agrandarlo.

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="outline">Guardar</Button>
  </TooltipTrigger>
  <TooltipContent className="flex items-center gap-2">
    Guardar cambios
    <KbdGroup>
      <Kbd size="sm">⌘</Kbd>
      <Kbd size="sm">S</Kbd>
    </KbdGroup>
  </TooltipContent>
</Tooltip>
```

### Lista de atajos

Acción a la izquierda, combinación a la derecha; cada fila es un `<dl>` implícito que se lee bien de corrido.

```tsx
{shortcuts.map(({ keys, action }) => (
  <div key={action} className="flex items-center justify-between py-2 text-sm">
    <span className="text-text-primary">{action}</span>
    <KbdGroup>
      {keys.map((key) => <Kbd key={key}>{key}</Kbd>)}
    </KbdGroup>
  </div>
))}
```

### Con icono

Un SVG dentro de la tecla se fija a 12px; útil para ⌘ o flechas cuando el símbolo tipográfico no se ve claro en la fuente.

```tsx
<KbdGroup>
  <Kbd><Command /></Kbd>
  <Kbd><ArrowUp /></Kbd>
  <Kbd>P</Kbd>
</KbdGroup>
```
