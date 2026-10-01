# ThemaMobileTabBar

La barra inferior de la app móvil: hasta cinco destinos con icono, etiqueta y un badge opcional (contador o punto). Marca el activo en primario y expone `aria-current` para lectores de pantalla.

Familia: Navegación · Doc: `/docs#/components/thema-mobile-tab-bar` · Fuente: `src/components/navigation/ThemaMobileTabBar.tsx`

```ts
import { ThemaMobileTabBar } from "@/components/navigation"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `items` | `NavigationItem[]` |  | Destinos; solo se pintan los cinco primeros. Cada uno admite `icon`, `badge` y `disabled`. |
| `activeItemId` | `string` |  | Id del destino activo. |
| `onItemSelect` | `(id: string) => void` |  | Se llama al tocar un destino habilitado. |
| `className` | `string` |  | Clases para el <nav>; trae `h-16 bg-surface border-t`. |

## Guías

- Sí: Entre tres y cinco destinos, siempre con etiqueta.
- Sí: Usa `badge.dot` para «hay novedades» y `badge.count` solo cuando el número importa.
- Sí: Ánclala al fondo de la pantalla con `fixed bottom-0` en la app real.
- No: No la muestres en escritorio: ahí la navegación es el rail lateral.
- No: No pongas acciones (crear, subir) como destinos; son navegación, no comandos.

Relacionados: thema-tabs, tabs-nav, badge

## Ejemplos

### Cinco destinos con badges

Un contador en Tareas y un punto en Avisos. La pantalla cambia con la pestaña activa.

```tsx
const [active, setActive] = React.useState("home");

<ThemaMobileTabBar
  items={[
    { id: "home", label: "Inicio", icon: "home" },
    { id: "learning", label: "Aprender", icon: "graduation" },
    { id: "tasks", label: "Tareas", icon: "layers", badge: { count: 3 } },
    { id: "alerts", label: "Avisos", icon: "notification", badge: { dot: true } },
    { id: "profile", label: "Perfil", icon: "users" },
  ]}
  activeItemId={active}
  onItemSelect={setActive}
/>
```

### Tres destinos

Con menos ítems cada uno ocupa más ancho; el componente reparte el espacio con `flex-1`.

```tsx
<ThemaMobileTabBar
  items={[
    { id: "home", label: "Inicio", icon: "home" },
    { id: "learning", label: "Aprender", icon: "graduation" },
    { id: "profile", label: "Perfil", icon: "users" },
  ]}
  activeItemId={active}
  onItemSelect={setActive}
/>
```
