import type { AppMessageKey } from "@/app/i18n";
import type { MessageParams } from "@/i18n";
import type { ChatAction } from "@/lib/chat";
import { calendarApi } from "@/features/calendar/api";
import type { Appointment, CalendarCatalog, CalendarDay, NoteKind } from "@/features/calendar/types";

/**
 * Las propuestas de Clipper (docs/API_CONTRACT.md, «Clipper»): mover, crear o cancelar una cita, bloquear
 * un rato y anotar en la ficha de un cliente. Proponer no cambia nada: valida, mira la agenda para avisar
 * de choques y arma la tarjeta con el antes y el después. Aplicar usa los mismos endpoints que la
 * pantalla, con Clipper y quien aprobó en el historial; deshacer devuelve lo que había.
 */

export type Translate = (key: AppMessageKey, params?: MessageParams) => string;

export interface ProposalContext {
  branchId: string;
  locale: "es" | "en";
  t: Translate;
}

type Args = Record<string, unknown>;
export type Proposer = (args: Args, context: ProposalContext, signal: AbortSignal) => Promise<ChatAction>;

const START = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const CLOCK = /^\d{2}:\d{2}$/;
const BLOCK_KINDS = ["lunch", "meeting", "personal", "sick", "vacation", "business", "holiday"] as const;
const NOTE_KINDS: readonly NoteKind[] = ["note", "allergy", "medication"];
const MOVABLE = new Set(["scheduled", "arrived"]);
const MAX_TEXT = 500;

/** Un error que el modelo lee y le cuenta a la persona. */
export class ProposalError extends Error {}

