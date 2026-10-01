# AccountMenu

Quién eres, dónde estás y como quién estás mirando, en una sola puerta al final de la cabecera. Antes eran tres piezas repartidas —el chip de sucursal a la izquierda, el de rol junto al avatar y el avatar con su propio menú— y las tres respondían a la misma pregunta. El disparador lleva borde —se lee como botón, no como firma de la pantalla— y enseña la foto, la sucursal activa y, debajo, el rol en una píldora: el nombre no se escribe porque ya lo dicen la foto y sus iniciales, y dentro está entero con el correo; el menú abre con el nombre y el correo, cambia de sucursal (submenú lateral, pueden ser muchas), cambia de rol (lista directa, son un puñado) y cierra la sesión. Nada más: el tema y el idioma son de la plataforma, no de la cuenta, y viven en «Personalización», colgando de la marca. AppHeader lo monta con los datos de ShellConfig; documéntalo suelto solo para ver sus estados.

Familia: Layout y shell · Doc: `/docs#/components/account-menu` · Fuente: `src/components/app-shell/AccountMenu.tsx`

```ts
import { AccountMenu } from "@/components/app-shell"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `user` | `ShellUser` |  | La persona conectada: su foto (o iniciales) en el chip, su nombre y su correo dentro. Sin espacio activo, el nombre sube al chip. |
| `onLogout` | `() => void` |  | Cerrar sesión, al final del menú. Sin él, el menú no ofrece salir. |
| `companies` | `readonly Company[]` |  | Todos los espacios de la persona; alimentan el submenú de cambio. |
| `activeCompany` | `Company` |  | El espacio activo: lo que se lee en el chip y la fila que abre el cambio. `meta` es su línea descriptiva; `licenses` y `credits` son pares `[usado, total]`. |
| `onSelectCompany` | `(id: string) => void` |  | Al elegir otro espacio. La app decide qué recarga. |
| `roles` | `readonly UserRoleOption[]` |  | Los roles que se pueden asumir. Con menos de dos no hay lista que mostrar. Cada uno puede traer `icon` (un componente de icono) para reconocerlo sin leer; el shell no sabe qué roles existen en cada producto. |
| `activeRole` | `UserRoleOption` |  | El rol activo: la píldora bajo el nombre del espacio y la opción marcada de la lista. |
| `onSelectRole` | `(id: string) => void` |  | Al asumir otro rol. No es cambiar de cuenta: la sesión sigue siendo la misma. |
| `links` | `readonly string[]` | `[]` | Enlaces de administración del espacio, entre su identidad y el cambio. |
| `linkIcons` | `readonly React.ComponentType<{ className?: string }>[]` |  | Iconos opcionales para `links`, en el mismo orden. |
| `labels` | `ShellWorkspaceLabels` | `Empresa` | Cómo se lee el espacio: `entity`, `change` y `list`. |
| `showUsage` | `boolean` | `true` | Los anillos de licencias y créditos. Apagado, el menú es identidad y cambios. |

## Guías

- Sí: Deja que AppHeader lo monte con `user`, `companies`, `roles` y `workspaceLabels` de ShellConfig: así la esquina dice lo mismo en toda la aplicación.
- Sí: Mantén juntas las tres respuestas —quién, dónde y como quién—: repartidas por la cabecera obligaban a cruzar la pantalla para cambiar de contexto.
- Sí: Reacciona en `onSelectCompany` y `onSelectRole`: el menú solo mueve la marca, la navegación y los permisos son de la app.
- No: No metas aquí el tema ni el idioma: son de la plataforma, no de la cuenta, y viven en «Personalización» (menú de la marca).
- No: No añadas los ajustes del negocio: esos están en `WorkspaceMenu` y en su propia pantalla.
- No: No uses el cambio de rol como cambio de cuenta: la sesión no cambia, solo la vista.

Relacionados: app-header, company-menu, admin-shell, workspace-menu

## Ejemplos

### La cuenta y su contexto

Ábrelo: arriba la persona con su correo, después la sucursal activa con su submenú de cambio, los roles como grupo de opciones y, al final, cerrar sesión. Todo lo que se puede cambiar sobre «quién y dónde» está en esta lista y en ninguna otra.

```tsx
<AccountMenu
  user={user}
  onLogout={logout}
  companies={BRANCHES}
  activeCompany={activeBranch}
  onSelectCompany={setBranchId}
  showUsage={false}
  labels={{ entity: "Sucursal", change: "Cambiar de sucursal", list: "Tus sucursales" }}
  roles={ROLES}
  activeRole={activeRole}
  onSelectRole={setRoleId}
/>
```

### Sin rol que asumir

Con un solo rol —o con `chrome.role: false` en el shell— la segunda línea se queda en la sucursal y el menú no muestra la lista: no hay nada que elegir.

```tsx
<AccountMenu user={user} onLogout={logout} companies={BRANCHES} activeCompany={activeBranch} onSelectCompany={setBranchId} />
```

### Solo contexto

Sin `user` (p. ej. `chrome.profile: false`) la foto la sustituye la marca del espacio y el chip dice lo mismo. Sin `onLogout` no hay salida que ofrecer.

```tsx
<AccountMenu companies={BRANCHES} activeCompany={activeBranch} onSelectCompany={setBranchId} roles={ROLES} activeRole={activeRole} onSelectRole={setRoleId} />
```

### Empresas con consumo

El mismo componente en un SaaS multiempresa: `labels` se lee «Empresa», `links` trae los atajos de administración y `showUsage` enseña licencias y créditos como anillos de proporción.

```tsx
<AccountMenu
  user={user}
  onLogout={logout}
  companies={COMPANIES}
  activeCompany={activeCompany}
  onSelectCompany={setCompanyId}
  links={COMPANY_MENU_LINKS}
  roles={USER_ROLES}
  activeRole={activeRole}
  onSelectRole={setRoleId}
/>
```
