# Heading

Los seis niveles de título del sistema como un componente. El nivel fija tamaño, interlínea y etiqueta (h1–h6); `as` desacopla la etiqueta cuando la semántica del documento no coincide con el tamaño. Nadie escribe `text-[Npx]` ni `font-bold` a mano.

Familia: Tipografía · Doc: `/docs#/components/heading` · Fuente: `src/components/typography/Heading.tsx`

```ts
import { Heading } from "@/components/typography"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `level` | `1 \| 2 \| 3 \| 4 \| 5 \| 6` |  | Obligatoria. Fija tamaño, interlínea y la etiqueta por defecto (`h{level}`). |
| `as` | `keyof JSX.IntrinsicElements` | `h{level}` | Etiqueta a renderizar cuando la semántica no coincide con el nivel visual. |
| `weight` | `"semibold" \| "bold" \| "medium"` | `"semibold"` | Peso. `bold` para portadas; `medium` para títulos secundarios. |
| `tone` | `"default" \| "muted" \| "inverse"` | `"default"` | Color: `text-text-primary`, `text-text-muted` o `text-text-inverse` sobre fondos oscuros. |
| `truncate` | `boolean` | `false` | Una sola línea con elipsis. |
| `...props` | `React.HTMLAttributes<HTMLHeadingElement>` |  | Atributos nativos del encabezado, incluido `className`. |

## Guías

- Sí: La página empieza en nivel 2; el nivel 1 es para portadas.
- Sí: Baja de nivel en orden, sin saltos: una card en nivel 4 tiene sus bloques en 5 y 6.
- Sí: Usa `as` cuando necesites el tamaño de un nivel con otra etiqueta, no otro nivel.
- No: No fijes tamaños con `text-[Npx]` ni pesos con `font-*` en un Heading.
- No: No uses Heading para cifras: eso es `Text size="xl" weight="semibold" tabular`.
- No: No uses Heading para etiquetas de formulario ni eyebrows: eso es Label o `Text variant="small"`.

Relacionados: text, page-header, section-header

## Ejemplos

### Escala completa

Del 1 al 6. Dentro del producto la página arranca en el nivel 2; el 1 queda para portadas y páginas de marketing.

```tsx
<Heading level={1}>Nivel 1</Heading>
<Heading level={2}>Nivel 2</Heading>
<Heading level={3}>Nivel 3</Heading>
<Heading level={4}>Nivel 4</Heading>
<Heading level={5}>Nivel 5</Heading>
<Heading level={6}>Nivel 6</Heading>
```

### Cabecera de página

Nivel 2 para el título y un `Text variant="lead"` debajo. Es la pareja que abre cualquier pantalla del producto.

```tsx
<Heading level={2}>Encuestas de clima</Heading>
<Text variant="lead" className="mt-2 max-w-xl">
  Mide cómo se siente el equipo y detecta a tiempo lo que hay que cambiar.
</Text>
```

### Jerarquía dentro de una card

La card entra en nivel 4 y sus bloques bajan al 5 y al 6, sin saltarse ninguno. Los lectores de pantalla navegan por esa escalera.

```tsx
<Card className="p-card">
  <Heading level={4}>Ciclo Q3</Heading>
  <Text variant="muted" className="mt-1">Del 1 de julio al 30 de septiembre</Text>

  <Heading level={5} className="mt-5">Participantes</Heading>
  <Text className="mt-1">142 personas en 6 equipos.</Text>

  <Heading level={6} className="mt-4">Evaluadores</Heading>
  <Text className="mt-1">Líder directo y dos pares.</Text>
</Card>
```

### Truncado

`truncate` deja una sola línea con elipsis. El contenedor tiene que acotar el ancho (`min-w-0` dentro de un flex).

```tsx
<div className="flex w-72 items-center gap-3">
  <Heading level={5} truncate className="min-w-0 flex-1">
    Plan de desarrollo individual de María Fernanda Restrepo Gómez
  </Heading>
  <Badge>Activo</Badge>
</div>
```
