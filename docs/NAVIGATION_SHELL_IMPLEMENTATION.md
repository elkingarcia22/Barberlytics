# NAVIGATION_SHELL_IMPLEMENTATION

## Descripción
Infraestructura de navegación del shell. Los componentes son configurables por props, están desacoplados de rutas reales y se alinean con los tokens del sistema.

> **Nota de limpieza (2026-09-20):** `PlaygroundSidebar`, `ThemaSubNav` y `SidebarRail` se eliminaron por quedar
> redundantes con la navegación del shell de administración (`AppSidebar` dentro de `AdminShell`) y con
> `ThemaTabs` / `TabsNav` para la navegación secundaria. Sus archivos de configuración exclusivos
> (`playgroundNavigation.ts` y `subNavNavigation.ts`) se retiraron con ellos.

## Componentes Implementados

### 1. `AppSidebar` (dentro de `AdminShell`)
La navegación vertical del producto.
- **Visual**: Fondo oscuro (`bg-surface-nav`), estados activo/hover y agrupación por secciones.
- **Modos**: Rail contraído y panel expandido, con drill-down a subsecciones.
- **Datos**: Se alimenta de `ShellConfig.navigation`; cada nodo puede llevar su `path`.

### 2. `ThemaTabs` y `TabsNav`
Navegación horizontal secundaria.
- **UX**: Scroll horizontal en móvil e indicador de pestaña activa.
- **Acciones**: Basados en callbacks, así funcionan con o sin router.

### 3. `ThemaMobileTabBar`
Barra de navegación inferior para dispositivos móviles.
- **Diseño**: Max 5 ítems con etiquetas y badges.
- **Accesibilidad**: Targets táctiles optimizados y soporte de Aria labels.

## Tipado (`navigationTypes.ts`)
Interfaces estrictas para cualquier configuración de navegación:
- `NavigationItem`: ID, Label, Icon, Badge, Role.
- `NavigationSection`: Agrupación de ítems.
- `ProductSubNavItem`: Estructura simplificada para navegación secundaria.

El árbol del shell de administración usa sus propios tipos (`NavEntry`, `NavRoot`, `NavChild`, `NavLeaf`),
exportados desde `@/components/app-shell`.

## Reglas de Uso
- **No Hardcoding**: La navegación no se define dentro de los componentes; entra por `ShellConfig` o por props.
- **Tokens Only**: Prohibido el uso de HEX. Se utilizan clases de Tailwind mapeadas a `tokens.css`.
- **Accessibility First**: Elementos semánticos (`nav`, `button`) y atributos ARIA en todos los componentes.

---
*Implementación de Navegación v2.0*
