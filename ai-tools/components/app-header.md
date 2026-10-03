# AppHeader

La franja de 56px del AdminShell. A la izquierda, el hueco donde la pantalla portala su identidad (ShellHeaderSlot). A la derecha, la búsqueda general primero, Novedades, ayuda, las notificaciones y, cerrando la fila, `AccountMenu`: la foto y el nombre de la persona con «sucursal · rol» debajo, y un solo menú que cambia de sucursal, cambia de rol y cierra la sesión. Los ajustes, el tema y el idioma no están aquí: viven en `WorkspaceMenu` y en «Personalización», colgados de la marca del sidebar. Los popovers se abren desde el punto exacto de su botón. Por debajo de `md` la fila se queda con lo que responde a la pantalla que estás mirando —búsqueda, notificaciones y el chip de la cuenta, que sigue siendo el mismo chip y solo cede ancho—: la ayuda se va y Novedades baja al pie del menú lateral.

Familia: Layout y shell · Doc: `/docs#/components/app-header` · Fuente: `src/components/app-shell/AppHeader.tsx`

```ts
import { AppHeader } from "@/components/app-shell/AppHeader"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `config.companies` | `Company[]` | `COMPANIES` | Los espacios entre los que se cambia desde el menú de la cuenta: empresas, sucursales, sedes. `chrome.company: false` los quita. |
| `config.activeCompanyId` | `string` |  | Espacio activo controlado desde fuera. Sin él, el header arranca en el primero y gestiona su propio estado. |
| `config.onSelectCompany` | `(id: string) => void` |  | Al elegir otro espacio. Todo lo que se ve debajo es de ese espacio, así que la app decide qué recarga. |
| `config.workspaceLabels` | `ShellWorkspaceLabels` | `Empresa` | Cómo se lee el espacio en este producto: `entity` («Sucursal»), `change` («Cambiar de sucursal») y `list` («Tus sucursales»). |
| `config.showWorkspaceUsage` | `boolean` | `true` | Licencias y créditos dentro del menú. Un producto que no las vende lo apaga y el menú queda en identidad y cambio. |
| `config.roles` | `UserRoleOption[]` | `USER_ROLES` | Roles que la persona puede asumir. Con menos de dos el chip no los menciona. `chrome.role: false` quita la lista del menú. |
| `config.activeRoleId` | `string` |  | Rol activo controlado desde fuera. Sin él, el header arranca en el primero y gestiona su propio estado. |
| `config.onSelectRole` | `(id: string) => void` |  | Al elegir un rol. La app decide qué recarga: navegación, permisos o la pantalla entera. |
| `onToggleSidebar` | `() => void` |  | El botón «Menú», visible solo por debajo de `lg`, donde el sidebar es un cajón. |
| `onOpenNews` | `() => void` |  | Obsoleto: Novedades ya se abre solo. Se mantiene por compatibilidad. |
| `onSlotRef` | `(element: HTMLDivElement \| null) => void` |  | Recibe el elemento del hueco de identidad para pasarlo a ShellHeaderSlotProvider. |

## Guías

- Sí: Guarda el elemento de `onSlotRef` en estado (no en un ref): el slot se monta después del primer render y los consumidores necesitan re-renderizar.
- Sí: Usa ShellHeaderSlot para identidad corta: nombre, estado, autosave. Máximo una línea.
- Sí: Cuando cambie el rol o la sucursal, reacciona en `onSelectRole` / `onSelectCompany`: el shell solo mueve la marca, la navegación y los permisos son de la app.
- Sí: Da a `workspaceLabels` el nombre que usa el producto: el mismo conmutador se lee «Empresa» en un SaaS y «Sucursal» en un negocio con locales.
- No: No pongas migas en el header: la navegación vive en el sidebar y el hueco es para la pantalla.
- No: No montes AppHeader fuera de AdminShell salvo para probarlo; los popovers asumen el ancho del shell.
- No: No repartas el contexto: quién, dónde y como quién son la misma pregunta y viven en la misma puerta, con el rol y la sucursal visibles en el propio chip.
- No: No dejes el chip de la cuenta en la cara sola en móvil: es donde más cuesta saber en qué sucursal estás. Si falta ancho, lo que sale de la fila es lo que no depende de la pantalla (Novedades, ayuda).
- No: No metas la configuración en el árbol de navegación ni de vuelta en esta cabecera: se ajusta una vez, así que vive en `WorkspaceMenu`, colgado de la marca (ver `admin-shell` y `workspace-menu`).

Relacionados: admin-shell, account-menu, app-sidebar, workspace-menu, header, save-indicator

## Ejemplos

### Identidad de la pantalla en el header

El header entrega el elemento del hueco por `onSlotRef`; AdminShell lo pasa al proveedor y la pantalla lo llena con ShellHeaderSlot. Así el nombre que se está escribiendo o el estado de autosave siguen siendo estado de la pantalla.

```tsx
// En AdminShell:
<AppHeader … onSlotRef={setHeaderSlot} />
<ShellHeaderSlotProvider value={headerSlot}>{children}</ShellHeaderSlotProvider>

// En la pantalla:
<ShellHeaderSlot>
  <span className="text-sm font-semibold">{name}</span>
  <Badge variant="secondary">{status}</Badge>
</ShellHeaderSlot>
```

### Novedades, notificaciones y cuenta

Abre cada popover: las filas entran escalonadas y la máscara se abre desde el centro del botón (`liquid`). El chip de la cuenta abre la persona con su correo, la sucursal, los roles y el cierre de sesión en un solo menú. El tema y el idioma ya no están en esta cabecera: están en «Personalización», dentro de `WorkspaceMenu` (ver el componente en `layout`), colgado de la marca del sidebar.

```tsx
<AppHeader
  onToggleSidebar={toggleSidebar}
  isDark={isDark}
  onToggleDark={() => setIsDark((value) => !value)}
  onOpenNews={noop}
  onSlotRef={setHeaderSlot}
/>
```
