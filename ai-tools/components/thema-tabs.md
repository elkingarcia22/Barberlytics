# ThemaTabs

Las dos únicas tiras de pestañas de la app, sobre el primitivo `ui/tabs`: `view` cambia un panel dentro de la página con un track hundido, `page` cambia la pantalla entera con la píldora rellena. Cada pestaña admite icono y un contador con tono.

Familia: Navegación · Doc: `/docs#/components/thema-tabs` · Fuente: `src/components/navigation/ThemaTabs.tsx`

```ts
import { ThemaTabs } from "@/components/navigation"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `tabs` | `TabItem[]` |  | Pestañas: `id`, `label` y opcionalmente `icon`, `badge` (número, oculto si es 0) y `badgeTone`. |
| `activeTabId` | `string` |  | Id de la pestaña activa (controlado). |
| `onTabChange` | `(id: string) => void` |  | Se llama al cambiar de pestaña. |
| `variant` | `"view" \| "page"` | `"view"` | `view` para paneles dentro de la página; `page` para cambiar la pantalla entera. |
| `fitContent` | `boolean` | `false` | Ajusta la tira a sus etiquetas en vez de repartir el ancho. |
| `className` | `string` |  | Clases para el <Tabs>; trae `mb-8 w-full`. |

## Guías

- Sí: Una sola tira `page` por pantalla, arriba del todo.
- Sí: Usa `fitContent` con dos o tres pestañas; con cinco o seis deja que repartan el ancho.
- Sí: Da `badgeTone` a los contadores solo cuando la pestaña es un estado.
- No: No anides una tira `page` dentro de un panel `view`.
- No: No pongas un contador en cero: el componente lo oculta, pero mejor no lo mandes.

Relacionados: tabs, tabs-nav, badge

## Ejemplos

### Variante view

Pestañas de panel: track hundido y superficie elevada sobre la activa. Ocupa todo el ancho.

```tsx
const [active, setActive] = React.useState("summary");

<ThemaTabs
  tabs={[{ id: "summary", label: "Resumen" }, { id: "detail", label: "Detalle" }, { id: "history", label: "Historial" }]}
  activeTabId={active}
  onTabChange={setActive}
/>
```

### Variante page

Para cambiar lo que muestra toda la pantalla: píldora primaria rellena. Con dos pestañas conviene `fitContent`.

```tsx
<ThemaTabs
  variant="page"
  fitContent
  tabs={[
    { id: "dashboard", label: "Dashboard", icon: <BarChart3 className="size-4" /> },
    { id: "reports", label: "Reportes", icon: <FileText className="size-4" /> },
  ]}
  activeTabId={active}
  onTabChange={setActive}
/>
```

### Contadores con tono

Cuando las pestañas son estados, cada contador lleva el tono de su estado. Sin `badgeTone` el contador es sólido en primario.

```tsx
<ThemaTabs
  tabs={[
    { id: "pending", label: "Pendientes", icon: <Clock />, badge: 12, badgeTone: "warning" },
    { id: "approved", label: "Aprobadas", icon: <CheckCircle2 />, badge: 48, badgeTone: "positive" },
    { id: "rejected", label: "Rechazadas", icon: <XCircle />, badge: 3, badgeTone: "negative" },
  ]}
  activeTabId={active}
  onTabChange={setActive}
/>
```
