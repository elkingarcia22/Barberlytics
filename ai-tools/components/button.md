# Button

La acción del sistema. Seis variantes por intención (primaria, contorno, secundaria, fantasma, destructiva y enlace) y una escala de tamaños compacta pensada para interfaces densas.

Familia: Primitivos · Doc: `/docs#/components/button` · Fuente: `src/components/ui/button.tsx`

```ts
import { Button } from "@/components/ui/button"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `variant` | `"default" \| "outline" \| "secondary" \| "ghost" \| "destructive" \| "link"` | `"default"` | Intención visual del botón. |
| `size` | `"xs" \| "sm" \| "default" \| "lg" \| "icon-xs" \| "icon-sm" \| "icon" \| "icon-lg"` | `"default"` | Altura y padding. Las variantes icon-* son cuadradas. |
| `asChild` | `boolean` | `false` | Renderiza el hijo (p. ej. un <a>) con los estilos del botón. |
| `disabled` | `boolean` | `false` | Desactiva el botón y baja la opacidad al 50%. |
| `...props` | `React.ComponentProps<"button">` |  | Cualquier atributo nativo de <button>. |

## Guías

- Sí: Una sola acción primaria por vista o por drawer.
- Sí: Usa `destructive` solo para acciones irreversibles.
- Sí: Añade `aria-label` a los botones de solo icono.
- No: No uses `link` para acciones que cambian datos.
- No: No mezcles tamaños dentro del mismo grupo de acciones.

Relacionados: badge, ai-button

## Ejemplos

### Variantes

Una primaria por pantalla; el resto acompaña.

```tsx
<Button>Primaria</Button>
<Button variant="outline">Contorno</Button>
<Button variant="secondary">Secundaria</Button>
<Button variant="ghost">Fantasma</Button>
<Button variant="destructive">Eliminar</Button>
<Button variant="link">Enlace</Button>
```

### Tamaños

De xs (24px) a lg (36px). El tamaño por defecto es de 32px, la altura del header.

```tsx
<Button size="xs">Extra pequeño</Button>
<Button size="sm">Pequeño</Button>
<Button>Normal</Button>
<Button size="lg">Grande</Button>
```

### Con icono

Los SVG heredan 16px y la separación correcta; para solo icono usa las variantes icon-*.

```tsx
<Button><Download /> Descargar</Button>
<Button variant="outline">Siguiente <ArrowRight /></Button>
<Button size="icon" aria-label="Añadir"><Plus /></Button>
<Button size="icon-sm" variant="destructive" aria-label="Eliminar"><Trash2 /></Button>
```

### Cargando y deshabilitado

```tsx
<Button disabled><Loader2 className="animate-spin" /> Guardando…</Button>
<Button variant="outline" disabled>Deshabilitado</Button>
```

### Como enlace (asChild)

Con `asChild` el estilo se aplica al hijo, así un enlace real conserva su semántica.

```tsx
<Button asChild>
  <a href="#/foundations/themes">Ir a temas</a>
</Button>
```
