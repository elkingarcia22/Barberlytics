# DataListActionRail

La barra flotante de una pantalla con lista, ya cableada: concentra todo lo que se puede hacer y cambia de contenido según lo marcado. Por debajo de 1024px se vuelve un solo botón flotante que despliega las mismas acciones hacia arriba, con la principal destacada —el reparto lo decide el mismo código, así que girar el teléfono no cambia lo que se puede hacer. Sin selección muestra las acciones de la pantalla y su primaria; con un registro esas desaparecen —no se apilan— y entran el recuento y lo que se puede hacer con él; con varios se caen las individuales y el recuento pasa a la etiqueta. Quien la usa declara las acciones y su ámbito; los modos, el escalonado de entrada y el plegado los resuelve la barra.

Familia: Action rail · Doc: `/docs#/components/data-list-action-rail` · Fuente: `src/components/action-rail/DataListActionRail.tsx`

```ts
import { DataListActionRail } from "@/components/action-rail"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `—` | `responsive` |  | No hay nada que configurar: por debajo de 1024px —el mismo corte que vuelve el sidebar un cajón— la barra se sustituye sola por `ActionFab`, el botón flotante. Se puede montar `ActionFab` a mano donde no haya barra. |
| `actions` | `RailActionSpec[]` |  | Lo que se puede hacer, declarado una vez. Cada una dice su `scope`, y la barra elige cuáles enseña. |
| `RailActionSpec.scope` | `("screen" \| "single" \| "bulk")[]` |  | `screen` sin selección; `single` solo con un registro; `bulk` con varios. Duplicar suele ser `["single", "bulk"]`. |
| `RailActionSpec.primary` | `boolean` |  | La acción rellena que cierra la fila. Solo una, y solo con `scope: ["screen"]`. |
| `RailActionSpec.overflow` | `boolean` |  | La pliega en el menú «más acciones» en vez de darle sitio en la barra. Es para lo que se configura una vez —un alta de catálogo, una regla—: sigue estando, pero no compite con lo que se hace a diario. El plegado por `inlineLimit` es otra cosa: aquel es por sitio, este es por peso. |
| `RailActionSpec.tone` | `"default" \| "danger"` | `"default"` | `danger` tiñe la acción destructiva. |
| `RailActionSpec.countInLabel` | `boolean` |  | Añade el recuento a la etiqueta con varios marcados: «Duplicar (3)». |
| `RailActionSpec.blockedReason` | `string \| null` |  | Por qué no se puede ahora. La deja a la vista y apagada, con el motivo: explicar vale más que esconder. |
| `selectedCount` | `number` |  | Cuántos registros hay marcados. Es lo único que decide el modo. |
| `onClearSelection` | `() => void` |  | La ✕ del recuento: suelta las marcas sin tocar las filas. |
| `trailing` | `ReactNode` |  | Algo propio de la pantalla justo a la derecha de la acción principal, en la barra de escritorio: el buscador del calendario, una lupa que se despliega hacia la derecha en un campo. No es una acción más: no entra en el «más» ni en el botón flotante. |
| `trailingActive` | `boolean` | `false` | Lo de `trailing` está abierto (se está escribiendo, hay una lista abierta): la barra no se recoge aunque el puntero salga. |
| `gender` | `"f" \| "m"` | `"m"` | Concordancia del recuento: «3 seleccionadas» frente a «3 seleccionados». |
| `inlineLimit` | `number` | `5` | Cuántas caben antes de plegarse al menú «más». |
| `locked` | `boolean` | `false` | Una decisión inmersiva se adueñó de una fila: la barra se desmonta en vez de ofrecer algo que no viene a cuento. |
| `isBlocked` | `boolean` | `false` | Un panel modal tomó la pantalla: la barra se recoge a su pastilla y deja de responder. Vuelve sola al cerrarlo. |

## Guías

- Sí: Deja que la selección *sustituya* las acciones de la pantalla; apilarlas obliga a leer dos grupos para encontrar uno.
- Sí: Marca como `single` lo que de verdad solo vale para un registro: abrirlo, renombrarlo, ver su detalle.
- Sí: Usa `countInLabel` en lo que actúa sobre todo lo marcado, para que se lea a cuántos va a afectar antes de pulsar.
- Sí: Si la barra manda, deja la cabecera de la pantalla sin botones: tenerlos en los dos sitios es tenerlos duplicados.
- Sí: Marca con `overflow` lo que se configura una vez y se olvida: así la barra enseña de un vistazo lo que de verdad se hace a diario.
- Sí: Prueba la pantalla estrecha: ahí las acciones pasan al botón flotante y las etiquetas se leen enteras, así que una etiqueta larga se nota antes que en la barra.
- No: No pongas más de una acción `primary`: la fila se cierra con una sola y dos compiten.
- No: No escondas una acción que no se puede usar ahora; dale `blockedReason` y explica por qué.
- No: No la montes en una pantalla sin selección ni acciones propias: ahí la barra es un marco vacío.
- No: No pliegues con `overflow` una sola acción: un menú de un ítem cuesta más de abrir que el icono que sustituye.

Relacionados: action-rail-shell, rail-button, rail-selection-chip, rail-overflow-menu, data-list-block

## Ejemplos

### Los tres modos

Marca una fila y luego otra. Al cambiar de contexto la barra vuelve a animar sus acciones: sin ese redisparo el cambio se lee como un intercambio silencioso de iconos y pasa desapercibido.

```tsx
<DataListActionRail
  actions={ACCIONES}
  selectedCount={selected.size}
  onClearSelection={clear}
/>
```

### Los tres pesos de una pantalla

Sin nada marcado las acciones no valen lo mismo, y la fila va de menor a mayor peso: abre el «⋯» con lo que se configura una vez —aquí «Reglas del ciclo», con `overflow`—, siguen las de a diario y la principal la cierra. Con la lista plana, crear y configurar compiten por la misma mirada.

```tsx
<DataListActionRail
  actions={[
    { id: "compare", label: "Comparar", icon: <GitCompare />, scope: ["screen"] },
    { id: "rules", label: "Reglas del ciclo", icon: <Settings2 />, scope: ["screen"], overflow: true },
    { id: "create", label: "Crear proceso", icon: <Plus />, scope: ["screen"], primary: true },
  ]}
  …
/>
```

### Cuando no caben

Con `inlineLimit={2}` lo que sobra se pliega en un menú «más». Si sobrara una sola acción no se plegaría: un menú de un ítem cuesta más que un icono de más.

```tsx
<DataListActionRail actions={ACCIONES} inlineLimit={2} … />
```
