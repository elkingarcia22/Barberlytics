/**
 * El contrato que comparten todas las tablas de la aplicación.
 *
 * Una tabla declara sus columnas una sola vez —`TableColumnSpec[]`— y a partir
 * de ahí el encabezado, las celdas y el panel de configuración salen de la
 * misma lista. Antes cada tabla repetía el orden tres veces (los `<th>`, los
 * `<td>` y cualquier menú de columnas), y esa repetición es justo lo que hace
 * imposible mover una columna sin romper otra.
 */

/** Cómo se sirven las filas: de corrido o página por página. */
export type TableRowsMode = "lazy" | "paged";

/**
 * Cómo se leen los registros.
 *
 * `table` es la rejilla completa: muchas columnas comparables de un vistazo.
 * `list` deja una fila por registro con lo que lo identifica y su estado —el
 * nombre, el dato que importa y la acción—, que es como se lee bien en una
 * pantalla estrecha o cuando las columnas sobran. Es la misma lista y la
 * misma selección: solo cambia cómo se dibuja.
 */
export type TableView = "table" | "list";

/**
 * "Lazy" por defecto en toda la aplicación: bajar es más barato que buscar en
 * qué página quedó lo que se estaba leyendo. La paginación sigue estando a un
 * clic para quien necesita saber "voy en la 3 de 12".
 */
export const DEFAULT_ROWS_MODE: TableRowsMode = "lazy";

export const DEFAULT_TABLE_VIEW: TableView = "table";

/**
 * Dónde vive lo que se puede hacer en la pantalla.
 *
 * `rail` lo concentra todo en la barra flotante: las acciones de la pantalla
 * cuando no hay nada marcado, y las de los registros en cuanto se marca algo
 * —sustituyéndolas, no sumándose—. La cabecera de la pantalla queda entonces
 * sin botones, porque tenerlos en los dos sitios es tenerlos duplicados.
 *
 * `inline` los devuelve al layout: las de la pantalla a su cabecera y las de
 * lo marcado a la de la lista, que se transforma mientras hay selección. Para
 * pantallas sin barra flotante, o cuando la acción tiene que leerse pegada a
 * lo que va a modificar.
 */
export type TableActionsPlacement = "rail" | "inline";

/** El rail por defecto: es el sitio donde ya vive el resto de acciones. */
export const DEFAULT_ACTIONS_PLACEMENT: TableActionsPlacement = "rail";

/**
 * Cómo se actúa sobre un registro.
 *
 * `checkbox` es el modelo de lote: se marcan filas —con su casilla o picando
 * en la fila— y las acciones operan sobre lo marcado. `menu` quita las
 * casillas y le da a cada fila su propio botón de acciones: se actúa sobre una
 * sola, ahí mismo, sin pasar por seleccionar. Son dos modelos distintos, no dos
 * adornos: con `menu` no hay selección ni acciones en lote.
 */
export type TableRowControl = "checkbox" | "menu";

/** Las casillas por defecto: sin ellas no hay forma de actuar sobre varios. */
export const DEFAULT_ROW_CONTROL: TableRowControl = "checkbox";

export interface TableColumnSpec {
  /** Identificador estable: es lo que se guarda, así que no puede cambiar. */
  id: string;
  /** Cómo se nombra la columna en el panel de configuración. */
  label: string;
  /**
   * Una columna fija no se arrastra, ni se oculta, ni se fija —ya está puesta
   * donde tiene que estar—. Solo la de selección lo es: sin ella no hay forma
   * de marcar filas, y moverla dejaría la casilla en mitad de la tabla.
   *
   * Ojo con el nombre: "fija" aquí es *inamovible*, no es lo mismo que
   * "fijada" (`pinned`), que es quedarse quieta mientras la tabla se desplaza
   * de lado.
   */
  fixed?: boolean;
  /** Arranca oculta y se pide desde el panel. */
  hiddenByDefault?: boolean;
  /**
   * Falso cuando la columna no aplica a esta lectura —el riesgo de un ciclo
   * cerrado, por ejemplo—. Desaparece de la tabla y del panel, pero su sitio
   * en el orden se recuerda por si vuelve.
   */
  available?: boolean;
}

/** Lo que se guarda por tabla entre sesiones. */
export interface StoredTableConfig {
  order: string[];
  hidden: string[];
  /** Las que se quedan quietas a la izquierda al desplazar la tabla de lado. */
  pinned: string[];
  mode: TableRowsMode;
  view: TableView;
  actions: TableActionsPlacement;
  rowControl: TableRowControl;
}

/**
 * Una columna dicha una sola vez: su encabezado y su celda, juntos.
 *
 * Tenerlos pegados es lo que permite mover una columna sin desalinear el
 * título del dato: el orden se aplica una vez, sobre el par.
 */
export interface TableColumnCell<T> {
  head: import("react").ReactNode;
  /** Clases propias del encabezado, sobre las que la tabla ya pone. */
  headClassName?: string;
  cell: (row: T) => import("react").ReactNode;
  cellClassName?: string;
}

export type TableColumnCells<T> = Record<string, TableColumnCell<T>>;
