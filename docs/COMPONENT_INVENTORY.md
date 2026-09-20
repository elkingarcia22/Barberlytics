# Component Inventory

| Componente legacy | Categoría | Propósito | Ruta origen | Existe equivalente en shadcn | Acción recomendada | Prioridad | Riesgo |
|---|---|---|---|---|---|---|---|
| Sidebar | Layout | Navegación lateral | `components/sidebar.css` | No (Propio) | Crear Sidebar Rail propio | Alta | Bajo |
| Header | Layout | Barra superior / Perfil | `thema-colaborador/home-learn.html` | No (Shell) | Crear Shell con Navbar | Alta | Bajo |
| Primary Button | UI Base | Acción principal | `thema-colors.css` | Sí | Wrapper Thema sobre shadcn Button | Alta | Muy Bajo |
| Course Card | Data Display | Mostrar contenidos | `thema-colaborador/aprendizaje/home-learn.html` | Sí | Wrapper Thema sobre shadcn Card | Media | Bajo |
| Status Badge | Feedback | Etiquetas de estado | `thema-colors.css` | Sí | Usar shadcn Badge con variantes Thema | Media | Muy Bajo |
| AI Chat Panel | AI | Interacción con asistente | `thema-colaborador/thema-ai/thema-ai.html` | No (Propio) | Componente propio Thema | Baja | Medio |
| Data Table | Data Display | Listas de usuarios/tareas | `thema-admin/empresa/gestion-de-usuarios.html` | Sí | Usar TanStack Table + shadcn | Alta | Bajo |
| Modal / Dialog | Overlays | Ventanas emergentes | `thema-colaborador/lms-creator/portada-media-modal.html`| Sí | Usar shadcn Dialog | Media | Muy Bajo |
| Stats KPI | Data Display | Resumen de métricas | `thema-colaborador/desempeno/metricas.html` | No | Crear componente KPI Card | Media | Bajo |
| Heatmap | Charts | Visualización de riesgos | `thema-admin/desempeno/admin-matriz-talento.html` | No | Componente propio con ECharts | Baja | Medio |

## Categorías
- **UI base:** Botones, Inputs, Badges.
- **Layout:** Sidebar, Shell, Containers.
- **Navigation:** Tabs, Breadcrumbs, Menu.
- **Forms:** Inputs, Selects, Checkboxes.
- **Data Display:** Tables, Cards, Lists.
- **Feedback:** Toast, Alert, Skeleton.
- **Overlays:** Modals, Drawers, Tooltips.
- **AI:** Chat, Insights Panels.
- **Charts / Analytics:** Heatmaps, BarCharts, KPIs.
