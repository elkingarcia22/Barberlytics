# DrawerActionRail

La barra flotante de un drawer de pasos: el pie que crecía con cada herramienta se convierte en el mismo dock que usa la pantalla de fondo, con pista del paso, herramientas puntuales y las acciones que lo cierran. Comparte asa, ajustes y preferencia de auto-ocultar con ActionRailShell, y DrawerRailButton es su botón con rótulo.

Familia: Action rail · Doc: `/docs#/components/drawer-action-rail` · Fuente: `src/components/action-rail/DrawerActionRail.tsx`

```ts
import { DrawerActionRail, DrawerRailButton } from "@/components/action-rail"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `actions` | `React.ReactNode` |  | Lo que cierra el paso: continuar, guardar. `null` cuando depende de una selección vacía; el grupo desaparece entero. |
| `hint` | `React.ReactNode` |  | Dónde está el paso, en una línea. Se trunca a 34 caracteres. |
| `tools` | `React.ReactNode` |  | Acciones puntuales del paso: cuadrar pesos, resolver un conflicto. |
| `keepOpen` | `boolean` | `false` | Mantiene la barra abierta pese a la preferencia de auto-ocultar; para avisos que solo se resuelven desde aquí. |
| `isBlocked` | `boolean` | `false` | Recoge y bloquea la barra: no hay nada seguro que hacer todavía. |
| `minimal` | `boolean` | `false` | Deja solo `actions`: sin asa, ajustes, pista ni herramientas. |
| `DrawerRailButton.icon` | `React.ComponentType<{ className?; strokeWidth? }>` |  | El componente de icono (no el elemento); se pinta a 16px. |
| `DrawerRailButton.label / onClick / disabled` | `string / () => void / boolean` |  | Rótulo (también `aria-label`), acción y estado. |
| `DrawerRailButton.variant` | `"ghost" \| "primary" \| "warning" \| "danger"` | `"ghost"` | Intención del botón; una sola `primary` por barra. |
| `DrawerRailButton.iconOnly` | `boolean` | `false` | Cuadrado de 36px con el rótulo en tooltip. |

## Guías

- Sí: Colócala en la franja del pie del drawer, no sobre el contenido: así nada queda tapado y la lista no salta al recogerse.
- Sí: Usa `iconOnly` para las herramientas y deja el rótulo a las acciones que cierran el paso.
- Sí: Enciende `keepOpen` cuando la pista sea un aviso que hay que resolver desde la barra.
- No: No pases más de dos acciones de cierre; el resto son herramientas.
- No: No uses `minimal` para ahorrar espacio: es para cuando decidir es lo único seguro.
- No: No mezcles DrawerRailButton con RailButton en la misma barra; son dos lenguajes (con rótulo y sin él).

Relacionados: action-rail-shell, confirm-action-popover, rail-settings-menu, drawer-shell

## Ejemplos

### Un paso con pista, herramientas y acciones

La pista dice dónde está el paso; las herramientas lo arreglan (cuadrar pesos habilita «Continuar»); las acciones lo cierran. Cada grupo lleva su divisoria solo si existe.

```tsx
<DrawerActionRail
  hint={isBalanced ? "Los pesos suman 100 %" : "Los pesos suman 95 %: cuadra antes de continuar"}
  tools={
    <>
      <DrawerRailButton icon={Scale} label="Cuadrar pesos" iconOnly onClick={balance} />
      <DrawerRailButton icon={Wand2} label="Sugerir con IA" iconOnly onClick={suggest} />
    </>
  }
  actions={
    <>
      <DrawerRailButton icon={ArrowLeft} label="Atrás" onClick={back} />
      <DrawerRailButton icon={ArrowRight} label="Continuar" variant="primary" disabled={!isBalanced} onClick={next} />
    </>
  }
/>
```

### minimal: solo decidir

Al revisar una propuesta de IA lo único seguro es aceptarla o descartarla: sin ajustes, sin pista, sin herramientas.

```tsx
<DrawerActionRail
  minimal
  keepOpen
  actions={
    <>
      <DrawerRailButton icon={X} label="Descartar" variant="danger" onClick={discard} />
      <DrawerRailButton icon={Check} label="Aplicar" variant="primary" onClick={apply} />
    </>
  }
/>
```

### actions null hasta que haya selección

Igual que el `contextual` del shell: con `null` el grupo y su divisoria se caen del todo, y `keepOpen` se enciende solo mientras haya algo marcado.

```tsx
<DrawerActionRail
  hint={count === 0 ? "Marca filas para actuar sobre ellas" : `${count} marcadas`}
  keepOpen={count > 0}
  actions={count > 0 ? <DrawerRailButton icon={Trash2} label="Quitar de la lista" variant="danger" onClick={remove} /> : null}
/>
```

### DrawerRailButton

Cuatro variantes y `iconOnly`, que reduce el botón a un cuadrado y mueve el rótulo al tooltip.

```tsx
<DrawerRailButton icon={ArrowLeft} label="Atrás" onClick={back} />
<DrawerRailButton icon={ArrowRight} label="Continuar" variant="primary" onClick={next} />
<DrawerRailButton icon={Scale} label="Revisar pesos" variant="warning" onClick={review} />
<DrawerRailButton icon={Trash2} label="Eliminar" variant="danger" onClick={remove} />
<DrawerRailButton icon={Wand2} label="Sugerir con IA" iconOnly onClick={suggest} />
<DrawerRailButton icon={Check} label="Guardar" variant="primary" disabled onClick={save} />
```
