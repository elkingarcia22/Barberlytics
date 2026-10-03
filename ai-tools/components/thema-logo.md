# ThemaLogo

El isotipo Thema como SVG inline, blanco por defecto y con una leve escala al pasar el cursor. Pensado para superficies oscuras (sidebar, header, pantallas de acceso); en fondos claros pásale un color explícito o `currentColor`.

Familia: Primitivos · Doc: `/docs#/components/thema-logo` · Fuente: `src/components/ui/ThemaLogo.tsx`

```ts
import { ThemaLogo } from "@/components/ui/ThemaLogo"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `size` | `number` | `24` | Ancho en px; el alto es `size × 25 / 24`. |
| `color` | `string` | `"white"` | Relleno de los trazos. Acepta cualquier color CSS o `currentColor`. |
| `className` | `string` |  | Clases del contenedor (flex centrado con hover:scale-110). |

## Guías

- Sí: Úsalo sobre fondos oscuros o pásale un color con contraste suficiente.
- Sí: Respeta la proporción: cambia solo `size`, nunca estires el SVG.
- Sí: Deja aire alrededor: al menos la mitad del tamaño del isotipo.
- No: No lo recolorees con degradados ni sombras.
- No: No lo uses como botón sin envolverlo en un enlace o botón real.

Relacionados: thema-icon, thema-product-header

## Ejemplos

### Tamaños

`size` fija el ancho; el alto se deriva de la proporción 24:25 del isotipo.

```tsx
<ThemaLogo size={16} />
<ThemaLogo size={24} />
<ThemaLogo size={32} />
<ThemaLogo size={48} />
```

### Con nombre de marca

Isotipo más texto: el patrón del sidebar y del header de producto.

```tsx
<div className="flex items-center gap-2 text-white">
  <ThemaLogo size={20} />
  <span className="text-sm font-semibold tracking-tight">Thema</span>
</div>
```

### En superficie clara

Con `color="currentColor"` hereda el color del texto: aquí, el primario.

```tsx
<div className="text-primary">
  <ThemaLogo size={32} color="currentColor" />
</div>
```
