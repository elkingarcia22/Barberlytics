import { delay, http, HttpResponse } from "msw";
import { accountById, db } from "../db";
import { barbersOf } from "../team/seed";
import { WALK_IN_CLIENT } from "../calendar/seed";

/**
 * La puesta en marcha de una barbería (docs/API_CONTRACT.md, «Puesta en marcha»): lo que hay que
 * dejar listo antes de operar. Nadie marca los pasos a mano: cada uno se da por hecho cuando el dato
 * existe de verdad (la sucursal tiene moneda e impuesto, hay servicios con precio, hay equipo…).
 */

const BASE = "*/api";
const LATENCY_MS = 150;

function requireAuth(request: Request) {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const accountId = token ? db.sessions.get(token) : undefined;
  return accountById(accountId) ?? null;
}

type Step = { id: "company" | "branch" | "hours" | "services" | "team" | "payments" | "booking" | "clients"; done: boolean; href: string };

export function onboardingOf(branchId: string): Step[] {
  const sections = db.settings.sections as Record<string, Record<string, unknown>>;
  const branches = db.settings.lists.branches as { id: string; currency?: string; taxGroupId?: string | null; timezone?: string; gatewayId?: string | null }[];
  const branch = branches.find((item) => item.id === branchId);
  const gateways = db.settings.lists.gateways as unknown as { id: string; connected?: boolean }[];
  const booking = sections.booking ?? {};
  const methods = (booking.paymentMethods ?? {}) as { card?: boolean; payAtShop?: boolean };
  return [
    { id: "company", done: Boolean(sections.company?.name && sections.company?.phone), href: "/configuracion/empresa" },
    { id: "branch", done: Boolean(branch?.currency && branch.taxGroupId && branch.timezone), href: "/configuracion/sucursales" },
    { id: "hours", done: Boolean(sections.business?.openTime && sections.business?.closeTime), href: "/configuracion/negocio" },
    { id: "services", done: db.services.items.some((item) => item.activeBranchIds.includes(branchId) && item.price > 0), href: "/servicios" },
    { id: "team", done: barbersOf(db.team.members, db.team.orders, branchId).length > 0, href: "/usuarios" },
    { id: "payments", done: Boolean(branch?.gatewayId && gateways.some((item) => item.id === branch.gatewayId && item.connected)), href: "/configuracion/pagos" },
    { id: "booking", done: Boolean(methods.card || methods.payAtShop), href: "/reservar" },
    { id: "clients", done: db.calendar.clients.some((client) => client.id !== WALK_IN_CLIENT.id), href: "/clientes" },
  ];
}

export const onboardingHandlers = [
  http.get(`${BASE}/onboarding`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return HttpResponse.json({ code: "unauthorized", message: "Tu sesión expiró." }, { status: 401 });
    const steps = onboardingOf(new URL(request.url).searchParams.get("branchId") ?? "ma");
    return HttpResponse.json({ steps, done: steps.filter((step) => step.done).length, total: steps.length });
  }),
];
