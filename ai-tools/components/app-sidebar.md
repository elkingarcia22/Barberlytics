# AppSidebar

El sidebar del AdminShell, en dos capas: un rail de iconos de 64px que está siempre y no se mueve, y un panel de 240px que se desliza por encima con la marca del producto, el segmentado Workspace / Agente IA, el árbol con acordeones y drill, una tarjeta promocional opt-in y un pie con «Novedades» —solo por debajo de `md`, donde la cabecera la suelta para dejarle su ancho al chip de la cuenta— y el feedback. Con `config.settings`, la marca es el disparador de `WorkspaceMenu` (personalización y ajustes agrupados); sin ajustes que ofrecer, es solo identidad. Plegar no encoge el panel: lo aparta y descubre el rail, así los iconos se quedan quietos y las etiquetas nunca se estrujan. Ninguna sección queda sin salida con el panel plegado: el icono de una sección con hijos despliega su árbol a la derecha, con submenú para los que tienen nietos. Dentro de una sección, una tarjeta dice dónde estás y deja saltar a un hermano sin volver atrás. Es un componente controlado: AdminShell le dice si está plegado, si el cajón móvil está abierto y en qué modo está.

Familia: Layout y shell · Doc: `/docs#/components/app-sidebar` · Fuente: `src/components/app-shell/AppSidebar.tsx`

```ts
import { AppSidebar } from "@/components/app-shell/AppSidebar"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `collapsed` | `boolean` |  | Aparta el panel de 240px y deja a la vista el rail de 64px con tooltips. |
| `mobileOpen` | `boolean` |  | Por debajo de `lg` el sidebar es un cajón fijo; esto lo muestra. |
| `mode` | `"workspace" \| "agent"` |  | Qué muestra el segmentado y el árbol: navegación o historial de chats. |
| `onModeChange` | `(mode: ShellMode) => void` |  | Al pulsar el segmentado. |
| `onToggleCollapse` | `() => void` |  | Al pulsar el botón de plegar (solo visible desde `lg`). |
| `onOpenFeedback` | `() => void` |  | Al pulsar «Feedback» en el pie. |
| `onCloseMobile` | `() => void` |  | Tras cualquier selección, para cerrar el cajón móvil. |
| `onNavigateHome` | `() => void` |  | Al aterrizar en «Objetivos», el nodo que significa «volver a la lista». |
| `config.promo` | `ShellPromo \| null` | `null` | Tarjeta promocional del sidebar en modo Workspace. Apagada por defecto: no sale sola, se enciende a propósito pasando el objeto. |

## Guías

- Sí: Deja que AdminShell lo controle; monta el sidebar suelto solo para probarlo.
- Sí: Añade secciones en NAV_TREE (appShellData.ts): con `children` es acordeón, con nietos abre un drill.
- Sí: Cierra el cajón móvil en `onCloseMobile` después de navegar.
- Sí: Enciende `config.promo` solo cuando la pantalla tenga algo real que anunciar; apagada es el estado por defecto.
- No: No guardes `collapsed` dentro del sidebar: el header móvil también lo alterna.
- No: No pongas más de dos niveles bajo un acordeón; el drill existe para el tercero.

Relacionados: admin-shell, app-header

## Ejemplos

### Acordeones y drill

«Desempeño» se abre en el sitio; «Aprendizaje» tiene hijos con nietos y cada uno abre un panel con botón de volver. Plegado, el nodo activo se señala en el icono de su módulo y los rótulos pasan a tooltips.

```tsx
<AppSidebar
  collapsed={collapsed}
  mobileOpen={mobileOpen}
  mode="workspace"
  onModeChange={setMode}
  onToggleCollapse={toggle}
  onCloseMobile={() => setMobileOpen(false)}
  onOpenFeedback={openFeedback}
  onNavigateHome={goHome}
/>
```

### Modo Agente IA

Con `mode="agent"` el árbol se sustituye por el historial de chats y la tarjeta promocional desaparece. El segmentado desliza su fondo con el degradado de IA.

```tsx
<AppSidebar mode="agent" onModeChange={setMode} … />
```

### Plegado

El panel se aparta y queda el rail: los iconos de cada sección con su etiqueta en tooltip, el conmutador de modo apilado y los grupos convertidos en separadores. Una sección con hijos no cabe en 64px, así que su icono abre el árbol a la derecha, con submenú para los subniveles. Cualquier pliegue borra el drill.

```tsx
<AppSidebar collapsed onToggleCollapse={toggle} … />
```

### Tarjeta destacada

Apagada por defecto: no sale sola. La enciende una pantalla a propósito pasando `config.promo`, y solo se ve en modo Workspace con el panel desplegado.

```tsx
<ShellConfigContext.Provider
  value={resolveShellConfig({
    promo: {
      title: "El LMS que trabaja por ti",
      description: "Conoce nuestro nuevo sistema inteligente para crear contenido.",
      cta: "Conocer más",
    },
  })}
>
  <AppSidebar collapsed={false} mobileOpen={false} mode="workspace" onModeChange={setMode} onToggleCollapse={toggle} onOpenFeedback={openFeedback} />
</ShellConfigContext.Provider>
```
