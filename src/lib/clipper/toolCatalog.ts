/**
 * Las herramientas de Clipper: qué puede consultar y proponer, y quién. Las comparten el servidor
 * (`server/clipper`, que se las declara al modelo) y la app (`src/features/clipper/`, que las ejecuta con
 * la sesión de quien pregunta). Ninguna cambia nada: las de consulta leen y las de propuesta (`propose`)
 * dejan una tarjeta con el antes y el después que la persona aplica con un toque. El rol de aquí decide
 * qué se le ofrece al modelo; el permiso de verdad lo aplica cada endpoint (docs/API_CONTRACT.md).
 *
 * Sin dependencias: este archivo entra en la compilación del servidor.
 */

export type ClipperRole = "owner" | "admin" | "recepcion" | "barbero-comision" | "barbero-renta";

const ALL: readonly ClipperRole[] = ["owner", "admin", "recepcion", "barbero-comision", "barbero-renta"];
const MANAGERS: readonly ClipperRole[] = ["owner", "admin"];
const DESK: readonly ClipperRole[] = ["owner", "admin", "recepcion"];

const DATE = { type: "string", description: "Fecha AAAA-MM-DD. Si no se da, hoy." } as const;
const START = { type: "string", description: "Fecha y hora AAAA-MM-DDTHH:mm, en la hora de la sucursal." } as const;
const CLOCK = { type: "string", description: "Hora HH:mm." } as const;
const REASON = { type: "string", description: "Por qué, en pocas palabras (queda en el historial)." } as const;

export interface ClipperToolSpec {
  name: string;
  /** `propose`: no cambia nada, deja una propuesta para aplicar. Sin esto, consulta. */
  kind?: "propose";
  description: string;
  input_schema: { type: "object"; properties: Record<string, unknown>; required?: readonly string[] };
  roles: readonly ClipperRole[];
}

