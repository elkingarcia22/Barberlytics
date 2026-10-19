import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { Route, Routes } from "react-router";

/* jsdom no tiene canvas: el lienzo de ECharts se sustituye por un hueco y la
   prueba mide lo que sí es texto —los recuentos, los rótulos, la URL—. */
vi.mock("@/components/charts/EChart", () => ({
  EChart: ({ height }: { height?: number | string }) => <div data-testid="echart" style={{ height }} />,
}));
import { renderWithProviders, screen, userEvent, waitFor, within } from "@/test/render";
import { db } from "@/mocks/db";
import { ServiceProfilePage } from "./ServiceProfilePage";
import { ServicesPage } from "./ServicesPage";
import { ResourcesDrawer } from "./ResourcesDrawer";
import { servicesApi } from "./api";
import { ALL, SERVICE_ALERTS, parseCategory, parseKind, servicesPulse } from "./servicesHome";
import { comboTotals, formatDuration, groupByCategory, marginOf } from "./servicesUtils";
import { emptyServiceInput, serviceInputSchema, type CatalogService, type ServiceCategory } from "./types";

const TOKEN = "mock-acc_admin-test";

function service(draft: Partial<CatalogService> = {}): CatalogService {
  return { id: "s1", kind: "service", name: "Corte", description: "", categoryId: "c1", price: 40, cost: 10, durationMin: 30, taxRate: null, visibility: "public", active: true, multiservice: false, prep: { enabled: false, minutes: 0, position: "start" }, giftCards: true, includes: [], createdAt: "2026-06-04T15:00:00.000Z", offeredBy: 3, teamSize: 5, ...draft };
}

const CATEGORIES: ServiceCategory[] = [
  { id: "c1", name: "Cortes", description: "", visibility: "public" },
  { id: "c2", name: "Barba", description: "", visibility: "public" },
];

function renderApp(route: string) {
  db.sessions.set(TOKEN, "acc_admin");
  return renderWithProviders(
    <Routes>
      <Route path="/servicios" element={<ServicesPage />} />
      <Route path="/servicios/:id" element={<ServiceProfilePage />} />
    </Routes>,
    { route, token: TOKEN }
  );
}

describe("ayudas de servicios", () => {
  test("el margen es lo que queda del precio tras el costo, y no existe sin costo", () => {
    expect(marginOf({ price: 40, cost: 10 })).toBe(75);
    expect(marginOf({ price: 40, cost: null })).toBeNull();
    expect(marginOf({ price: 0, cost: 0 })).toBeNull();
  });

  test("la duración se lee como en una agenda", () => {
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(60)).toBe("1 h");
    expect(formatDuration(90)).toBe("1 h 30 min");
  });

  test("un combo suma el precio y la duración de lo que agrupa, e ignora lo que ya no existe", () => {
    const items = [service(), service({ id: "s2", price: 30, durationMin: 20 })];
    expect(comboTotals(["s1", "s2", "borrado"], items)).toEqual({ price: 70, durationMin: 50 });
  });

  test("agrupar por categoría respeta el orden del catálogo y omite las vacías", () => {
    const groups = groupByCategory(CATEGORIES, [service({ id: "a", categoryId: "c1" }), service({ id: "b", categoryId: "c1" })]);
    expect(groups.map((group) => group.category.id)).toEqual(["c1"]);
    expect(groups[0].items).toHaveLength(2);
  });

  test("un filtro desconocido en la URL cae en «todos»", () => {
    expect(parseKind("combo")).toBe("combo");
    expect(parseKind("inventado")).toBe(ALL);
    expect(parseCategory("c2", CATEGORIES)).toBe("c2");
    expect(parseCategory("no-existe", CATEGORIES)).toBe(ALL);
  });

  test("un combo necesita dos servicios y un servicio necesita precio", () => {
    const combo = serviceInputSchema.safeParse({ ...emptyServiceInput("combo", "c1"), name: "Combo", price: 50, includes: ["s1"] });
    expect(combo.success).toBe(false);
    const noPrice = serviceInputSchema.safeParse({ ...emptyServiceInput("service", "c1"), name: "Corte" });
    expect(noPrice.success ? [] : noPrice.error.issues.map((issue) => issue.path[0])).toContain("price");
    const fine = serviceInputSchema.safeParse({ ...emptyServiceInput("service", "c1"), name: "Corte", price: 35 });
    expect(fine.success).toBe(true);
  });
});

describe("pulso y avisos del catálogo", () => {
  const rows = [service(), service({ id: "s2", price: 60, cost: null, durationMin: 60 }), service({ id: "s3", active: false, price: 500, cost: null, offeredBy: 0 })];

  test("el pulso solo cuenta lo activo", () => {
    const pulse = servicesPulse(rows);
    expect(pulse.total).toBe(3);
    expect(pulse.active).toBe(2);
    expect(pulse.avgPrice).toBe(50);
    expect(pulse.avgDurationMin).toBe(45);
    expect(pulse.avgMargin).toBe(75);
    expect(pulse.withCost).toBe(1);
  });

  test("sin ningún costo registrado no hay margen que enseñar", () => {
    expect(servicesPulse([service({ cost: null })]).avgMargin).toBeNull();
  });

  test("los avisos ignoran lo inactivo: ya no está a la venta", () => {
    const off = service({ active: false, cost: null, offeredBy: 0, visibility: "private" });
    expect(SERVICE_ALERTS.filter((alert) => alert.matches(off))).toEqual([]);
    const orphan = service({ offeredBy: 0 });
    expect(SERVICE_ALERTS.filter((alert) => alert.matches(orphan)).map((alert) => alert.id)).toEqual(["nobody"]);
  });
});

