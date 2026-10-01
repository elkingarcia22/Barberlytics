# Separator

Línea de 1px en el color de borde, horizontal o vertical. Úsala para separar bloques de contenido o ítems de una fila cuando el espacio en blanco no basta.

Familia: Primitivos · Doc: `/docs#/components/separator` · Fuente: `src/components/ui/separator.tsx`

```ts
import { Separator } from "@/components/ui/separator"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Dirección de la línea. |
| `decorative` | `boolean` | `true` | Si es decorativa se oculta a lectores de pantalla; con `false` se anuncia como separador. |
| `className` | `string` |  | Márgenes (`my-4`, `mx-2`) o color alternativo. |

## Guías

- Sí: Añade el margen desde fuera (`my-*`, `mx-*`).
- Sí: Pon `decorative={false}` cuando separa secciones con sentido semántico.
- No: No apiles separadores entre cada elemento de una lista densa; usa bordes en los ítems.
- No: No la uses como línea de énfasis o decoración de color.

Relacionados: scroll-area, card

## Ejemplos

### Entre bloques

```tsx
<div className="space-y-1">
  <h4 className="text-sm font-semibold">Encuesta de clima</h4>
  <p className="text-xs text-text-secondary">Cerrada el 12 de marzo · 312 respuestas</p>
</div>
<Separator className="my-4" />
<p className="text-sm">Los resultados se comparten con líderes de equipo.</p>
```

### En una fila

La vertical usa `self-stretch`: el contenedor debe ser flex con altura.

```tsx
<div className="flex h-5 items-center gap-3 text-sm">
  <span>Vista previa</span>
  <Separator orientation="vertical" />
  <span>Duplicar</span>
  <Separator orientation="vertical" />
  <span>Archivar</span>
</div>
```
