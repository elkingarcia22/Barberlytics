# Component Coverage Audit · Fase 7B.1

## Inventario de Componentes Actuales

| Carpeta | Componente | Origen | Estado QA | Uso Principal |
|---|---|---|---|---|
| **ui** | Button | shadcn wrapper | ✅ Aprobado | Acciones principales/secundarias. |
| **ui** | Input | shadcn directo | ✅ Aprobado | Entradas de texto simples. |
| **ui** | Textarea | shadcn directo | ✅ Aprobado | Entradas de texto multilínea. |
| **ui** | Select | shadcn directo | ✅ Aprobado | Selección simple nativa. |
| **ui** | Badge | shadcn directo | ✅ Aprobado | Etiquetas de estado/categoría. |
| **ui** | Card | shadcn directo | ✅ Aprobado | Contenedores de contenido. |
| **ui** | Table | shadcn directo | ✅ Aprobado | Visualización de datos tabular. |
| **ui** | Command | shadcn directo | ✅ Aprobado | Dependencia técnica de Selects avanzados. |
| **ui** | Popover | shadcn directo | ✅ Aprobado | Dependencia técnica de Selects avanzados. |
| **ui** | Dialog | shadcn directo | ✅ Aprobado | Dependencia técnica. |
| **ui** | InputGroup | Propio Thema | ✅ Aprobado | Agrupador de inputs con iconos. |
| **forms** | Field | Propio Thema | ✅ Aprobado | Wrapper con Label, Description y Error. |
| **forms** | FormSection | Propio Thema | ✅ Aprobado | Agrupador visual de campos. |
| **forms** | SearchableSelect| Propio Thema | ✅ Aprobado | Combobox con búsqueda interna. |
| **forms** | MultiSelect | Propio Thema | ✅ Aprobado | Selección múltiple con tags. |
| **data-display**| StatusBadge | Propio Thema | ✅ Aprobado | Badge semántico para estados (Activo, etc). |
| **data-display**| TableShell | Propio Thema | ✅ Aprobado | Contenedor estructural para tablas. |
| **feedback** | EmptyState | Propio Thema | ✅ Aprobado | Placeholder visual para falta de datos. |
| **filters** | FilterBar | Propio Thema | ✅ Aprobado | Infraestructura de filtrado de datos. |
| **layout** | AppShell | Propio Thema | ✅ Aprobado | Layout principal de la aplicación. |
| **layout** | Header | Propio Thema | ✅ Aprobado | Cabecera global. |
| **layout** | PageShell | Propio Thema | ✅ Aprobado | Contenedor de página con ScrollArea. |
| **layout** | AppSidebar | Propio Thema | ✅ Aprobado | Navegación lateral del shell de administración. |
| **navigation** | Breadcrumbs | Propio Thema | ✅ Aprobado | Navegación jerárquica. |
| **navigation** | TabsNav | Propio Thema | ✅ Aprobado | Navegación por pestañas. |
| **ai** | AIInsightCard | Propio Thema | ✅ Aprobado | Visualización de hallazgos IA. |
| **ai** | AIPanel | Propio Thema | ✅ Aprobado | Contenedor semántico para capas IA. |

---

## Auditoría de Componentes Faltantes

| Componente | Tipo | Prioridad | Estrategia Recomendada | Riesgo |
|---|---|---|---|---|
| **Alert** | Feedback | Crítico | shadcn adaptado | Bajo |
| **Dropdown Menu** | Navigation | Crítico | shadcn directo | Medio (densidad) |
| **Tooltip** | Overlay | Crítico | shadcn directo | Bajo |
| **Checkbox** | Form | Crítico | shadcn directo | Bajo |
| **Radio Group** | Form | Crítico | shadcn directo | Bajo |
| **Switch** | Form | Crítico | shadcn directo | Bajo |
| **Skeleton** | Loading | Crítico | shadcn directo | Bajo |
| **Sonner (Toast)** | Feedback | Crítico | shadcn directo | Medio (z-index) |
| **Dialog (Modal)** | Overlay | Crítico | shadcn wrapper (ModalShell) | Medio |
| **Sheet (Drawer)** | Overlay | Crítico | shadcn wrapper (DrawerShell)| Medio |
| **Avatar** | Identity | Importante | shadcn directo | Bajo |
| **Separator** | Utility | Importante | shadcn directo | Bajo |
| **Scroll Area** | Utility | Importante | shadcn directo | Bajo |
| **Pagination** | Navigation | Importante | shadcn wrapper (PaginationShell)| Medio |
| **Progress** | Feedback | Importante | shadcn directo | Bajo |
| **Accordion** | Content | Opcional | shadcn directo | Bajo |
| **Tabs** | Navigation | Opcional | shadcn directo (internal) | Bajo |
| **Slider** | Form | Opcional | shadcn directo | Bajo |
| **Toggle Group** | Form | Opcional | shadcn directo | Bajo |
| **FileUpload** | Form | Futuro | Propio Thema | Alto |
| **UploadZone** | Form | Futuro | Propio Thema | Alto |

## Resumen de Brechas
1. **Overlays:** Falta estandarizar el uso de Modales y Drawers como contenedores de alto nivel (Shells).
2. **Controles de Formulario:** Faltan las opciones binarias (Checkbox, Switch, Radio).
3. **Feedback Dinámico:** Falta sistema de notificaciones (Sonner) y estados de carga parcial (Skeleton).
4. **Contexto:** Falta Tooltip para accesibilidad e información densa.
