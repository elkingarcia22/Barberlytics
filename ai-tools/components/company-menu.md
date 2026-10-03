# CompanyMenu

El espacio de trabajo activo y su cambio. En la cabecera de la aplicación (`placement="header"`) es un `HeaderChip`: una sola línea con la marca y el nombre, sin rótulo apretado encima — el tipo («Sucursal») se lee dentro, en la cabecera del menú que abre, donde sí hay sitio para la frase completa. El menú trae el consumo de licencias y créditos como anillos de proporción —apagable con `showUsage` para un producto que no las vende—, los enlaces de administración y un submenú lateral para cambiar. `labels` decide cómo se lee: empresa, sucursal o sede. La cabecera de la aplicación ya no lo monta: ahí el espacio activo va con la persona y el rol en la misma puerta (ver `AccountMenu`). Este queda para el espacio activo a solas —un sidebar, un producto sin cuenta ni roles que asumir—.

Familia: Layout y shell · Doc: `/docs#/components/company-menu` · Fuente: `src/components/app-shell/CompanyMenu.tsx`

```ts
import { CompanyMenu, CompanyMark } from "@/components/app-shell/CompanyMenu"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `companies` | `readonly Company[]` |  | Todas las empresas de la persona; alimentan el submenú «Cambiar de empresa». |
| `activeCompany` | `Company` |  | El espacio mostrado en el disparador y en la cabecera del menú. `licenses` y `credits` son pares `[usado, total]` opcionales; `meta` es la línea que se lee bajo el nombre. |
| `onSelectCompany` | `(id: string) => void` |  | Al elegir otra empresa en el submenú. |
| `links` | `readonly string[]` |  | Etiquetas de los enlaces de administración, entre el consumo y el cambio de empresa. |
| `linkIcons` | `readonly React.ComponentType<{ className?: string }>[]` |  | Iconos opcionales para `links`, en el mismo orden. |
| `placement` | `"sidebar" \| "header"` | `"sidebar"` | Dónde vive el disparador: la fila ancha del sidebar o el chip compacto de la cabecera de la aplicación. |
| `labels` | `ShellWorkspaceLabels` | `Empresa` | Cómo se lee el espacio: `entity`, `change` y `list`. |
| `showUsage` | `boolean` | `true` | Los anillos de licencias y créditos. Apagado (o sin esos datos en la empresa), el menú es identidad y cambio. |
| `CompanyMark` | `{ company: Company; size?: "sm" \| "md" }` |  | Export secundario: la marca cuadrada de una empresa, reutilizada por el rail plegado. |

## Guías

- Sí: Deja que AppHeader lo monte con `companies` y `companyMenuLinks` de ShellConfig; los enlaces y los rótulos se personalizan ahí.
- Sí: Mantén `licenses` y `credits` como pares `[usado, total]`: el anillo calcula el porcentaje por sí solo.
- Sí: Da a cada empresa un `bg` con contraste suficiente para la inicial en blanco; sin `bg`, la marca usa el color del tema.
- Sí: Describe cada espacio con `meta` cuando no sean empresas: una sucursal se reconoce por su dirección, no por su plan.
- No: No conviertas «Cambiar de empresa» en una vista que sustituya al menú: el submenú lateral existe para no perder de vista dónde se estaba.
- No: No añadas más de cinco o seis enlaces; el menú es un atajo, no la navegación de administración.
- No: No dejes el rótulo en «Empresa» si el producto trabaja por sucursales: el chip es lo único que dice en qué contexto ocurre todo lo demás.

Relacionados: account-menu, app-sidebar, sidebar-icon-rail, admin-shell, dropdown-menu

## Ejemplos

### Menú y cambio de empresa

Abre el menú y pasa por «Cambiar de empresa»: el submenú sale al lado, marca la activa con un check y muestra plan y personas de cada una. Elegir otra dispara `onSelectCompany` y cierra todo.

```tsx
const [activeId, setActiveId] = React.useState(COMPANIES[0].id);
const activeCompany = COMPANIES.find((c) => c.id === activeId) ?? COMPANIES[0];

<CompanyMenu
  companies={COMPANIES}
  activeCompany={activeCompany}
  onSelectCompany={setActiveId}
  links={COMPANY_MENU_LINKS}
/>
```

### Sucursales en la cabecera

El mismo componente para un negocio con locales: `labels` cambia cómo se lee, `showUsage={false}` quita las licencias que aquí no existen y `links={[]}` deja el menú en identidad y cambio, porque la administración vive en el menú de configuración. La línea bajo el nombre sale de `company.meta`.

```tsx
<CompanyMenu
  placement="header"
  companies={BRANCHES}
  activeCompany={activeBranch}
  onSelectCompany={setBranchId}
  links={[]}
  showUsage={false}
  labels={{ entity: "Sucursal", change: "Cambiar de sucursal", list: "Tus sucursales" }}
/>
```

### Enlaces con icono

`linkIcons` va en el mismo orden que `links`; los que falten se pintan sin icono.

```tsx
<CompanyMenu
  companies={COMPANIES}
  activeCompany={activeCompany}
  onSelectCompany={setActiveId}
  links={["Gestión de usuarios", "Personalización", "Organigrama", "Datos de empresa", "Roles y permisos"]}
  linkIcons={[Users, Palette, Network, Building2, ShieldCheck]}
/>
```

### Una sola empresa

Con una empresa el submenú sigue existiendo, pero lista solo la activa. Si el producto no tiene multiempresa, apaga `chrome.company` en ShellConfig en vez de ocultar esto.

```tsx
<CompanyMenu companies={[COMPANIES[1]]} activeCompany={COMPANIES[1]} onSelectCompany={() => undefined} links={COMPANY_MENU_LINKS} />
```

### CompanyMark

La marca cuadrada que usa el menú y el rail plegado: inicial sobre el color de la empresa, o el logo de Google cuando `isGoogle`. Dos tallas: `md` (32px) y `sm` (24px).

```tsx
<CompanyMark company={COMPANIES[0]} />
<CompanyMark company={COMPANIES[1]} />
<CompanyMark company={COMPANIES[2]} size="sm" />
```
