import { api } from "@/lib/api";
import { searchHelp } from "@/lib/help";
import type { ClipperRole, ClipperToolName } from "@/lib/clipper/toolCatalog";
import { calendarApi } from "@/features/calendar/api";
import { customersApi } from "@/features/customers/api";
import { payrollApi } from "@/features/payroll/api";
import { reviewApi } from "@/features/review/review";
import { registerApi } from "@/features/transactions/register";
import { transactionsApi } from "@/features/transactions/api";
import { helpPath, loadHelpIndex, loadHelpSearchDocs, type HelpLocale } from "@/help/content";

/**
 * Lo que hace cada herramienta de Clipper (el catálogo está en `src/lib/clipper/toolCatalog.ts`). Cada
 * una llama a un endpoint con la sesión de quien pregunta —el permiso lo aplica el servidor— y devuelve
 * un resumen compacto con los conteos y totales ya hechos: el modelo solo cita, nunca calcula.
 */

export interface ClipperToolContext {
  branchId: string;
  role: ClipperRole;
  /** La ficha de equipo de quien pregunta: con ella un barbero ve solo lo suyo. */
  memberId: string | null;
  /** AAAA-MM-DD en la sucursal. */
  today: string;
  locale: HelpLocale;
}

type Args = Record<string, unknown>;
type Runner = (args: Args, context: ClipperToolContext, signal: AbortSignal) => Promise<unknown>;

const MAX_ROWS = 40;
const MAX_CLIENTS = 5;
const MAX_REACTIVATION = 15;
const MAX_HELP = 3;
const DAY_MS = 86_400_000;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

const isBarber = (role: ClipperRole) => role === "barbero-comision" || role === "barbero-renta";
const dayArg = (value: unknown, fallback: string) => (typeof value === "string" && DAY.test(value) ? value : fallback);
const round = (value: number) => Math.round(value * 100) / 100;
const sum = (values: readonly number[]) => round(values.reduce((total, value) => total + value, 0));
const normalize = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const countBy = <T,>(items: readonly T[], key: (item: T) => string) => items.reduce<Record<string, number>>((acc, item) => ({ ...acc, [key(item)]: (acc[key(item)] ?? 0) + 1 }), {});

/** La semana (lunes a domingo) que contiene el día: el periodo de nómina por defecto. */
export function weekOf(day: string): { from: string; to: string } {
  const date = new Date(`${day}T12:00:00`);
  const monday = new Date(date.getTime() - ((date.getDay() + 6) % 7) * DAY_MS);
  const key = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  return { from: key(monday), to: key(new Date(monday.getTime() + 6 * DAY_MS)) };
}

