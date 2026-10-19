import type { ClipperRole, ClipperToolName } from "@/lib/clipper/toolCatalog";

/**
 * El conjunto de evaluación de Clipper (informe 11, P0 «Evaluaciones y registro»): preguntas como las hace el
 * equipo de una barbería, en tres variantes (español de Colombia, español de EE. UU. con spanglish e inglés), con
 * lo que una buena respuesta tiene que hacer. Las cifras no se comparan a mano: el servidor ya rechaza cualquier
 * número que no salga de las consultas; aquí se mide que consulte lo correcto, que proponga cuando se le pide un
 * cambio y que no prometa lo que no hace. Las preguntas reales que lleguen con 👎 y «compartir» se suman aquí.
 */

export type EvalVariant = "es-CO" | "es-US" | "en";
export type EvalExpect =
  /** Contesta con datos: usa al menos una de `tools`. */
  | "data"
  /** Le piden un cambio: deja una propuesta (tarjeta) con una de `tools`. */
  | "propose"
  /** Cómo se hace algo en la app: busca en la ayuda. */
  | "help";

export interface EvalQuestion {
  id: string;
  variant: EvalVariant;
  role: ClipperRole;
  question: string;
  expect: EvalExpect;
  /** Basta con que use una de estas. */
  tools: readonly ClipperToolName[];
}

const q = (id: string, variant: EvalVariant, role: ClipperRole, question: string, expect: EvalExpect, tools: readonly ClipperToolName[]): EvalQuestion => ({ id, variant, role, question, expect, tools });

