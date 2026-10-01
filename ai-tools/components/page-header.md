# PageHeader

El encabezado de nivel superior de una pantalla: breadcrumbs, título h1 con descripción, acciones primarias a la derecha y una fila de metadatos. Úsalo una vez por página, justo debajo del header de la app, para que todas las vistas abran igual.

Familia: Utilidades · Doc: `/docs#/components/page-header` · Fuente: `src/components/utility/PageHeader.tsx`

```ts
import { PageHeader } from "@/components/utility"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `title` | `React.ReactNode` |  | Título de la página (h1). Acepta nodos para añadir badges o iconos. |
| `description` | `string` |  | Subtítulo en color muted bajo el título. |
| `breadcrumbs` | `React.ReactNode` |  | Fila superior de navegación contextual. |
| `actions` | `React.ReactNode` |  | Acciones alineadas a la derecha; en móvil pasan debajo del título. |
| `meta` | `React.ReactNode` |  | Fila inferior de metadatos con gap de 16px y texto en 14px muted. |
| `...props` | `Omit<React.HTMLAttributes<HTMLDivElement>, "title">` |  | Atributos del contenedor. |

## Guías

- Sí: Un solo PageHeader por pantalla, con una sola acción primaria.
- Sí: Usa los breadcrumbs cuando la página está a dos o más niveles de profundidad.
- Sí: Reserva `meta` para datos que cambian (contadores, fechas, estado).
- No: No lo uses dentro de drawers o tarjetas: para secciones internas está SectionHeader.
- No: No pongas más de tres acciones; agrupa el resto en un menú.

Relacionados: section-header, tag, badge, button, breadcrumb

## Ejemplos

### Completo, con estado en el título

El título acepta nodos: aquí lleva un Badge que cambia al publicar.

```tsx
<PageHeader
  breadcrumbs={<Breadcrumbs items={["Programas", "Onboarding comercial"]} />}
  title={
    <span className="flex items-center gap-2">
      Onboarding comercial
      <Badge variant={published ? "default" : "neutral"}>{published ? "Publicado" : "Borrador"}</Badge>
    </span>
  }
  description="Ruta de 12 lecciones para nuevos ingresos del equipo de ventas."
  actions={
    <>
      <Button variant="outline" size="sm">Vista previa</Button>
      <Button size="sm" onClick={togglePublished}>{published ? "Despublicar" : "Publicar"}</Button>
    </>
  }
  meta={
    <>
      <span className="inline-flex items-center gap-1.5"><Users className="size-4" /> 48 inscritos</span>
      <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" /> Actualizado hace 2 días</span>
    </>
  }
/>
```

### Solo título

Para listados y pantallas de índice basta con el título y una acción.

```tsx
<PageHeader title="Equipos" actions={<Button size="sm"><Plus /> Crear equipo</Button>} />
```

### Metadatos con Tags

```tsx
<PageHeader
  title="Reporte trimestral"
  description="Avance consolidado por área."
  meta={
    <>
      <Tag label="Q3 2026" />
      <Tag label="Comercial" tone="info" />
      <Tag label="Solo lectura" tone="warning" />
    </>
  }
/>
```
