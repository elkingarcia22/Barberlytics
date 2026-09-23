/**
 * El diccionario fuente. Cada clave nace aquí, en español, y de aquí sale el
 * tipo `MessageKey`: una clave que no esté en este archivo no compila en
 * ningún `t()`, y una traducción que sobre en otro idioma tampoco.
 *
 * Convenciones:
 * - Clave con puntos, de lo general a lo concreto: `familia.pieza.cosa`.
 * - `{parametro}` para interpolar: `t("table.selected", { count: 3 })`.
 * - Sufijo `_plural` para el plural: se usa solo cuando `count !== 1`.
 */
export const es = {
  // ── Acciones y palabras que se repiten en toda la interfaz ──
  "common.cancel": "Cancelar",
  "common.confirm": "Confirmar",
  "common.save": "Guardar",
  "common.delete": "Eliminar",
  "common.edit": "Editar",
  "common.close": "Cerrar",
  "common.back": "Volver",
  "common.next": "Siguiente",
  "common.previous": "Anterior",
  "common.search": "Buscar",
  "common.clear": "Limpiar",
  "common.apply": "Aplicar",
  "common.retry": "Reintentar",
  "common.seeAll": "Ver todo",
  "common.loading": "Cargando",
  "common.of": "de",
  "common.required": "Obligatorio",
  "common.optional": "Opcional",

  // ── Estados de una pantalla o de una consulta ──
  "state.empty.title": "No hay nada por aquí todavía",
  "state.empty.description": "Cuando haya datos, aparecerán en esta lista.",
  "state.error.title": "Algo salió mal",
  "state.error.description": "No pudimos cargar esta información. Inténtalo de nuevo.",
  "state.noResults.title": "Sin resultados",
  "state.noResults.description": "Prueba con otra búsqueda o quita algún filtro.",

  // ── Tablas y listas ──
  "table.empty": "No hay datos para mostrar",
  "table.loading": "Cargando datos",
  "table.selected": "{count} seleccionado",
  "table.selected_plural": "{count} seleccionados",
  "table.selectAll": "Seleccionar todo",
  "table.selectPage": "Seleccionar la página",
  "table.selectRow": "Seleccionar fila",
  "table.configure": "Configurar la tabla",
  "table.columns": "Columnas",
  "table.density": "Densidad",
  "table.rowsPerPage": "Filas por página",

  // ── Paginación ──
  "pagination.label": "Paginación",
  "pagination.previous": "Anterior",
  "pagination.next": "Siguiente",
  "pagination.page": "Página {page} de {total}",
  "pagination.showing": "Mostrando {from} - {to} de {total} resultados",
  "pagination.morePages": "Más páginas",

  // ── Fechas ──
  "date.pick": "Elegir fecha",
  "date.pickRange": "Elegir rango de fechas",
  "date.select": "Selecciona fecha",
  "date.selectRange": "Selecciona un rango",
  "date.start": "Fecha de inicio",
  "date.end": "Fecha de cierre",
  "date.selectStart": "Selecciona fecha de inicio",
  "date.selectEnd": "Selecciona fecha de cierre",
  "date.undefined": "Sin definir",
  "date.today": "Hoy",
  "date.clear": "Limpiar fechas",
  "date.previousPeriod": "Periodo anterior",
  "date.nextPeriod": "Periodo siguiente",
  "date.changeView": "Cambiar de vista",
  "date.calendar": "Calendario de eventos",
  "date.monthCalendar": "Calendario mensual de eventos",
  "date.nothingScheduled": "No hay nada agendado",
  "date.viewMonth": "Mes",
  "date.viewWeek": "Semana",
  "date.viewDay": "Día",

  // ── Archivos ──
  "upload.dropzone": "Arrastra un archivo o haz clic para elegirlo",
  "upload.browse": "Buscar en tu equipo",
  "upload.noFiles": "Sin archivos seleccionados",
  "upload.noFilesHint": "Los archivos que selecciones aparecerán aquí.",
  "upload.noPreview": "Sin previsualización",
  "upload.remove": "Quitar archivo",

  // ── El marco de la aplicación ──
  "shell.search": "Buscar o preguntar",
  "shell.menu": "Menú",
  "shell.expandMenu": "Expandir menú",
  "shell.collapseMenu": "Contraer menú",
  "shell.profile": "Perfil",
  "shell.notifications": "Notificaciones",
  "shell.news": "Novedades",
  "shell.help": "Ayuda",
  "shell.logout": "Cerrar sesión",
  "shell.feedback": "Enviar feedback",
  "shell.theme": "Tema",
  "shell.lightMode": "Modo claro",
  "shell.darkMode": "Modo oscuro",
  "shell.changeRole": "Cambiar de rol",
  "shell.viewAs": "Ver la plataforma como",
  "shell.activeRole": "Rol activo",
  "shell.role": "Rol",
  "shell.settings": "Configuración",
  "shell.allSettings": "Ver toda la configuración",
  "shell.terms": "Términos y condiciones de uso de la plataforma",
  "shell.privacy": "Política de privacidad",
  "shell.personalization": "Personalización",

  // ── El selector de idioma ──
  "language.label": "Idioma",
  "language.change": "Cambiar de idioma",
  "language.description": "El idioma se aplica a toda la interfaz y se recuerda en este navegador.",

  // ── La documentación del sistema ──
  "docs.playground": "Playground",
  "docs.controls": "Controles",
  "docs.examples": "Ejemplos",
  "docs.props": "Props",
  "docs.guidelines": "Cuándo usarlo",
  "docs.do": "Sí",
  "docs.dont": "No",
  "docs.related": "Relacionados",
  "docs.copy": "Copiar",
  "docs.copied": "Copiado",
  "docs.viewCode": "Ver código",
  "docs.hideCode": "Ocultar código",
  "docs.source": "Código fuente",
  "docs.components": "Componentes",
  "docs.foundations": "Fundamentos",
  "docs.guides": "Guías",
  "docs.overview": "Resumen",
  "docs.home": "Inicio",
  "docs.searchPlaceholder": "Busca un componente o un fundamento",
  "docs.searchTrigger": "Buscar en el sistema…",
  "docs.openApp": "Aplicación",
  "docs.openAppTitle": "Abrir la aplicación de ejemplo: Inicio y Personas",
} as const;