const RUNNERS: Record<ClipperToolName, Runner> = {
  async agenda_del_dia(args, context, signal) {
    const fecha = dayArg(args.fecha, context.today);
    const [catalog, day] = await Promise.all([calendarApi.catalog(context.branchId, signal), calendarApi.day(context.branchId, fecha, signal)]);
    const name = (list: readonly { id: string; name: string }[], id: string) => list.find((item) => item.id === id)?.name ?? "—";
    const mine = isBarber(context.role) ? day.appointments.filter((item) => item.barberId === context.memberId) : day.appointments;
    const sorted = [...mine].sort((a, b) => a.start.localeCompare(b.start));
    const pending = sorted.filter((item) => item.status === "scheduled");
    return {
      fecha,
      citas: sorted.length,
      porEstado: countBy(sorted, (item) => item.status),
      porConfirmar: pending.filter((item) => item.confirmation?.status !== "confirmed").length,
      riesgoAltoDeNoVenir: pending.filter((item) => item.risk?.level === "high").length,
      lista: sorted.slice(0, MAX_ROWS).map((item) => ({
        hora: item.start.slice(11, 16),
        cliente: name(catalog.clients, item.clientId),
        barbero: name(catalog.barbers, item.barberId),
        servicios: item.serviceIds.map((id) => name(catalog.services, id)).join(" + "),
        minutos: item.durationMin,
        estado: item.status,
        sinCita: item.walkIn,
        confirmada: item.confirmation?.status === "confirmed",
        riesgo: item.risk?.level ?? null,
      })),
      ...(sorted.length > MAX_ROWS ? { recortado: true } : {}),
    };
  },

  async cuentas_del_periodo(args, context, signal) {
    const from = dayArg(args.desde, context.today);
    const to = dayArg(args.hasta, from);
    const { items } = await transactionsApi.list({ branchId: context.branchId, from, to }, signal);
    const mine = isBarber(context.role) ? items.filter((item) => item.barberId === context.memberId) : items;
    const live = mine.filter((item) => item.status !== "void");
    const byBarber = new Map<string, { cuentas: number; cobrado: number }>();
    for (const item of live) {
      const key = item.barber ?? "—";
      const row = byBarber.get(key) ?? { cuentas: 0, cobrado: 0 };
      byBarber.set(key, { cuentas: row.cuentas + 1, cobrado: round(row.cobrado + item.collected) });
    }
    const byMethod = new Map<string, number>();
    for (const item of live) if (item.method) byMethod.set(item.method, round((byMethod.get(item.method) ?? 0) + item.collected));
    return {
      desde: from,
      hasta: to,
      cuentas: live.length,
      facturado: sum(live.map((item) => item.total)),
      cobrado: sum(live.map((item) => item.collected)),
      porCobrar: sum(live.filter((item) => item.status === "open").map((item) => item.balance)),
      cuentasAbiertas: live.filter((item) => item.status === "open").length,
      devuelto: sum(live.map((item) => item.refunded)),
      porMedio: Object.fromEntries(byMethod),
      porBarbero: [...byBarber.entries()].map(([barbero, row]) => ({ barbero, ...row })).sort((a, b) => b.cobrado - a.cobrado),
    };
  },

  async resumen_semana(_args, context, signal) {
    const week = await api.get<{ revenue: number; revenuePrev: number; services: number; servicesPrev: number } & Record<string, unknown>>("/reports/week", { query: { branchId: context.branchId }, signal });
    const change = (now: number, before: number) => (before > 0 ? Math.round(((now - before) / before) * 100) : null);
    return { ...week, cambioVentasPorciento: change(week.revenue, week.revenuePrev), cambioServiciosPorciento: change(week.services, week.servicesPrev) };
  },

  async caja_del_dia(args, context, signal) {
    const fecha = dayArg(args.fecha, context.today);
    const day = await registerApi.day(context.branchId, fecha, signal);
    return { fecha, entro: day.expected, cerrada: day.closure !== null, cierre: day.closure };
  },

  async buscar_cliente(args, _context, signal) {
    const query = normalize(String(args.nombre ?? "").trim());
    if (!query) return { error: "Falta el nombre." };
    const { items } = await customersApi.list(signal);
    const now = Date.now();
    return {
      encontrados: items.filter((item) => normalize(item.name).includes(query)).length,
      clientes: items
        .filter((item) => normalize(item.name).includes(query))
        .slice(0, MAX_CLIENTS)
        .map((item) => ({
          id: item.id,
          nombre: item.name,
          segmento: item.segment,
          visitas: item.visits,
          ultimaVisita: item.lastVisitAt?.slice(0, 10) ?? null,
          diasDesdeUltimaVisita: item.lastVisitAt ? Math.floor((now - new Date(item.lastVisitAt).getTime()) / DAY_MS) : null,
          vuelveCadaDias: item.visitEveryDays,
          barberoPreferido: item.preferredBarber,
          inasistencias: item.noShows,
          cancelaciones: item.cancellations,
          gastado: item.ltv,
          bloqueado: item.blocked,
        })),
    };
  },

  async proxima_visita_cliente(args, _context, signal) {
    const id = String(args.clienteId ?? "");
    if (!/^[\w-]{1,64}$/.test(id)) return { error: "Id de cliente inválido." };
    return api.get(`/customers/${id}/next-visit`, { signal });
  },

  async clientes_para_reactivar(_args, context, signal) {
    const { items } = await api.get<{ items: { name: string; segment: string; daysSince: number | null; everyDays: number | null; consent: boolean; recentlyContacted: boolean; offer: { start: string; barberName: string } | null }[] }>("/customers/reactivation", { query: { branchId: context.branchId }, signal });
    return {
      total: items.length,
      aceptanMensajes: items.filter((item) => item.consent).length,
      porSegmento: countBy(items, (item) => item.segment),
      clientes: items.slice(0, MAX_REACTIVATION).map((item) => ({ nombre: item.name, segmento: item.segment, diasDesdeUltimaVisita: item.daysSince, vuelveCadaDias: item.everyDays, aceptaMensajes: item.consent, escritoHacePoco: item.recentlyContacted, hueco: item.offer ? `${item.offer.start.slice(0, 16).replace("T", " ")} con ${item.offer.barberName}` : null })),
    };
  },

  async nomina(args, context, signal) {
    const week = weekOf(context.today);
    const from = dayArg(args.desde, week.from);
    const to = dayArg(args.hasta, args.desde ? from : week.to);
    const data = await payrollApi.get({ branchId: context.branchId, from, to, ...(isBarber(context.role) && context.memberId ? { memberId: context.memberId } : {}) }, signal);
    const members = isBarber(context.role) ? data.members.filter((item) => item.memberId === context.memberId) : data.members;
    return {
      desde: data.from,
      hasta: data.to,
      estado: data.run?.status ?? "open",
      totalNeto: sum(members.map((item) => item.net)),
      personas: members.map((item) => ({
        nombre: item.name,
        modelo: item.payout,
        servicios: item.services,
        ventasServicios: item.serviceSales,
        comisionServicios: item.serviceCommission,
        comisionProductos: item.productCommission,
        propinas: item.tips,
        salario: item.salary,
        renta: item.rent,
        deducciones: item.deductions,
        ajustes: item.adjustmentsTotal ?? 0,
        neto: item.net,
        ...(item.balance !== undefined ? { saldoRenta: item.balance } : {}),
      })),
    };
  },

  async rentabilidad_servicios(args, context, signal) {
    const days = Math.min(180, Math.max(7, Number(args.dias) || 90));
    return api.get("/reports/menu", { query: { branchId: context.branchId, days }, signal });
  },

  async turno_sin_cita(_args, context, signal) {
    return api.get("/team/lineup/turn", { query: { branchId: context.branchId, kind: "walkIn" }, signal });
  },

  async revision_antes_de_cerrar(args, context, signal) {
    if (args.que === "nomina") {
      const week = weekOf(context.today);
      const from = dayArg(args.desde, week.from);
      const to = dayArg(args.hasta, args.desde ? from : week.to);
      return { que: "nomina", desde: from, hasta: to, alertas: (await reviewApi.payroll({ branchId: context.branchId, from, to }, signal)).items.map(({ severity, kind, params }) => ({ gravedad: severity, tipo: kind, ...params })) };
    }
    const fecha = dayArg(args.desde, context.today);
    return { que: "caja", fecha, alertas: (await reviewApi.register(context.branchId, fecha, signal)).items.map(({ severity, kind, params }) => ({ gravedad: severity, tipo: kind, ...params })) };
  },

  async buscar_ayuda(args, context) {
    const question = String(args.pregunta ?? "").trim();
    if (!question) return { error: "Falta la pregunta." };
    const [docs, index] = await Promise.all([loadHelpSearchDocs(context.locale), loadHelpIndex(context.locale)]);
    return {
      articulos: searchHelp(docs, question, { limit: MAX_HELP }).map((hit) => ({ titulo: index.articles[hit.id]?.title ?? hit.id, resumen: index.articles[hit.id]?.description ?? hit.snippet, enlace: helpPath(hit.id) })),
    };
  },
};

