# TabsNav

Una fila de píldoras para cambiar de vista: la activa se rellena en primario y las demás quedan en texto apagado. Es la versión más ligera de tabs del sistema, sin track ni animación, pensada para filtros y periodos.

Familia: Navegación · Doc: `/docs#/components/tabs-nav` · Fuente: `src/components/navigation/TabsNav.tsx`

```ts
import { TabsNav } from "@/components/navigation"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `tabs` | `Tab[]` |  | Lista de `{ id, label }`. |
| `activeTabId` | `string` |  | Id de la pestaña activa (controlado). |
| `onTabChange` | `(id: string) => void` |  | Se llama con el id de la pestaña pulsada. |
| `className` | `string` |  | Clases para el contenedor; trae `w-full bg-surface px-8 py-3`. |
| `...props` | `React.HTMLAttributes<HTMLDivElement>` |  | Cualquier atributo nativo del contenedor. |

## Guías

- Sí: Úsalo para filtros y periodos donde el cambio es inmediato y sin carga.
- Sí: Limita el grupo a cinco píldoras; más allá, pasa a `ThemaTabs` o a un select.
- No: No lo uses como navegación principal de página: para eso está `ThemaTabs` en variante `page`.
- No: No mezcles iconos: el componente solo pinta la etiqueta.

Relacionados: thema-tabs, tabs, segmented-control

## Ejemplos

### Cabecera de un panel

La barra a todo el ancho, con el contenido que cambia debajo.

```tsx
const [active, setActive] = React.useState("overview");

<TabsNav tabs={tabs} activeTabId={active} onTabChange={setActive} className="border-b border-border/60" />
<div className="p-6">{content[active]}</div>
```

### Selector compacto

Con `w-auto` y un borde redondeado se convierte en un segmented control para filtros.

```tsx
<TabsNav
  tabs={periods}
  activeTabId={active}
  onTabChange={setActive}
  className="w-auto rounded-full border border-border/60 px-2 py-1.5"
/>
```
