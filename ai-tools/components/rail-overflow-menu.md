# RailOverflowMenu

Las acciones que no cupieron en la barra, detrás de un solo «⋯». Conservan el orden que tenían en la lista completa, llevan el rótulo escrito y pueden desplegar sub-opciones cuando una acción tiene más de una respuesta.

Familia: Action rail · Doc: `/docs#/components/rail-overflow-menu` · Fuente: `src/components/action-rail/RailOverflowMenu.tsx`

```ts
import { RailOverflowMenu, type RailOverflowItem } from "@/components/action-rail"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `items` | `readonly RailOverflowItem[]` |  | Las acciones, en el orden de la lista completa. Con un array vacío el botón no se renderiza. |
| `label` | `string` | `"Más acciones"` | Tooltip y `aria-label` del disparador. |
| `icon` | `React.ReactNode` | `<MoreHorizontal />` | Icono del disparador, para menús que agrupan un solo tema. |
| `onOpenChange` | `(open: boolean) => void` |  | Avisa cuando el menú abre o cierra. |
| `RailOverflowItem.id / label / icon / onClick` | `string / string / ReactNode / () => void` |  | Identidad, rótulo escrito, icono de 16px y la acción de cada fila. |
| `RailOverflowItem.tone` | `"default" \| "danger"` | `"default"` | Fila en rojo para acciones destructivas. |
| `RailOverflowItem.blockedReason` | `string \| null` |  | Desactiva la fila y muestra el motivo como `title`. |
| `RailOverflowItem.subItems` | `readonly RailOverflowSubItem[]` |  | Sub-opciones; la fila abre otro popover en vez de ejecutar `onClick`. |

## Guías

- Sí: Pliega a partir de la sexta acción: cinco iconos aún se reconocen de un vistazo.
- Sí: Mantén el orden de la lista completa; quien busca una acción la encuentra en el mismo sitio esté o no plegada.
- Sí: Usa `subItems` cuando una acción tiene varias formas legítimas, no para anidar categorías.
- No: No escondas la acción primaria ni las destructivas más frecuentes detrás del «⋯».
- No: No reordenes por importancia al plegar: el menú es la continuación de la barra, no un ranking.
- No: No uses iconos de 20px en las filas; el tile es de 32px y espera 16px.

Relacionados: rail-button, action-rail-shell, rail-settings-menu, dropdown-menu

## Ejemplos

### Acciones plegadas

El menú se cierra al elegir y llama al `onClick` de la fila. Una fila con `blockedReason` se desactiva y explica el motivo en su `title`.

```tsx
<RailOverflowMenu
  items={[
    { id: "duplicate", label: "Duplicar", icon: <Copy />, onClick: duplicate },
    { id: "share", label: "Compartir", icon: <Share2 />, onClick: share },
    { id: "archive", label: "Archivar", icon: <Archive />, onClick: archive, blockedReason: "La encuesta sigue activa" },
    { id: "delete", label: "Eliminar", icon: <Trash2 />, onClick: remove, tone: "danger" },
  ]}
/>
```

### Sub-opciones

Con `subItems` la fila abre un segundo popover al lado en vez de ejecutar `onClick`: «Compartir» se vuelve «Copiar enlace» o «Descargar QR».

```tsx
{
  id: "share",
  label: "Compartir",
  icon: <Share2 />,
  onClick: noop,
  subItems: [
    { id: "link", label: "Copiar enlace", icon: <Link2 />, onClick: copyLink },
    { id: "qr", label: "Descargar QR", icon: <QrCode />, onClick: downloadQr },
  ],
}
```

### Icono y rótulo propios

Un menú que agrupa un solo tema se anuncia con el icono de ese tema. `label` alimenta el tooltip y el `aria-label`.

```tsx
<RailOverflowMenu
  icon={<Users />}
  label="Participantes"
  items={[
    { id: "add", label: "Añadir participantes", icon: <UserPlus />, onClick: add },
    { id: "export", label: "Exportar lista", icon: <Download />, onClick: exportList },
  ]}
/>
```

### En una barra vertical

El popover abre a la izquierda, centrado en el botón; los sub-menús también se vuelcan hacia la izquierda.

```tsx
// Dentro de una barra vertical no cambia nada en el uso:
<RailOverflowMenu items={items} />
```
