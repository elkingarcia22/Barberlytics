# ThemaProductHeader

La cabecera de un producto dentro de la plataforma: logo del cliente a la izquierda, título del módulo y un hueco a la derecha para acciones, notificaciones y perfil. Sin logo propio muestra la marca del cliente por defecto.

Familia: Navegación · Doc: `/docs#/components/thema-product-header` · Fuente: `src/components/navigation/ThemaProductHeader.tsx`

```ts
import { ThemaProductHeader } from "@/components/navigation"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `title` | `string` |  | Nombre del módulo o producto, en h1. |
| `logo` | `React.ReactNode` |  | Marca del cliente. Si se omite, se muestra un logo de ejemplo. |
| `children` | `React.ReactNode` |  | Acciones alineadas a la derecha (botones, badges, avatar). |
| `className` | `string` |  | Clases para el <header>; trae `h-16 rounded-xl shadow-card`. |

## Guías

- Sí: Una sola cabecera por producto, encima de la sub-navegación.
- Sí: Coloca el perfil siempre como último hijo, a la derecha del todo.
- Sí: Usa botones `ghost` de icono para búsqueda y notificaciones.
- No: No metas el título de la página aquí: este es el nombre del producto, no de la vista.
- No: No pases más de tres o cuatro acciones; el resto va a un menú.

Relacionados: thema-tabs, page-header, button, badge

## Ejemplos

### Con notificaciones

Los hijos van al bloque derecho. La campana lleva su propio contador y se limpia al pulsarla.

```tsx
const [unread, setUnread] = React.useState(4);

<ThemaProductHeader title="Aprendizaje" logo={<ThemaLogo />}>
  <Button variant="ghost" size="icon" aria-label="Buscar"><Search /></Button>
  <Button variant="ghost" size="icon" className="relative" onClick={() => setUnread(0)}>
    <Bell />
    {unread > 0 && <span className="…badge…">{unread}</span>}
  </Button>
  <Avatar />
</ThemaProductHeader>
```

### Logo por defecto

Sin `logo` aparece la marca del cliente de ejemplo; en producción pásale siempre la real.

```tsx
<ThemaProductHeader title="Encuestas">
  <Button size="sm" variant="outline">Exportar</Button>
</ThemaProductHeader>
```