/** jsdom no trae IntersectionObserver y el centinela de «cargar al bajar» de la lista lo pide. */
class InertObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe("catálogo de servicios", () => {
  beforeAll(() => {
    vi.stubGlobal("IntersectionObserver", InertObserver);
  });
  beforeEach(() => {
    db.reset();
    db.sessions.set(TOKEN, "acc_admin");
  });

  test("la lista junta servicios y combos y los separa con el selector", async () => {
    renderApp("/servicios");
    const user = userEvent.setup();
    expect(await screen.findByRole("heading", { name: "Servicios" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Corte clásico" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ritual premium" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /combos/i }));
    await waitFor(() => expect(screen.queryByRole("link", { name: "Corte clásico" })).toBeNull());
    expect(screen.getByRole("link", { name: "Ritual premium" })).toBeInTheDocument();
  });

  test("la categoría de la URL filtra y explica qué es", async () => {
    renderApp("/servicios?categoria=cat_barba");
    expect(await screen.findByRole("link", { name: "Arreglo de barba" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Corte clásico" })).toBeNull();
    expect(screen.getByTestId("services-category-hint")).toHaveTextContent(/perfilado y afeitado/i);
  });

  test("la ficha de un combo dice qué incluye y cuánto ahorra", async () => {
    renderApp("/servicios/svc_combo");
    expect(await screen.findByRole("heading", { name: /Corte \+ barba/ })).toBeInTheDocument();
    const includes = screen.getByTestId("service-includes");
    expect(within(includes).getByText("Corte clásico")).toBeInTheDocument();
    expect(within(includes).getByText("Arreglo de barba")).toBeInTheDocument();
    expect(screen.getByText("El cliente ahorra")).toBeInTheDocument();
  });

  test("un servicio que no existe ofrece volver al catálogo", async () => {
    renderApp("/servicios/no-existe");
    expect(await screen.findByText("No encontramos este servicio")).toBeInTheDocument();
  });
});

describe("contrato de servicios (mock)", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(TOKEN, "acc_admin");
  });

  /* El cliente HTTP toma el token del puente que monta `AuthProvider`; un render lo deja puesto. */
  const withSession = async () => {
    renderApp("/servicios");
    await screen.findByRole("heading", { name: "Servicios" });
  };

  test("desactivar un servicio lo saca de lo que la agenda puede agendar", async () => {
    await withSession();
    const before = await servicesApi.catalog("ma");
    expect(before.items.find((item) => item.id === "svc_cejas")?.active).toBe(true);
    const after = await servicesApi.setActive("ma", ["svc_cejas"], false);
    expect(after.items.find((item) => item.id === "svc_cejas")?.active).toBe(false);
    expect(db.services.items.find((item) => item.id === "svc_cejas")?.activeBranchIds).not.toContain("ma");
  });

  test("un servicio que está dentro de un combo no se puede borrar", async () => {
    await withSession();
    await expect(servicesApi.remove("svc_corte")).rejects.toMatchObject({ status: 409 });
    expect(db.services.items.some((item) => item.id === "svc_corte")).toBe(true);
  });

  test("borrar una categoría manda sus servicios a «Sin categoría»", async () => {
    await withSession();
    await servicesApi.removeCategory("cat_extras");
    const catalog = await servicesApi.catalog("ma");
    expect(catalog.categories.some((category) => category.id === "cat_extras")).toBe(false);
    expect(catalog.items.find((item) => item.id === "svc_cejas")?.categoryId).toBe("cat_none");
  });

  test("quitar a todo el equipo deja el servicio sin quien lo ofrezca", async () => {
    await withSession();
    const detail = await servicesApi.setTeam("svc_fade", "ma", []);
    expect(detail.offeredBy).toBe(0);
    expect(detail.team.every((row) => !row.offered)).toBe(true);
  });

  test("un recurso especial pide al menos un servicio, se crea y se borra sin tocar los servicios", async () => {
    await withSession();
    const before = await servicesApi.resources();
    expect(before.items.map((item) => item.id)).toContain("res_lavado");
    await expect(servicesApi.createResource({ name: "Silla de color", description: "", units: 1, serviceIds: [] })).rejects.toMatchObject({ status: 422 });
    const created = await servicesApi.createResource({ name: "Silla de color", description: "", units: 2, serviceIds: ["svc_tinte", "no-existe"] });
    expect(created.serviceIds).toEqual(["svc_tinte"]);
    await servicesApi.removeResource(created.id);
    const after = await servicesApi.resources();
    expect(after.items.some((item) => item.id === created.id)).toBe(false);
    expect(db.services.items.some((item) => item.id === "svc_tinte")).toBe(true);
  });

  test("el panel de recursos lista los del local con sus servicios", async () => {
    db.sessions.set(TOKEN, "acc_admin");
    renderWithProviders(<ResourcesDrawer open onOpenChange={() => undefined} items={[service({ id: "svc_tratamiento", name: "Tratamiento capilar" })]} />, { token: TOKEN });
    const list = await screen.findByTestId("resources-list");
    expect(within(list).getByText("Sillón de lavado")).toBeInTheDocument();
    expect(within(list).getByText(/Tratamiento capilar/)).toBeInTheDocument();
  });
});
