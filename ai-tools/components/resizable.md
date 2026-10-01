# Resizable

Paneles que se reparten el ancho o el alto de un grupo y se redimensionan arrastrando el asa que los separa. Sin dependencias: el reparto vive como porcentajes en el grupo y cada panel lo recibe como `flex-basis`.

Familia: Layout y shell · Doc: `/docs#/components/resizable` · Fuente: `src/components/layout/Resizable.tsx`

```ts
import { ResizableGroup, ResizablePanel, ResizableHandle } from "@/components/layout/Resizable"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `ResizableGroup — direction` | `"horizontal" \| "vertical"` | `"horizontal"` | Eje del reparto. Horizontal pone los paneles en fila; vertical, en columna. |
| `ResizableGroup — onLayout` | `(sizes: number[]) => void` |  | Se llama con el reparto completo (porcentajes que suman 100) en cada cambio, incluido el arrastre en curso. |
| `ResizableGroup — storageKey` | `string` |  | Clave de `localStorage` donde se recuerda el reparto entre visitas. Se guarda al soltar el asa, no en cada frame. |
| `ResizableGroup — ...props` | `React.HTMLAttributes<"div">` |  | Atributos nativos del contenedor del grupo. |
| `ResizablePanel — defaultSize` | `number` |  | Porcentaje inicial del grupo. Sin él, el panel se reparte a partes iguales lo que sobre entre los paneles sin tamaño declarado. |
| `ResizablePanel — minSize` | `number` |  | Porcentaje mínimo. También topa al panel vecino al arrastrar el asa que comparten. |
| `ResizablePanel — maxSize` | `number` |  | Porcentaje máximo del panel. |
| `ResizablePanel — collapsible` | `boolean` | `false` | Deja que el panel se pliegue a 0 al arrastrarlo por debajo de la mitad de `minSize`. |
| `ResizablePanel — ...props` | `React.HTMLAttributes<"div">` |  | Atributos nativos del panel (`min-h-0 min-w-0 overflow-auto` ya vienen incluidos para que el contenido no le impida encogerse). |
| `ResizableHandle — withGrip` | `boolean` | `false` | Dibuja el tirador central, para que se vea que el borde se puede arrastrar. |
| `ResizableHandle — ...props` | `React.HTMLAttributes<"div">` |  | Atributos nativos del asa. Es un `role="separator"` enfocable: el grupo le inyecta los `aria-value*`, `aria-orientation` y los manejadores de puntero y teclado. |

## Guías

- Sí: Fija un `minSize` en cada panel para que ninguno desaparezca por accidente al arrastrar.
- Sí: Dale al `ResizableGroup` una altura explícita (`h-full` sobre un contenedor con alto definido); los porcentajes se calculan contra ella.
- Sí: Usa `storageKey` cuando el reparto tenga sentido recordarlo entre sesiones, como un panel lateral de la app.
- No: No lo uses para layouts que no necesitan ajuste manual: un `grid` fijo es más simple y más predecible.
- No: No pongas contenido crítico solo en un panel `collapsible` sin una forma de volver a abrirlo (doble clic en el asa o un botón externo).
- No: No anides más de dos niveles de `ResizableGroup`; la pista deja de ser legible con tantas asas.

Relacionados: page-shell, admin-shell, scroll-area, table-shell

## Ejemplos

### Maestro-detalle de candidatos

El caso base: una lista angosta a la izquierda y la ficha a la derecha. `minSize` en ambos paneles evita que uno aplaste al otro.

```tsx
<ResizableGroup direction="horizontal" className="h-full rounded-xl border border-border">
  <ResizablePanel defaultSize={30} minSize={15} maxSize={70}>
    <CandidateList />
  </ResizablePanel>
  <ResizableHandle />
  <ResizablePanel defaultSize={70} minSize={20}>
    <CandidateDetail />
  </ResizablePanel>
</ResizableGroup>
```

### Editor de contenido con vista previa

`direction="vertical"` apila el editor sobre la vista previa; el tirador (`withGrip`) deja claro que el borde se puede arrastrar.

```tsx
<ResizableGroup direction="vertical" className="h-full rounded-xl border border-border">
  <ResizablePanel defaultSize={55} minSize={20}>
    <Editor />
  </ResizablePanel>
  <ResizableHandle withGrip />
  <ResizablePanel defaultSize={45} minSize={20}>
    <Preview />
  </ResizablePanel>
</ResizableGroup>
```

### Panel plegable

Con `collapsible` el panel se pliega a 0 al arrastrarlo por debajo de la mitad de su `minSize`; el doble clic en el asa restablece el reparto por defecto.

```tsx
<ResizableGroup direction="horizontal" className="h-full rounded-xl border border-border">
  <ResizablePanel defaultSize={22} minSize={15} collapsible>
    <CandidateList />
  </ResizablePanel>
  <ResizableHandle withGrip />
  <ResizablePanel defaultSize={78} minSize={30}>
    <CandidateDetail />
  </ResizablePanel>
</ResizableGroup>
```
