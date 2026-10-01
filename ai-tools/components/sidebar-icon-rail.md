# SidebarIconRail

El rail de iconos de 64px que queda a la vista cuando el sidebar se pliega: no es el panel encogido, sino una capa propia que nunca cambia de ancho, así los iconos no viajan durante la transición. Cada raíz sin hijos navega directo; una sección con hijos abre su árbol a la derecha al pasar el puntero, con submenú para los nietos; los grupos se vuelven separadores y el conmutador Workspace / Agente IA se apila.

Familia: Layout y shell · Doc: `/docs#/components/sidebar-icon-rail` · Fuente: `src/components/app-shell/SidebarIconRail.tsx`

```ts
import { SidebarIconRail } from "@/components/app-shell/SidebarIconRail"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `navigation` | `readonly NavEntry[]` |  | El árbol del sidebar: raíces (`kind: "item"`) y grupos (`kind: "group"`), normalmente `NAV_TREE` o `config.navigation`. |
| `currentNodeId` | `string` |  | Id del nodo activo, en cualquier nivel. |
| `holdsCurrent` | `(item: NavRoot, currentNodeId: string) => boolean` |  | Decide si una raíz se enciende: ella misma o algo que cuelgue de ella. |
| `onSelectRoot` | `(item: NavRoot) => void` |  | Al pulsar una raíz sin hijos. |
| `onSelectNode` | `(id: string) => void` |  | Al elegir un hijo o una hoja desde el desplegable de una sección. |
| `mode` | `"workspace" \| "agent"` |  | Qué botón del conmutador apilado está pulsado. |
| `onModeChange` | `(mode: ShellMode) => void` |  | Al pulsar Workspace o Agente IA. |
| `onExpand` | `() => void` |  | Al pulsar «Expandir menú», el botón superior. |
| `onOpenFeedback` | `() => void` |  | Al pulsar «Feedback» en el pie. |
| `brandMark` | `React.ReactNode` |  | La marca; AppSidebar pasa `<BrandSlot variant="icon" />`: el isologo de la barbería o, sin él, la flecha de Barberlytics. El espacio activo (empresa, sucursal) se cambia desde la cabecera, no desde aquí. |
| `brandLabel` | `string` |  | Nombre del producto, para el tooltip y el `aria-label` de la marca. |
| `className` | `string` |  | Clases extra del `<nav>`. |

## Guías

- Sí: Deja que AppSidebar lo monte y lo superponga al panel; suelto solo sirve para probarlo.
- Sí: Pasa el mismo `holdsCurrent` que usa el panel para que ambos enciendan la misma raíz.
- Sí: Apaga la marca o el conmutador desde `chrome` en ShellConfig, nunca con CSS.
- No: No animes su ancho: la gracia es que mide 64px siempre y el panel se desliza por encima.
- No: No pongas raíces sin icono en NAV_TREE; en el rail el icono es lo único que se ve.
- No: No metas más de tres niveles: el submenú del desplegable es el último.

Relacionados: app-sidebar, company-menu, admin-shell, tooltip, dropdown-menu

## Ejemplos

### Raíces, secciones y grupos

«Inicio», «Diagnóstico», «Tareas» y «Avisos» navegan al pulsar. «Selección», «Aprendizaje» y «Desempeño» tienen hijos: su icono abre el árbol al pasar el puntero (también con clic y teclado) y «Aprendizaje» muestra submenús para LMS Creator, Planes y Certificados. Los dos grupos de NAV_TREE son los separadores.

```tsx
function holdsCurrent(item: NavRoot, currentNodeId: string) {
  if (item.id === currentNodeId) return true;
  return (item.children ?? []).some(
    (child) => child.id === currentNodeId || (child.children ?? []).some((leaf) => leaf.id === currentNodeId)
  );
}

<SidebarIconRail
  navigation={NAV_TREE}
  currentNodeId={currentNodeId}
  holdsCurrent={holdsCurrent}
  onSelectRoot={(item) => setCurrentNodeId(item.id)}
  onSelectNode={setCurrentNodeId}
  mode={mode}
  onModeChange={setMode}
  onExpand={expand}
  onOpenFeedback={openFeedback}
  brandMark={<BrandMark />}
  brandLabel={brand.productName}
/>
```

### Activo dentro de una sección

Con `currentNodeId="encuestas"` se enciende el icono de «Desempeño», porque `holdsCurrent` mira hijos y nietos. Así la persona sabe dónde está aunque el panel esté plegado.

```tsx
<SidebarIconRail currentNodeId="encuestas" holdsCurrent={holdsCurrent} … />
```

### Sin conmutador de agente

El rail lee `chrome.modeSwitch` de ShellConfig. Una vista sin agente (la documentación, por ejemplo) lo apaga ahí y el rail va de la marca directo a la navegación. La marca del producto no se apaga: es lo único que no cambia nunca.

```tsx
<ShellConfigContext.Provider value={resolveShellConfig({ chrome: { modeSwitch: false } })}>
  <SidebarIconRail … />
</ShellConfigContext.Provider>
```
