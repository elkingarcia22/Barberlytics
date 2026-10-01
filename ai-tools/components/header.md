# Header

La franja superior de 80px del shell: migas, título y descripción a la izquierda; buscador y notificaciones a la derecha. El AdminShell usa su propio AppHeader con un slot para la identidad de la pantalla.

Familia: Layout y shell · Doc: `/docs#/components/header` · Fuente: `src/components/layout/Header.tsx`

```ts
import { Header } from "@/components/layout"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `title` | `string` |  | El `<h1>` de la pantalla. |
| `description` | `string` |  | Una línea bajo el título. |
| `breadcrumbs` | `string[]` | `[]` | Migas sobre el título; con array vacío no se renderizan. |
| `className` | `string` |  | Se mezcla con el `<header>` (`h-20 border-b bg-surface px-8`). |
| `...props` | `React.HTMLAttributes<HTMLElement>` |  | Atributos nativos del `<header>`. Reenvía `ref`. |

## Guías

- Sí: Deriva `title`, `description` y `breadcrumbs` de navigationConfig, no los escribas dos veces.
- Sí: Úsalo como cabecera de una app clásica con scroll interno en PageShell; su `shrink-0` y el borde inferior están pensados para ahí.
- No: No lo uses como cabecera de una tarjeta o sección: para eso están PageHeader y SectionHeader.
- No: No combines Header con AppHeader: pertenecen a shells distintos.

Relacionados: page-shell, app-header, breadcrumbs, page-header

## Ejemplos

### Título y descripción

Sin migas, el bloque de título ocupa la altura completa. La descripción es opcional.

```tsx
<Header title="Encuestas" description="Gestión de encuestas de clima y satisfacción" />
```

### Con migas

`breadcrumbs` es un array de textos; el último se marca como actual por Breadcrumbs.

```tsx
<Header title="Usuarios" description="Administración de usuarios y roles" breadcrumbs={["Administración", "Usuarios"]} />
```

### Alimentado por navigationConfig

La misma entrada que resalta la navegación da al header su título, descripción y migas: una sola fuente para toda la cabecera.

```tsx
const item = navigationConfig.find((entry) => entry.id === activeId)!;

<Header title={item.label} description={item.description} breadcrumbs={item.breadcrumbs} />
```
