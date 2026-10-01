# ThemaIcon

El wrapper único de iconos del sistema: se pide por nombre semántico del registro, no por proveedor, con tallas de camiseta y tonos semánticos. Hoy resuelve a Hugeicons (stroke rounded, 1.5); cambiar de set solo toca `iconRegistry.ts`.

Familia: Iconos · Doc: `/docs#/components/thema-icon` · Fuente: `src/icons/ThemaIcon.tsx`

```ts
import { ThemaIcon } from "@/icons"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `name` | `IconName` |  | Nombre semántico del registro (`iconRegistry.ts`). Obligatorio. |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | `"md"` | Talla: 14, 16, 24, 32 o 40px. |
| `tone` | `"default" \| "muted" \| "primary" \| "positive" \| "negative" \| "warning" \| "info" \| "inverse"` | `"default"` | Color semántico con tokens del tema. |
| `decorative` | `boolean` | `true` | Si es `true` se oculta a lectores de pantalla; si es `false` se expone como `role="img"`. |
| `label` | `string` |  | Texto para `aria-label` cuando `decorative` es `false`. |
| `className` | `string` |  | Clases extra; útil para el degradado de IA (`text-ai-gradient`) o animaciones. |

## Guías

- Sí: Pide siempre el icono por su nombre semántico; nunca importes el proveedor (Hugeicons o Lucide) directamente en un componente.
- Sí: Deja `decorative` en `true` cuando hay texto al lado que ya lo describe.
- Sí: Añade nombres nuevos al registro y al tipo `IconName` en vez de usar `className` para disfrazar otro icono.
- No: No uses tamaños arbitrarios con `className`; las cinco tallas son el sistema.
- No: No uses `tone="inverse"` sobre fondos claros.
- No: No pongas `label` sin `decorative={false}`: no tendrá efecto.

Relacionados: button, ai-spark-glyph, chip

## Ejemplos

### Tamaños

Cinco tallas fijas: xs 14px, sm 16px, md 24px, lg 32px y xl 40px. Dentro de Button el SVG hereda 16px sin necesidad de talla.

```tsx
<ThemaIcon name="analytics" size="xs" />
<ThemaIcon name="analytics" size="sm" />
<ThemaIcon name="analytics" />
<ThemaIcon name="analytics" size="lg" />
<ThemaIcon name="analytics" size="xl" />
```

### Tonos

Los tonos usan los tokens semánticos del tema; `inverse` es para fondos de color.

```tsx
<ThemaIcon name="success" tone="positive" />
<ThemaIcon name="error" tone="negative" />
<ThemaIcon name="warning" tone="warning" />
<ThemaIcon name="info" tone="info" />
<ThemaIcon name="bolt" tone="primary" />
<ThemaIcon name="settings" tone="muted" />
<span className="rounded-lg bg-primary p-2"><ThemaIcon name="sparkles" tone="inverse" /></span>
```

### Accesibilidad

Por defecto el icono es decorativo (`aria-hidden`). Si transmite significado por sí solo, pasa `decorative={false}` y un `label`: se convierte en `role="img"` con `aria-label`.

```tsx
{/* Decorativo: el texto del botón ya lo describe */}
<Button variant="outline"><ThemaIcon name="download" size="sm" /> Exportar</Button>

{/* Significativo: el icono es la única señal */}
<span className="inline-flex items-center gap-2">
  <ThemaIcon name="success" tone="positive" size="sm" decorative={false} label="Encuesta publicada" />
  Clima 2026
</span>
```

### Nombre desconocido

Un nombre que no esté en el registro cae en `IconFallback` (triángulo de alerta), para que se note en revisión en vez de dejar un hueco. TypeScript lo impide en tiempo de compilación.

```tsx
// @ts-expect-error: "rocket" no existe en IconName
<ThemaIcon name="rocket" tone="warning" />
```

### Catálogo completo

Aquí solo una muestra. La rejilla completa con los nombres del registro, copiables y con búsqueda, vive en la página de fundamentos «Iconos».

```tsx
import { iconRegistry, type IconName } from "@/icons";

const names = Object.keys(iconRegistry) as IconName[];
names.map((name) => <ThemaIcon key={name} name={name} />)
```