const str = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const minutesOf = (clock: string) => Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3, 5));
const clockOf = (iso: string) => iso.slice(11, 16);
const dayOf = (iso: string) => iso.slice(0, 10);
const makeId = () => `act_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

function formatStart(iso: string, locale: "es" | "en"): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-CO", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(`${iso.slice(0, 16)}:00`));
}

const nameIn = (list: readonly { id: string; name: string }[], id: string) => list.find((item) => item.id === id)?.name;

/** Las citas vivas de un barbero que se cruzan con [inicio, fin) ese día, sin contar `exceptId`. */
function clashes(day: CalendarDay, catalog: CalendarCatalog, barberId: string, from: number, to: number, exceptId?: string): string[] {
  return day.appointments
    .filter((item) => item.id !== exceptId && item.barberId === barberId && item.status !== "cancelled" && item.status !== "no_show")
    .filter((item) => {
      const start = minutesOf(clockOf(item.start));
      return start < to && start + item.durationMin > from;
    })
    .map((item) => `${clockOf(item.start)} · ${nameIn(catalog.clients, item.clientId) ?? "—"}`);
}

async function findAppointment(args: Args, context: ProposalContext, signal: AbortSignal): Promise<{ appointment: Appointment; catalog: CalendarCatalog }> {
  const id = str(args.citaId);
  const day = str(args.fechaActual);
  if (!id || !DAY.test(day)) throw new ProposalError("Falta el id o el día de la cita.");
  const [catalog, agenda] = await Promise.all([calendarApi.catalog(context.branchId, signal), calendarApi.day(context.branchId, day, signal)]);
  const appointment = agenda.appointments.find((item) => item.id === id);
  if (!appointment) throw new ProposalError("Esa cita no está en ese día.");
  return { appointment, catalog };
}

const services = (catalog: CalendarCatalog, ids: readonly string[]) => ids.map((id) => nameIn(catalog.services, id) ?? id).join(" + ");

export const PROPOSERS = {
  async proponer_mover_cita(args, context, signal) {
    const { appointment, catalog } = await findAppointment(args, context, signal);
    if (!MOVABLE.has(appointment.status)) throw new ProposalError("Solo se mueve una cita que aún no se cobró ni se canceló.");
    const start = str(args.inicio);
    if (!START.test(start)) throw new ProposalError("La nueva hora debe ser AAAA-MM-DDTHH:mm.");
    const barberId = str(args.barberoId) || appointment.barberId;
    if (!nameIn(catalog.barbers, barberId)) throw new ProposalError("Ese barbero no está en la sucursal.");
    if (start === appointment.start.slice(0, 16) && barberId === appointment.barberId) throw new ProposalError("La cita ya está ahí.");
    const target = await calendarApi.day(context.branchId, dayOf(start), signal);
    const from = minutesOf(clockOf(start));
    const clash = clashes(target, catalog, barberId, from, from + appointment.durationMin, appointment.id);
    const { t, locale } = context;
    return {
      id: makeId(),
      kind: "moveAppointment",
      title: t("clipper.action.move"),
      rows: [
        { label: t("clipper.action.client"), after: nameIn(catalog.clients, appointment.clientId) ?? "—" },
        { label: t("clipper.action.service"), after: services(catalog, appointment.serviceIds) },
        { label: t("clipper.action.when"), before: formatStart(appointment.start, locale), after: formatStart(start, locale) },
        { label: t("clipper.action.barber"), before: nameIn(catalog.barbers, appointment.barberId) ?? "—", after: nameIn(catalog.barbers, barberId) ?? "—" },
      ],
      warnings: clash.length > 0 ? [t("clipper.action.clash", { list: clash.join(", ") })] : undefined,
      payload: { appointmentId: appointment.id, start, barberId, reason: str(args.motivo).slice(0, MAX_TEXT) || undefined, previousStart: appointment.start.slice(0, 16), previousBarberId: appointment.barberId },
      status: "proposed",
      href: `/calendario?fecha=${dayOf(start)}&cita=${appointment.id}`,
    };
  },

  async proponer_cita(args, context, signal) {
    const catalog = await calendarApi.catalog(context.branchId, signal);
    const clientId = str(args.clienteId);
    const barberId = str(args.barberoId);
    const serviceIds = (Array.isArray(args.servicioIds) ? args.servicioIds : []).map(str).filter(Boolean);
    const start = str(args.inicio);
    const client = catalog.clients.find((item) => item.id === clientId);
    if (!client) throw new ProposalError("Ese cliente no está; búscalo con buscar_cliente.");
    if (!nameIn(catalog.barbers, barberId)) throw new ProposalError("Ese barbero no está en la sucursal.");
    if (serviceIds.length === 0 || serviceIds.some((id) => !nameIn(catalog.services, id))) throw new ProposalError("Algún servicio no existe; míralos en catalogo_de_la_sucursal.");
    if (!START.test(start)) throw new ProposalError("La hora debe ser AAAA-MM-DDTHH:mm.");
    const minutes = serviceIds.reduce((sum, id) => sum + (catalog.services.find((item) => item.id === id)?.durationMin ?? 0), 0);
    const target = await calendarApi.day(context.branchId, dayOf(start), signal);
    const from = minutesOf(clockOf(start));
    const clash = clashes(target, catalog, barberId, from, from + minutes);
    const { t, locale } = context;
    const notes = str(args.notas).slice(0, MAX_TEXT);
    return {
      id: makeId(),
      kind: "createAppointment",
      title: t("clipper.action.create"),
      rows: [
        { label: t("clipper.action.client"), after: client.name },
        { label: t("clipper.action.service"), after: `${services(catalog, serviceIds)} · ${t("clipper.action.minutes", { count: minutes })}` },
        { label: t("clipper.action.when"), after: formatStart(start, locale) },
        { label: t("clipper.action.barber"), after: nameIn(catalog.barbers, barberId) ?? "—" },
        ...(notes ? [{ label: t("clipper.action.notes"), after: notes }] : []),
      ],
      warnings: clash.length > 0 ? [t("clipper.action.clash", { list: clash.join(", ") })] : undefined,
      payload: { clientId, barberId, serviceIds, start, notes: notes || null },
      status: "proposed",
      href: `/calendario?fecha=${dayOf(start)}`,
    };
  },

  async proponer_cancelar_cita(args, context, signal) {
    const { appointment, catalog } = await findAppointment(args, context, signal);
    if (!MOVABLE.has(appointment.status)) throw new ProposalError("Solo se cancela una cita que aún no se cobró ni se canceló.");
    const { t, locale } = context;
    return {
      id: makeId(),
      kind: "cancelAppointment",
      title: t("clipper.action.cancel"),
      rows: [
        { label: t("clipper.action.client"), after: nameIn(catalog.clients, appointment.clientId) ?? "—" },
        { label: t("clipper.action.service"), after: services(catalog, appointment.serviceIds) },
        { label: t("clipper.action.when"), after: formatStart(appointment.start, locale) },
        { label: t("clipper.action.status"), before: t("clipper.action.statusActive"), after: t("clipper.action.statusCancelled") },
      ],
      warnings: appointment.online && appointment.online.paid > 0 ? [t("clipper.action.prepaid")] : undefined,
      payload: { appointmentId: appointment.id, reason: str(args.motivo).slice(0, MAX_TEXT) || undefined, previousStatus: appointment.status },
      status: "proposed",
      href: `/calendario?fecha=${dayOf(appointment.start)}&cita=${appointment.id}`,
    };
  },

  async proponer_bloqueo(args, context, signal) {
    const barberId = str(args.barberoId);
    const date = str(args.fecha);
    const from = str(args.desde);
    const to = str(args.hasta);
    const kind = BLOCK_KINDS.find((item) => item === str(args.tipo)) ?? "personal";
    if (!DAY.test(date) || !CLOCK.test(from) || !CLOCK.test(to) || minutesOf(to) <= minutesOf(from)) throw new ProposalError("Revisa la fecha y las horas (HH:mm, la de fin después de la de inicio).");
    const [catalog, day] = await Promise.all([calendarApi.catalog(context.branchId, signal), calendarApi.day(context.branchId, date, signal)]);
    if (!nameIn(catalog.barbers, barberId)) throw new ProposalError("Ese barbero no está en la sucursal.");
    const clash = clashes(day, catalog, barberId, minutesOf(from), minutesOf(to));
    const { t } = context;
    const reason = str(args.motivo).slice(0, MAX_TEXT);
    return {
      id: makeId(),
      kind: "createBlock",
      title: t("clipper.action.block"),
      rows: [
        { label: t("clipper.action.barber"), after: nameIn(catalog.barbers, barberId) ?? "—" },
        { label: t("clipper.action.when"), after: `${new Intl.DateTimeFormat(context.locale === "en" ? "en-US" : "es-CO", { weekday: "short", day: "numeric", month: "short" }).format(new Date(`${date}T12:00:00`))} · ${from}–${to}` },
        { label: t("clipper.action.kind"), after: t(`clipper.block.${kind}` as AppMessageKey) },
        ...(reason ? [{ label: t("clipper.action.notes"), after: reason }] : []),
      ],
      warnings: clash.length > 0 ? [t("clipper.action.blockClash", { list: clash.join(", ") })] : undefined,
      payload: { barberId, category: kind, startDate: date, startTime: from, endTime: to, description: reason || null },
      status: "proposed",
      href: `/calendario?fecha=${date}`,
    };
  },

  async proponer_nota_cliente(args, context, signal) {
    const catalog = await calendarApi.catalog(context.branchId, signal);
    const client = catalog.clients.find((item) => item.id === str(args.clienteId));
    const text = str(args.texto).slice(0, MAX_TEXT);
    const kind = NOTE_KINDS.find((item) => item === str(args.tipo));
    if (!client) throw new ProposalError("Ese cliente no está; búscalo con buscar_cliente.");
    if (text.length < 3 || !kind) throw new ProposalError("Falta el texto o el tipo de la nota.");
    const { t } = context;
    return {
      id: makeId(),
      kind: "addClientNote",
      title: t("clipper.action.note"),
      rows: [
        { label: t("clipper.action.client"), after: client.name },
        { label: t("clipper.action.kind"), after: t(`clipper.note.${kind}` as AppMessageKey) },
        { label: t("clipper.action.notes"), after: text },
      ],
      // Una alergia o un medicamento se ven antes de cada servicio: que lo confirme quien lo sabe.
      warnings: kind === "note" ? undefined : [t("clipper.action.health")],
      payload: { clientId: client.id, kind, text },
      status: "proposed",
      href: `/clientes/${client.id}`,
    };
  },
} satisfies Record<string, Proposer>;

export type ProposalName = keyof typeof PROPOSERS;
export const isProposalName = (name: string): name is ProposalName => name in PROPOSERS;

/** Lo que vuelve al modelo: que la propuesta quedó lista para aplicar, con lo que muestra la tarjeta. */
export const proposalSummary = (action: ChatAction) => ({
  propuesta: action.id,
  estado: "Lista en una tarjeta: la persona tiene que tocar «Aplicar». Todavía no cambió nada.",
  cambios: action.rows.map((row) => (row.before !== undefined && row.before !== row.after ? `${row.label}: ${row.before} → ${row.after}` : `${row.label}: ${row.after}`)),
  avisos: action.warnings ?? [],
});

const requireString = (payload: Readonly<Record<string, unknown>>, key: string) => {
  const value = payload[key];
  if (typeof value !== "string" || !value) throw new Error("La propuesta está incompleta.");
  return value;
};

/**
 * Aplica o deshace una propuesta con los endpoints de siempre. Devuelve cómo queda la tarjeta; un error
 * del servidor (un choque, sin permiso) se lanza con su mensaje y la tarjeta lo muestra.
 */
export async function runClipperAction(action: ChatAction, op: "apply" | "undo"): Promise<Partial<ChatAction>> {
  const p = action.payload;
  if (op === "undo") {
    const undo = action.undo ?? {};
    if (action.kind === "moveAppointment") await calendarApi.updateAppointment(requireString(undo, "appointmentId"), { start: requireString(undo, "start"), barberId: requireString(undo, "barberId"), actor: "clipper", reason: "Deshecho desde Clipper" });
    else if (action.kind === "createAppointment") await calendarApi.updateAppointment(requireString(undo, "appointmentId"), { status: "cancelled", actor: "clipper", reason: "Deshecho desde Clipper" });
    else if (action.kind === "cancelAppointment") await calendarApi.updateAppointment(requireString(undo, "appointmentId"), { status: requireString(undo, "status") as Appointment["status"], actor: "clipper", reason: "Deshecho desde Clipper" });
    else if (action.kind === "createBlock") await calendarApi.removeBlock(requireString(undo, "blockId"));
    else if (action.kind === "addClientNote") await calendarApi.removeClientNote(requireString(undo, "clientId"), requireString(undo, "noteId"));
    else throw new Error("No sé deshacer este cambio.");
    return { status: "undone", error: undefined };
  }
  if (action.kind === "moveAppointment") {
    const id = requireString(p, "appointmentId");
    await calendarApi.updateAppointment(id, { start: requireString(p, "start"), barberId: requireString(p, "barberId"), actor: "clipper", reason: typeof p.reason === "string" ? p.reason : undefined });
    return { status: "applied", error: undefined, undo: { appointmentId: id, start: requireString(p, "previousStart"), barberId: requireString(p, "previousBarberId") } };
  }
  if (action.kind === "createAppointment") {
    const created = await calendarApi.createAppointment({ clientId: requireString(p, "clientId"), barberId: requireString(p, "barberId"), serviceIds: (p.serviceIds as string[]) ?? [], start: requireString(p, "start"), walkIn: false, repeat: "none", notes: typeof p.notes === "string" ? p.notes : null, actor: "clipper" });
    return { status: "applied", error: undefined, undo: { appointmentId: created.id }, href: `/calendario?fecha=${dayOf(created.start)}&cita=${created.id}` };
  }
  if (action.kind === "cancelAppointment") {
    const id = requireString(p, "appointmentId");
    await calendarApi.updateAppointment(id, { status: "cancelled", actor: "clipper", reason: typeof p.reason === "string" ? p.reason : undefined });
    return { status: "applied", error: undefined, undo: { appointmentId: id, status: requireString(p, "previousStatus") } };
  }
  if (action.kind === "createBlock") {
    const block = await calendarApi.createBlock({ barberId: requireString(p, "barberId"), category: requireString(p, "category") as (typeof BLOCK_KINDS)[number], repeat: "none", startDate: requireString(p, "startDate"), endDate: requireString(p, "startDate"), startTime: requireString(p, "startTime"), endTime: requireString(p, "endTime"), description: typeof p.description === "string" ? p.description : null });
    return { status: "applied", error: undefined, undo: { blockId: block.id } };
  }
  if (action.kind === "addClientNote") {
    const clientId = requireString(p, "clientId");
    const client = await calendarApi.addClientNote(clientId, { kind: requireString(p, "kind") as NoteKind, text: requireString(p, "text") });
    const note = client.notes.find((item) => item.text === p.text) ?? client.notes[0];
    return { status: "applied", error: undefined, undo: { clientId, noteId: note.id } };
  }
  throw new Error("No sé aplicar este cambio.");
}