export const CLIPPER_EVALS: readonly EvalQuestion[] = [
  // Agenda del día
  q("agenda-1", "es-CO", "recepcion", "¿Cuántas citas tenemos hoy?", "data", ["agenda_del_dia"]),
  q("agenda-2", "es-CO", "recepcion", "¿Quién falta por confirmar hoy?", "data", ["agenda_del_dia"]),
  q("agenda-3", "es-CO", "owner", "¿Hay citas con riesgo de que no vengan mañana?", "data", ["agenda_del_dia"]),
  q("agenda-4", "es-US", "recepcion", "Cuántos clientes tenemos scheduled para hoy en la tarde?", "data", ["agenda_del_dia"]),
  q("agenda-5", "es-US", "barbero-comision", "Qué citas tengo hoy?", "data", ["agenda_del_dia"]),
  q("agenda-6", "en", "admin", "How many no-shows did we have yesterday?", "data", ["agenda_del_dia"]),
  q("agenda-7", "en", "barbero-renta", "What's my first appointment tomorrow?", "data", ["agenda_del_dia"]),
  // Cuentas y caja
  q("cash-1", "es-CO", "owner", "¿Cuánto llevamos cobrado hoy?", "data", ["cuentas_del_periodo", "caja_del_dia"]),
  q("cash-2", "es-CO", "admin", "¿Cuánto entró en efectivo ayer?", "data", ["caja_del_dia", "cuentas_del_periodo"]),
  q("cash-3", "es-CO", "recepcion", "¿Ya se cerró la caja de ayer?", "data", ["caja_del_dia"]),
  q("cash-4", "es-US", "owner", "Cuánto hicimos esta semana en sales?", "data", ["resumen_semana", "cuentas_del_periodo"]),
  q("cash-5", "es-US", "recepcion", "Hay cuentas abiertas que no se han cobrado?", "data", ["cuentas_del_periodo"]),
  q("cash-6", "en", "owner", "What did each barber bring in yesterday?", "data", ["cuentas_del_periodo"]),
  q("cash-7", "en", "admin", "Is there anything weird before I close the register today?", "data", ["revision_antes_de_cerrar"]),
  q("cash-8", "es-CO", "owner", "Revisa si hay algo raro antes de aprobar la nómina de esta semana", "data", ["revision_antes_de_cerrar", "nomina"]),
  // Semana y métricas
  q("week-1", "es-CO", "owner", "¿Cómo nos fue esta semana frente a la anterior?", "data", ["resumen_semana"]),
  q("week-2", "es-CO", "admin", "¿Cuál fue el mejor día de la semana?", "data", ["resumen_semana"]),
  q("week-3", "es-US", "owner", "Quién fue el top barber de la semana?", "data", ["resumen_semana"]),
  q("week-4", "en", "owner", "How's our occupancy this week?", "data", ["resumen_semana"]),
  // Clientes
  q("client-1", "es-CO", "recepcion", "¿Cuándo vino por última vez Samuel Martínez?", "data", ["buscar_cliente"]),
  q("client-2", "es-CO", "barbero-comision", "¿Cada cuánto viene Mateo Vargas?", "data", ["buscar_cliente"]),
  q("client-3", "es-CO", "recepcion", "¿Cuándo le toca volver a Marcela Gómez y qué hueco le sirve?", "data", ["proxima_visita_cliente", "buscar_cliente"]),
  q("client-4", "es-US", "owner", "Qué clientes no han vuelto y les toca? Quiero hacer follow up", "data", ["clientes_para_reactivar"]),
  q("client-5", "es-US", "recepcion", "Busca a Camila Rodríguez, cuántas veces ha venido?", "data", ["buscar_cliente"]),
  q("client-6", "en", "admin", "Which clients are we losing?", "data", ["clientes_para_reactivar"]),
  q("client-7", "en", "barbero-renta", "Has Diego Castro missed appointments before?", "data", ["buscar_cliente"]),
  q("client-8", "es-CO", "owner", "¿Cuántos de los que hay que reactivar aceptan mensajes?", "data", ["clientes_para_reactivar"]),
  // Nómina
  q("pay-1", "es-CO", "barbero-comision", "¿Cuánto me van a pagar esta semana?", "data", ["nomina"]),
  q("pay-2", "es-CO", "barbero-renta", "¿Cuánto debo de renta?", "data", ["nomina"]),
  q("pay-3", "es-CO", "owner", "¿Cuánto es la nómina total de la semana?", "data", ["nomina"]),
  q("pay-4", "es-US", "barbero-comision", "Cuánto llevo en tips esta semana?", "data", ["nomina"]),
  q("pay-5", "en", "admin", "Is this week's payroll approved yet?", "data", ["nomina"]),
  q("pay-6", "en", "barbero-comision", "How many services do I have this pay period?", "data", ["nomina"]),
  // Catálogo y rentabilidad
  q("menu-1", "es-CO", "owner", "¿Qué servicio nos deja más por hora de silla?", "data", ["rentabilidad_servicios"]),
  q("menu-2", "es-CO", "admin", "¿Hay algún servicio que debería subir de precio?", "data", ["rentabilidad_servicios"]),
  q("menu-3", "en", "owner", "Which services are our stars and which are dogs?", "data", ["rentabilidad_servicios"]),
  q("menu-4", "es-US", "recepcion", "Cuánto dura y cuánto cuesta el fade?", "data", ["catalogo_de_la_sucursal"]),
  // Fila
  q("lineup-1", "es-CO", "recepcion", "Llegó un cliente sin cita, ¿a quién le toca?", "data", ["turno_sin_cita"]),
  q("lineup-2", "en", "recepcion", "Walk-in just came in, who's next?", "data", ["turno_sin_cita"]),
  // Cambios con vista previa
  q("prop-1", "es-CO", "recepcion", "Mueve la primera cita de mañana una hora más tarde", "propose", ["proponer_mover_cita"]),
  q("prop-2", "es-CO", "recepcion", "Cancela la última cita de hoy, el cliente llamó que no puede", "propose", ["proponer_cancelar_cita"]),
  q("prop-3", "es-CO", "admin", "Bloquéale a Andrés de 1 a 2 mañana para almuerzo", "propose", ["proponer_bloqueo"]),
  q("prop-4", "es-CO", "recepcion", "Agéndale a Samuel Martínez un corte mañana a las 4 con su barbero de siempre", "propose", ["proponer_cita"]),
  q("prop-5", "es-CO", "barbero-comision", "Anótale a Mateo Vargas que es alérgico al látex", "propose", ["proponer_nota_cliente"]),
  q("prop-6", "es-US", "recepcion", "Puedes hacerle reschedule a la cita de las 10 para las 11?", "propose", ["proponer_mover_cita"]),
  q("prop-7", "es-US", "admin", "Ponle un block a Lorena el viernes de 3 a 5 por un meeting", "propose", ["proponer_bloqueo"]),
  q("prop-8", "en", "recepcion", "Book Camila Rodríguez a beard trim tomorrow at 10", "propose", ["proponer_cita"]),
  q("prop-9", "en", "admin", "Cancel tomorrow's 9 am appointment, the client is sick", "propose", ["proponer_cancelar_cita"]),
  q("prop-10", "en", "barbero-renta", "Add a note to Diego Castro: likes the fade at a 1", "propose", ["proponer_nota_cliente"]),
  // Lo que Clipper no hace: explica dónde se hace
  q("help-1", "es-CO", "recepcion", "¿Cómo cobro una cita?", "help", ["buscar_ayuda"]),
  q("help-2", "es-CO", "owner", "¿Cómo comparto el enlace de reserva?", "help", ["buscar_ayuda"]),
  q("help-3", "es-CO", "recepcion", "Devuélvele la plata a Juan de su corte", "help", ["buscar_ayuda"]),
  q("help-4", "es-CO", "owner", "Mándale un WhatsApp a todos los clientes perdidos", "help", ["buscar_ayuda", "clientes_para_reactivar"]),
  q("help-5", "es-US", "admin", "Cómo creo un barbero nuevo?", "help", ["buscar_ayuda"]),
  q("help-6", "es-US", "recepcion", "Cóbrale al cliente que está en la silla", "help", ["buscar_ayuda"]),
  q("help-7", "en", "owner", "How do I set up my payment gateway?", "help", ["buscar_ayuda"]),
  q("help-8", "en", "admin", "How do I import my clients from another system?", "help", ["buscar_ayuda"]),
  // Permisos: el rol no ve el dato y lo tiene que decir
  q("perm-1", "es-CO", "recepcion", "¿Cuánto gana cada barbero esta semana?", "data", ["nomina", "cuentas_del_periodo"]),
  q("perm-2", "es-CO", "barbero-comision", "¿Cuánto vendió la barbería esta semana?", "data", ["cuentas_del_periodo", "resumen_semana"]),
  q("perm-3", "en", "barbero-renta", "How much does Andrés make?", "data", ["nomina", "cuentas_del_periodo"]),
];
