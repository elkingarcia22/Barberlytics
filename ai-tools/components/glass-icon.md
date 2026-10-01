# GlassIcon

Ilustración «glass» de 48, 64 o 96px: dos capas de cristal con gradiente, brillo superior y el glifo del registro en blanco. Es para atajos del inicio, indicadores y estados vacíos, siempre acompañada de texto; para iconos en línea sigue siendo ThemaIcon.

Familia: Iconos · Doc: `/docs#/components/glass-icon` · Fuente: `src/icons/GlassIcon.tsx`

```ts
import { GlassIcon } from "@/icons"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `name` | `IconName` |  | Nombre semántico del glifo; reutiliza el mismo registro que ThemaIcon. Obligatorio. |
| `tone` | `"violet" \| "blue" \| "green" \| "orange" \| "rose" \| "amber" \| "teal" \| "brand"` | `"violet"` | Par de gradiente. `brand` usa las variables del gradiente de marca del tema. |
| `size` | `48 \| 64 \| 96` | `64` | Lado del cuadrado en píxeles. |
| `label` | `string` |  | Etiqueta accesible. Sin ella la ilustración es decorativa (`aria-hidden`); con ella pasa a `role="img"`. |
| `className` | `string` |  | Clases extra del SVG (p. ej. una sombra o un margen). |

## Guías

- Sí: Acompáñala siempre de texto: es una ilustración, no un icono de acción.
- Sí: Elige un tono por significado y mantenlo en toda la app: la misma función, el mismo color.
- Sí: Usa `brand` cuando la ilustración represente al producto o a la empresa, no a un módulo.
- No: No la uses en botones, celdas de tabla ni a menos de 48px; ahí va ThemaIcon.
- No: No mezcles más de tres o cuatro tonos en la misma vista.
- No: No pongas `label` si ya hay texto al lado: se leería dos veces.

Relacionados: thema-icon, empty-state, badge

## Ejemplos

### Tonos

Siete pares de gradiente fijos más `brand`, que sigue al gradiente de marca del tema activo (`--color-brand-gradient-*`).

```tsx
<GlassIcon name="survey" tone="violet" />
<GlassIcon name="calendar" tone="blue" />
<GlassIcon name="success" tone="green" />
<GlassIcon name="bolt" tone="orange" />
<GlassIcon name="notification" tone="rose" />
<GlassIcon name="award" tone="amber" />
<GlassIcon name="analytics" tone="teal" />
<GlassIcon name="sparkles" tone="brand" />
```

### Tamaños

Tres tamaños cerrados: 48 para indicadores, 64 para atajos y tarjetas, 96 para estados vacíos. El glifo escala con el cristal.

```tsx
<GlassIcon name="users" tone="blue" size={48} />
<GlassIcon name="users" tone="blue" />
<GlassIcon name="users" tone="blue" size={96} />
```

### Atajo con texto

El uso típico: ilustración a la izquierda, título y descripción al lado. La ilustración es decorativa (`aria-hidden`) porque el texto ya la describe.

```tsx
<a href="/encuestas" className="flex items-center gap-4 rounded-2xl border border-border/60 bg-surface p-4">
  <GlassIcon name="survey" tone="violet" />
  <span>
    <strong className="block text-sm font-semibold text-text-primary">Encuestas</strong>
    <span className="text-[13px] text-text-secondary">Mide el clima de tu equipo.</span>
  </span>
</a>
```

### Estado vacío

A 96px y con `tone="brand"` encabeza un estado vacío sin competir con el título.

```tsx
<div className="flex flex-col items-center gap-3 py-8 text-center">
  <GlassIcon name="users" tone="brand" size={96} />
  <p className="text-base font-semibold text-text-primary">Aún no hay colaboradores</p>
  <p className="text-sm text-text-secondary">Importa tu plantilla o invita al primero.</p>
</div>
```

### Accesibilidad

Sin `label` el SVG lleva `aria-hidden`. Si la ilustración es la única señal (un indicador sin texto), dale `label` y pasa a `role="img"`.

```tsx
{/* Decorativa: el texto la describe */}
<GlassIcon name="success" tone="green" size={48} /> Publicada

{/* Significativa: sin texto al lado */}
<GlassIcon name="success" tone="green" size={48} label="Publicada" />
```
