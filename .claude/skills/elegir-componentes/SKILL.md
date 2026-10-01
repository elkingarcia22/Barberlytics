---
name: elegir-componentes
description: Antes de maquetar cualquier pantalla o pieza de interfaz en este repo, busca en el catálogo del sistema qué componente resuelve cada cosa y abre su ficha. Se activa sola al pedir una pantalla, una tabla, un formulario, un drawer, un modal o "algo con IA". Obligatoria.
---

# Elegir componentes

1. Lee `ai-tools/CATALOG.md`: es el índice, una línea por componente con su `[id]` y su import.
   No leas `ai-tools/catalog.json` entero (es el mismo contenido para scripts). Si `npm run check`
   dice que el catálogo está viejo, `npm run catalog`.
2. Para cada cosa que se ve en el pedido, anota la pieza y su import. Guía rápida:
   - Página: `PageShell` (+ `maxWidth`) y `PageHeader`. Título/texto: `Heading`, `Text`.
   - Lista de registros con filtros, orden, selección, acciones: `TableShell` + `TableHeaderControls`
     + `table-config` + `FilterBar` + `ActionRailShell`. Tabla estática dentro de una ficha: `Table`.
   - Crear/editar/ver detalle sin salir de la lista: `DrawerShell`. Decisión corta: `ModalShell`.
     Irreversible: `ConfirmDialog`. Algo que ya pasó: `toast` (sonner, montado por `ThemaToaster`).
   - Campo de formulario: siempre `Field` + `Input|Textarea|Select|SearchableSelect|MultiSelect|Switch|RadioGroup`.
     Bloques: `FormSection`. Pasos: `Stepper`.
   - Vacío / carga / error: `EmptyState`, `Skeleton`, `Spinner`, `ErrorState` (vía `QueryBoundary`).
   - Estado de un registro: `StatusBadge`. Etiqueta: `Badge`. Atajo: `Kbd`.
   - Fechas: `DatePicker`, `DateRangePicker`, `DateFilterBar`, `PeriodSelector`.
   - Gráficas: `charts/*` (ECharts con tema). Historial: `Timeline`. Fila con avatar y acciones: `ListItem`.
   - IA: `AIButton`, `AiGeneratedBadge`, `AILoader`, `AiAnalyzingState`, `AIInsightCard`, `AiAgentDrawer`.
   - Iconos: `<ThemaIcon name="…" />` con los nombres de `src/icons/iconRegistry.ts`.
3. Abre la ficha de cada pieza que vayas a usar, `ai-tools/components/<id>.md`: props, guías y
   ejemplos reales. Solo esas, no las demás. Copia la composición del ejemplo más parecido.
4. Si nada encaja, dilo antes de inventar: propón crear el componente (ver `documentar-componente`).