export const CLIPPER_TOOLS = [
  {
    name: "agenda_del_dia",
    description: "Las citas de un día en la sucursal: id, hora, cliente, barbero, servicios, estado, si confirmó y el riesgo de que no venga. Trae los conteos por estado ya hechos. Para un barbero, solo sus citas.",
    input_schema: { type: "object", properties: { fecha: DATE } },
    roles: ALL,
  },
  {
    name: "cuentas_del_periodo",
    description: "Lo facturado y cobrado entre dos fechas: totales, por cobrar, por medio de pago y por barbero, con el número de cuentas. Para un barbero, solo lo suyo.",
    input_schema: { type: "object", properties: { desde: DATE, hasta: DATE } },
    roles: ALL,
  },
  {
    name: "resumen_semana",
    description: "Los últimos 7 días de la sucursal frente a los 7 anteriores: ventas, servicios, ocupación, inasistencias, productos, mejor barbero, mejor día y clientes en riesgo.",
    input_schema: { type: "object", properties: {} },
    roles: MANAGERS,
  },
  {
    name: "caja_del_dia",
    description: "La caja de un día: lo que entró por cada medio, el efectivo que debería haber y si ya se cerró (con la diferencia).",
    input_schema: { type: "object", properties: { fecha: DATE } },
    roles: DESK,
  },
  {
    name: "buscar_cliente",
    description: "Busca clientes por nombre: visitas, última visita, cada cuántos días vuelve, segmento, barbero preferido, inasistencias y lo gastado. Hasta 5 resultados, con su id.",
    input_schema: { type: "object", properties: { nombre: { type: "string", description: "Nombre o parte del nombre." } }, required: ["nombre"] },
    roles: ALL,
  },
  {
    name: "proxima_visita_cliente",
    description: "Cuándo le toca volver a un cliente según su ritmo y los primeros huecos libres que le sirven. Pide el id que devuelve buscar_cliente.",
    input_schema: { type: "object", properties: { clienteId: { type: "string" } }, required: ["clienteId"] },
    roles: ALL,
  },
  {
    name: "clientes_para_reactivar",
    description: "Clientes a los que ya les tocaba volver o se están perdiendo: días desde la última visita, si aceptan mensajes y un hueco para ofrecerles.",
    input_schema: { type: "object", properties: {} },
    roles: MANAGERS,
  },
  {
    name: "nomina",
    description: "La nómina de un periodo por barbero: servicios, comisiones, propinas, salario, renta, ajustes y neto, y si el periodo está abierto, aprobado o pagado. Para un barbero, solo la suya.",
    input_schema: { type: "object", properties: { desde: DATE, hasta: DATE } },
    roles: ["owner", "admin", "barbero-comision", "barbero-renta"],
  },
  {
    name: "rentabilidad_servicios",
    description: "Qué deja cada servicio por hora de silla (precio menos insumos y comisión) y su cuadrante: estrella, caballo de tiro, enigma o perro.",
    input_schema: { type: "object", properties: { dias: { type: "number", description: "Días hacia atrás, de 7 a 180. Por defecto 90." } } },
    roles: MANAGERS,
  },
  {
    name: "turno_sin_cita",
    description: "A quién le toca el próximo cliente sin cita (walk-in) y quién está libre ahora.",
    input_schema: { type: "object", properties: {} },
    roles: DESK,
  },
  {
    name: "revision_antes_de_cerrar",
    description: "Lo raro antes de aprobar la nómina o cerrar la caja: dobles cobros, devoluciones grandes, clientes sin cobrar, ajustes repetidos, netos fuera de lo normal.",
    input_schema: { type: "object", properties: { que: { type: "string", enum: ["caja", "nomina"] }, desde: DATE, hasta: DATE }, required: ["que"] },
    roles: DESK,
  },
  {
    name: "catalogo_de_la_sucursal",
    description: "Los barberos (id, nombre) y los servicios (id, nombre, minutos, precio) de la sucursal: lo que hace falta para proponer una cita o un bloqueo.",
    input_schema: { type: "object", properties: {} },
    roles: ALL,
  },
  {
    name: "proponer_mover_cita",
    kind: "propose",
    description: "Propone mover una cita a otra hora o a otro barbero. No cambia nada: deja una tarjeta con el antes y el después y avisa si choca. Pide el id y el día de la cita (de agenda_del_dia).",
    input_schema: { type: "object", properties: { citaId: { type: "string" }, fechaActual: DATE, inicio: START, barberoId: { type: "string", description: "Solo si cambia de barbero." }, motivo: REASON }, required: ["citaId", "fechaActual", "inicio"] },
    roles: DESK,
  },
  {
    name: "proponer_cita",
    kind: "propose",
    description: "Propone una cita nueva. No la crea: deja una tarjeta para aplicar y avisa si choca. Ids de buscar_cliente y catalogo_de_la_sucursal.",
    input_schema: { type: "object", properties: { clienteId: { type: "string" }, barberoId: { type: "string" }, servicioIds: { type: "array", items: { type: "string" } }, inicio: START, notas: { type: "string" } }, required: ["clienteId", "barberoId", "servicioIds", "inicio"] },
    roles: DESK,
  },
  {
    name: "proponer_cancelar_cita",
    kind: "propose",
    description: "Propone cancelar una cita que aún no se cobró. No la cancela: deja una tarjeta para aplicar.",
    input_schema: { type: "object", properties: { citaId: { type: "string" }, fechaActual: DATE, motivo: REASON }, required: ["citaId", "fechaActual"] },
    roles: DESK,
  },
  {
    name: "proponer_bloqueo",
    kind: "propose",
    description: "Propone bloquear un rato en la agenda de un barbero (almuerzo, reunión, cita médica…). No lo crea: deja una tarjeta y avisa si hay citas en ese rato.",
    input_schema: { type: "object", properties: { barberoId: { type: "string" }, fecha: DATE, desde: CLOCK, hasta: CLOCK, tipo: { type: "string", enum: ["lunch", "meeting", "personal", "sick", "vacation", "business", "holiday"] }, motivo: REASON }, required: ["barberoId", "fecha", "desde", "hasta", "tipo"] },
    roles: DESK,
  },
  {
    name: "proponer_nota_cliente",
    kind: "propose",
    description: "Propone anotar algo en la ficha de un cliente: una nota, una alergia o un medicamento. No la guarda: deja una tarjeta para aplicar.",
    input_schema: { type: "object", properties: { clienteId: { type: "string" }, texto: { type: "string" }, tipo: { type: "string", enum: ["note", "allergy", "medication"] } }, required: ["clienteId", "texto", "tipo"] },
    roles: ALL,
  },
  {
    name: "buscar_ayuda",
    description: "Busca en el centro de ayuda cómo se hace algo en la app (crear una cita, cobrar, configurar). Devuelve los artículos con su enlace.",
    input_schema: { type: "object", properties: { pregunta: { type: "string" } }, required: ["pregunta"] },
    roles: ALL,
  },
] as const satisfies readonly ClipperToolSpec[];

export type ClipperToolName = (typeof CLIPPER_TOOLS)[number]["name"];

export const isClipperRole = (value: unknown): value is ClipperRole => typeof value === "string" && (ALL as readonly string[]).includes(value);

/** Las herramientas que se le ofrecen al modelo para un rol. */
export const toolsFor = (role: ClipperRole): readonly ClipperToolSpec[] => CLIPPER_TOOLS.filter((tool) => (tool.roles as readonly ClipperRole[]).includes(role));
