import { describe, expect, test } from "vitest";
import { es } from "date-fns/locale";
import type { useAppT } from "@/app/i18n";
import { appEs } from "@/app/i18n";
import { buildSearchIndex, normalizeSearch, searchAppointments } from "./searchModel";
import type { Appointment, CalendarCatalog } from "./types";

const t = ((key: keyof typeof appEs, params?: Record<string, unknown>) => {
  const text: string = appEs[key] ?? key;
  return params ? text.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? "")) : text;
}) as ReturnType<typeof useAppT>;

const catalog: CalendarCatalog = {
  barbers: [
    { id: "b1", branchId: "ma", name: "Paola Zuluaga", avatarUrl: null, level: null, workingHours: {}, acceptsWalkIns: true },
    { id: "b2", branchId: "ma", name: "Emilio Arango", avatarUrl: null, level: null, workingHours: {}, acceptsWalkIns: true },
  ],
  clients: [
    { id: "c1", name: "Marcela García", phone: "+57 300 123 4567", type: "vip", visits: 30, cancellations: 0, noShows: 0, lastVisitAt: null, preferredBarberId: null, visitEveryDays: 21, notes: [{ id: "n1", kind: "allergy", text: "Alergia a la henna", createdAt: "2026-09-01" }] },
    { id: "c2", name: "Juan Pérez", phone: "+57 310 555 0000", type: "new", visits: 1, cancellations: 0, noShows: 0, lastVisitAt: null, preferredBarberId: null, visitEveryDays: null, notes: [] },
  ],
  services: [
    { id: "s1", name: "Fade", category: "Cortes", durationMin: 45, price: 33 },
    { id: "s2", name: "Arreglo de barba", category: "Barba", durationMin: 30, price: 22 },
  ],
  products: [{ id: "p1", name: "Cera mate", category: "Estilo", price: 18 }],
};

function appointment(draft: Partial<Appointment>): Appointment {
  return {
    id: "a1",
    branchId: "ma",
    clientId: "c1",
    barberId: "b1",
    requestedBarberId: null,
    serviceIds: ["s1"],
    products: [],
    start: "2026-10-20T09:30",
    durationMin: 45,
    status: "scheduled",
    barberReady: false,
    walkIn: false,
    source: "internal",
    repeat: "none",
    seriesId: null,
    notes: null,
    createdAt: "2026-10-01T10:00:00Z",
    createdBy: "Lucía",
    history: [],
    payment: null,
    ...draft,
  };
}

const appointments = [
  appointment({ id: "a1" }),
  appointment({ id: "a2", clientId: "c2", barberId: "b2", serviceIds: ["s2"], start: "2026-10-17T15:00", status: "no_show", source: "online", notes: "Prefiere máquina 2" }),
  appointment({ id: "a3", start: "2026-10-13T11:00", status: "paid", products: [{ productId: "p1", qty: 1 }] }),
];

const now = new Date(2026, 9, 18, 12, 0);
const index = buildSearchIndex({ appointments, ctx: { catalog, intl: "es-CO", formatMoney: (value) => `US$ ${value}`, now }, t, dateLocale: es });
const ids = (query: string) => searchAppointments(index, query, now).items.map((item) => item.id);

describe("searchAppointments", () => {
  test("finds by client name without accents or case", () => {
    expect(ids("marcela garcia")).toEqual(["a1", "a3"]);
    expect(ids("PÉREZ")).toEqual(["a2"]);
  });

  test("finds by phone, whole or in pieces", () => {
    expect(ids("3001234567")).toEqual(["a1", "a3"]);
    expect(ids("300 123")).toEqual(["a1", "a3"]);
    expect(ids("555")).toEqual(["a2"]);
  });

  test("finds by barber, service, product and client type", () => {
    expect(ids("emilio")).toEqual(["a2"]);
    expect(ids("barba")).toEqual(["a2"]);
    expect(ids("cera")).toEqual(["a3"]);
    expect(ids("vip")).toEqual(["a1", "a3"]);
  });

  test("finds by status in the words people use", () => {
    expect(ids("no asistió")).toEqual(["a2"]);
    expect(ids("cobrada")).toEqual(["a3"]);
    expect(ids("en línea")).toEqual(["a2"]);
  });

  test("finds by day, time, notes and alerts", () => {
    expect(ids("20 oct")).toEqual(["a1"]);
    expect(ids("sábado")).toEqual(["a2"]);
    expect(ids("9:30")).toEqual(["a1"]);
    expect(ids("máquina")).toEqual(["a2"]);
    expect(ids("henna")).toEqual(["a1", "a3"]);
  });

  test("every word must match", () => {
    expect(ids("marcela cobrada")).toEqual(["a3"]);
    expect(ids("marcela emilio")).toEqual([]);
  });

  test("upcoming appointments come before past ones", () => {
    expect(ids("fade")).toEqual(["a1", "a3"]);
  });

  test("an empty search finds nothing and short numbers do not flood", () => {
    expect(searchAppointments(index, "   ", now).total).toBe(0);
    // «7» no está como número suelto en ninguna (sí dentro de «17»): no trae nada.
    expect(ids("7")).toEqual([]);
    // «2» sí: la nota de a2 dice «máquina 2».
    expect(ids("2")).toEqual(["a2"]);
  });

  test("normalizes accents, case and spaces", () => {
    expect(normalizeSearch("  No   Asistió ")).toBe("no asistio");
  });
});
