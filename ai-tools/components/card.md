# Card

Superficie elevada que agrupa contenido relacionado con cabecera, cuerpo y pie opcionales. Úsala para resumir una entidad, un métrica o un formulario corto; no como envoltorio genérico de cualquier sección.

Familia: Primitivos · Doc: `/docs#/components/card` · Fuente: `src/components/ui/card.tsx`

```ts
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `Card` | `React.HTMLAttributes<HTMLDivElement>` |  | Contenedor con borde, radio 2xl y sombra `shadow-card`. Acepta `ref`. |
| `CardHeader` | `React.HTMLAttributes<HTMLDivElement>` |  | Columna con `p-6` y separación entre título y descripción. |
| `CardTitle` | `React.HTMLAttributes<HTMLDivElement>` |  | Título en 18px bold. Renderiza un div; pon un heading dentro si lo necesitas. |
| `CardDescription` | `React.HTMLAttributes<HTMLDivElement>` |  | Texto secundario en 14px. |
| `CardContent` | `React.HTMLAttributes<HTMLDivElement>` |  | Cuerpo con `p-6 pt-0`. |
| `CardFooter` | `React.HTMLAttributes<HTMLDivElement>` |  | Fila con borde superior para acciones o enlaces. |

## Guías

- Sí: Una idea por tarjeta: una entidad, una métrica o una acción.
- Sí: Alinea las acciones a la derecha del pie y deja una sola primaria.
- Sí: Reduce el padding (`p-4`) en cuadrículas densas.
- No: No anides tarjetas dentro de tarjetas.
- No: No uses Card como contenedor de página completa; para eso está el layout.
- No: No mezcles tarjetas con y sin sombra en la misma cuadrícula.

Relacionados: border-beam, badge, button

## Ejemplos

### Tarjeta de métrica

Cabecera compacta con icono y un valor grande en el cuerpo.

```tsx
<Card className="w-64">
  <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
    <CardDescription>Usuarios activos</CardDescription>
    <Users className="size-4 text-text-muted" />
  </CardHeader>
  <CardContent>
    <p className="text-3xl font-bold">1.284</p>
    <p className="mt-1 flex items-center gap-1 text-xs text-success"><TrendingUp className="size-3" /> +12% vs. mes anterior</p>
  </CardContent>
</Card>
```

### Formulario corto

Label + Input dentro del cuerpo y las acciones en el pie.

```tsx
<Card className="w-full max-w-sm">
  <CardHeader>
    <CardTitle>Crear equipo</CardTitle>
    <CardDescription>Podrás invitar miembros después.</CardDescription>
  </CardHeader>
  <CardContent className="space-y-3">
    <div className="space-y-1.5">
      <Label htmlFor="team-name">Nombre</Label>
      <Input id="team-name" placeholder="Ventas LATAM" />
    </div>
  </CardContent>
  <CardFooter className="justify-end gap-2">
    <Button variant="ghost">Cancelar</Button>
    <Button>Crear</Button>
  </CardFooter>
</Card>
```

### Tarjetas seleccionables

La tarjeta actúa como control: `role="button"`, foco visible y anillo cuando está elegida.

```tsx
const [selected, setSelected] = React.useState("growth");

{PLANS.map((plan) => (
  <Card
    key={plan.id}
    role="button"
    tabIndex={0}
    aria-pressed={plan.id === selected}
    onClick={() => setSelected(plan.id)}
    className={cn("cursor-pointer hover:border-primary/40", plan.id === selected && "border-primary ring-2 ring-primary/20")}
  >
    <CardHeader className="p-4">
      <CardTitle className="text-base">{plan.name}</CardTitle>
      <CardDescription>{plan.detail}</CardDescription>
    </CardHeader>
    <CardContent className="p-4 pt-0 text-2xl font-bold">{plan.price}</CardContent>
  </Card>
))}
```

### Con enlace en el pie

```tsx
<Card className="w-full max-w-sm">
  <CardHeader>
    <CardTitle>Reporte semanal</CardTitle>
    <CardDescription>Generado el lunes a las 8:00.</CardDescription>
  </CardHeader>
  <CardFooter>
    <Button variant="link" className="px-0" asChild>
      <a href="#/components/table">Abrir reporte <ArrowUpRight /></a>
    </Button>
  </CardFooter>
</Card>
```