/** Los nombres que se muestran bajo la respuesta («Consulté: Agenda del día»). */
export const TOOL_LABEL_KEYS = {
  agenda_del_dia: "clipper.tool.agenda",
  cuentas_del_periodo: "clipper.tool.accounts",
  resumen_semana: "clipper.tool.week",
  caja_del_dia: "clipper.tool.register",
  buscar_cliente: "clipper.tool.client",
  proxima_visita_cliente: "clipper.tool.nextVisit",
  clientes_para_reactivar: "clipper.tool.reactivation",
  nomina: "clipper.tool.payroll",
  rentabilidad_servicios: "clipper.tool.menu",
  turno_sin_cita: "clipper.tool.lineup",
  revision_antes_de_cerrar: "clipper.tool.review",
  buscar_ayuda: "clipper.tool.help",
} as const satisfies Record<ClipperToolName, string>;

export const isToolName = (name: string): name is ClipperToolName => name in RUNNERS;

/**
 * Ejecuta una consulta y la devuelve como texto para el modelo. Un error (sin permiso, sin datos) no
 * rompe la conversación: vuelve como resultado con `is_error`, y el modelo lo dice.
 */
export async function runClipperTool(name: string, args: Args, context: ClipperToolContext, signal: AbortSignal): Promise<{ content: string; isError: boolean }> {
  if (!isToolName(name)) return { content: JSON.stringify({ error: "Herramienta desconocida." }), isError: true };
  try {
    return { content: JSON.stringify(await RUNNERS[name](args, context, signal)), isError: false };
  } catch (error) {
    if (signal.aborted) throw error;
    const status = (error as { status?: number }).status;
    const message = status === 403 ? "Sin permiso para este dato con este rol." : status === 401 ? "La sesión terminó." : "No se pudo consultar.";
    return { content: JSON.stringify({ error: message, status: status ?? null }), isError: true };
  }
}
