# WorkspaceMenu

El menú que cuelga de la marca del producto en el sidebar: antes de esto, ajustar la cuenta era un engranaje suelto en la cabecera y personalizar el tema otro botón aparte, compitiendo con la sucursal, el buscador y el avatar por sitio. Aquí es una sola puerta: la identidad del producto, lo que la app añada en `extra` (tema, idioma) y los grupos de `config.settings`, con un pie opcional que lleva a la pantalla que los reúne todos. El shell no sabe qué hay dentro de `extra` — solo le da un lugar entre la identidad y los ajustes.

Familia: Layout y shell · Doc: `/docs#/components/workspace-menu` · Fuente: `src/components/app-shell/WorkspaceMenu.tsx`

```ts
import { WorkspaceMenu } from "@/components/app-shell/WorkspaceMenu"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `trigger` | `React.ReactElement` |  | El elemento que lo abre: la fila de marca del panel expandido, o el icono solo en el rail plegado. |
| `productName` | `string` |  | Encabeza el menú, junto al `tagline` si lo hay. |
| `tagline` | `string` |  | Segunda línea bajo el nombre del producto. |
| `groups` | `SettingsGroup[]` | `config.settings` | Los ajustes agrupados. Cada ítem navega por `onNavigate`. |
| `all` | `{ id, label, path? }` |  | El pie del menú: la pantalla que reúne todos los ajustes. |
| `onNavigate` | `(id: string, path?: string) => void` |  | Al elegir un ajuste o el pie «Ver toda la configuración». |
| `extra` | `React.ReactNode` |  | Controles que la app añade entre la identidad y los ajustes — el shell no sabe qué son, típicamente `ThemeSelector` y `LanguageSelector`. |
| `side / align` | `"bottom" \| "right" · "start" \| "end"` | `"bottom" · "start"` | Lado del contenido: `bottom` para la fila expandida del panel, `right` para el icono del rail plegado. |

## Guías

- Sí: Da a `extra` el mismo peso visual que un ítem del menú (fila completa, no un botón suelto): así se lee como una sección más, no como un intruso.
- Sí: Deja que AppSidebar decida cuándo montarlo: sin `config.settings` (la documentación, por ejemplo), la marca se queda como identidad simple, sin abrir nada.
- Sí: Usa el mismo `config.settings` que ya alimentaba el engranaje de la cabecera; este componente no inventa su propio catálogo de ajustes.
- No: No lo dupliques en la cabecera: los ajustes solo se ofrecen desde la marca, para no repartir la misma puerta en dos sitios distintos.
- No: No metas contenido pesado y sin relación en `extra`; es un atajo a personalización, no un cajón de sastre.

Relacionados: admin-shell, app-sidebar, app-header, sidebar-icon-rail, dropdown-menu

## Ejemplos

### Identidad, personalización y ajustes

AppSidebar lo monta así: la fila de marca como disparador, `extra` con lo que la app quiera ofrecer para personalizar (tema, idioma) y los grupos de `ShellConfig.settings` debajo. Elegir un ajuste llama a `onNavigate` y cierra el menú.

```tsx
<WorkspaceMenu
  trigger={<BrandRow />}
  productName={brand.productName}
  tagline={brand.tagline}
  groups={config.settings}
  all={config.settingsAll}
  onNavigate={config.onNavigate}
  extra={<ThemeSelector className="w-full justify-start" />}
/>
```
