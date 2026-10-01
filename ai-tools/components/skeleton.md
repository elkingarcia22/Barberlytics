# Skeleton

Marcador de posición con pulso suave que ocupa el sitio del contenido mientras llega. Compón varios con las mismas medidas del contenido final para que la pantalla no salte al cargar.

Familia: Primitivos · Doc: `/docs#/components/skeleton` · Fuente: `src/components/ui/skeleton.tsx`

```ts
import { Skeleton } from "@/components/ui/skeleton"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `className` | `string` |  | Define ancho, alto y radio. Sin clases mide 0px: el esqueleto siempre necesita dimensiones. |
| `...props` | `React.ComponentProps<"div">` |  | Cualquier atributo nativo de <div>. |

## Guías

- Sí: Replica la silueta del contenido final: mismas alturas, anchos aproximados y radios.
- Sí: Usa `rounded-full` para avatares y `rounded-md/lg` para botones y medios.
- Sí: Muéstralo solo si la carga tarda más de ~300ms para evitar parpadeos.
- No: No lo uses para acciones en curso (guardar, enviar): ahí va Progress o un spinner.
- No: No pongas un único bloque gris gigante; varias piezas comunican mejor qué viene.

Relacionados: progress, card, table

## Ejemplos

### Perfil

Avatar redondo y dos líneas de distinto largo: la forma del contenido real.

```tsx
<div className="flex items-center gap-3">
  <Skeleton className="size-10 rounded-full" />
  <div className="flex flex-1 flex-col gap-2">
    <Skeleton className="h-4 w-2/3" />
    <Skeleton className="h-3 w-1/3" />
  </div>
</div>
```

### Tarjeta

Mantén el marco real (borde, padding) y sustituye solo el contenido.

```tsx
<div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-surface p-4">
  <Skeleton className="h-28 w-full rounded-lg" />
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-3 w-full" />
  <Skeleton className="h-3 w-5/6" />
  <div className="mt-1 flex gap-2">
    <Skeleton className="h-8 w-20 rounded-md" />
    <Skeleton className="h-8 w-16 rounded-md" />
  </div>
</div>
```

### Filas de tabla

Una fila esqueleto por fila esperada, con las mismas columnas.

```tsx
{rows.map((row) => (
  <div key={row} className="grid grid-cols-[1fr_96px_64px] items-center gap-4 border-b px-4 py-3">
    <div className="flex items-center gap-2">
      <Skeleton className="size-6 rounded-full" />
      <Skeleton className="h-3.5 w-32" />
    </div>
    <Skeleton className="h-5 w-16 rounded-md" />
    <Skeleton className="h-3.5 w-10" />
  </div>
))}
```

### Sustitución por contenido

El esqueleto y el contenido comparten dimensiones, así el cambio no mueve nada.

```tsx
{isLoading ? <ProfileSkeleton /> : <ProfileRow user={user} />}
```
