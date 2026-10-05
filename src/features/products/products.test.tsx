import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { Route, Routes } from "react-router";

/* jsdom no tiene canvas: el lienzo de ECharts se sustituye por un hueco y la
   prueba mide lo que sí es texto —los recuentos, los rótulos, la URL—. */
vi.mock("@/components/charts/EChart", () => ({
  EChart: ({ height }: { height?: number | string }) => <div data-testid="echart" style={{ height }} />,
}));
import { renderWithProviders, screen, userEvent } from "@/test/render";
import { db } from "@/mocks/db";
import { AccessProvider, buildAccess } from "@/features/access";
import type { TeamRole } from "@/features/team/types";
import { catalogAccess } from "@/features/catalog/catalogAccess";
import { ProductProfilePage } from "./ProductProfilePage";
import { ProductsPage } from "./ProductsPage";
import { productsApi } from "./api";
import { ALL, PRODUCT_ALERTS, parseCategory, productsPulse, profitOf } from "./productsHome";
import { emptyProductInput, productInputSchema, type CatalogProduct, type ProductCategory } from "./types";

const TOKEN = "mock-acc_admin-test";

function product(draft: Partial<CatalogProduct> = {}): CatalogProduct {
  return { id: "p1", name: "Cera", description: "", categoryId: "c1", price: 20, cost: 10, taxRate: null, sku: "ST-1", brand: null, distributor: null, visibility: "public", sellable: true, active: true, createdAt: "2026-06-10T15:00:00.000Z", ...draft };
}

const CATEGORIES: ProductCategory[] = [{ id: "c1", name: "Styling", description: "" }];

function renderApp(route: string) {
  db.sessions.set(TOKEN, "acc_admin");
  return renderWithProviders(
    <Routes>
      <Route path="/productos" element={<ProductsPage />} />
      <Route path="/productos/:id" element={<ProductProfilePage />} />
    </Routes>,
    { route, token: TOKEN }
  );
}

/** La misma app, mirada con un rol concreto. */
function renderAppAs(role: TeamRole, route: string) {
  db.sessions.set(TOKEN, "acc_admin");
  return renderWithProviders(
    <AccessProvider value={buildAccess({ role })}>
      <Routes>
        <Route path="/productos" element={<ProductsPage />} />
        <Route path="/productos/:id" element={<ProductProfilePage />} />
      </Routes>
    </AccessProvider>,
    { route, token: TOKEN }
  );
}

describe("ayudas de productos", () => {
  test("lo que deja una unidad es la venta menos la compra, y no existe sin precio de compra", () => {
    expect(profitOf({ price: 22, cost: 12.1 })).toBe(9.9);
    expect(profitOf({ price: 22, cost: null })).toBeNull();
    expect(profitOf({ price: 5, cost: 8 })).toBe(-3);
  });

  test("una categoría desconocida en la URL cae en «todas»", () => {
    expect(parseCategory("c1", CATEGORIES)).toBe("c1");
    expect(parseCategory("no-existe", CATEGORIES)).toBe(ALL);
    expect(parseCategory(null, CATEGORIES)).toBe(ALL);
  });

  test("el formulario exige nombre y precio de venta; el resto es opcional", () => {
    const empty = productInputSchema.safeParse(emptyProductInput("c1"));
    expect(empty.success ? [] : empty.error.issues.map((issue) => issue.path[0])).toEqual(expect.arrayContaining(["name", "price"]));
    expect(productInputSchema.safeParse({ ...emptyProductInput("c1"), name: "Cera", price: 18 }).success).toBe(true);
  });
});

describe("pulso y avisos del catálogo de productos", () => {
  const rows = [product(), product({ id: "p2", price: 30, cost: null, sku: null }), product({ id: "p3", sellable: false, price: 100, cost: 1 }), product({ id: "p4", active: false, price: 500, cost: null })];

  test("el pulso solo cuenta lo que hoy se puede vender aquí", () => {
    const pulse = productsPulse(rows);
    expect(pulse.total).toBe(4);
    expect(pulse.onSale).toBe(2);
    expect(pulse.avgPrice).toBe(25);
    expect(pulse.avgMargin).toBe(50);
    expect(pulse.withCost).toBe(1);
  });

  test("cada aviso señala lo suyo y ninguno mira lo inactivo", () => {
    const matched = (row: CatalogProduct) => PRODUCT_ALERTS.filter((alert) => alert.matches(row)).map((alert) => alert.id);
    expect(matched(rows[0])).toEqual([]);
    expect(matched(rows[1])).toEqual(["noCost", "noSku"]);
    expect(matched(rows[2])).toEqual(["internal"]);
    expect(matched(rows[3])).toEqual([]);
  });
});

/** jsdom no trae IntersectionObserver y el centinela de «cargar al bajar» de la lista lo pide. */
class InertObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe("catálogo de productos", () => {
  beforeAll(() => {
    vi.stubGlobal("IntersectionObserver", InertObserver);
  });
  beforeEach(() => {
    db.reset();
    db.sessions.set(TOKEN, "acc_admin");
  });

  test("la lista carga y la categoría de la URL filtra y explica qué es", async () => {
    renderApp("/productos?categoria=pcat_barba");
    expect(await screen.findByRole("heading", { name: "Productos" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Aceite de barba" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Cera mate" })).toBeNull();
    expect(screen.getByTestId("products-category-hint")).toHaveTextContent(/aceites y bálsamos/i);
  });

  test("un aviso filtra la lista a los productos que lo cumplen", async () => {
    renderApp("/productos");
    const user = userEvent.setup();
    expect(await screen.findByRole("link", { name: "Cera mate" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /sin precio de compra/i }));
    expect(await screen.findByRole("link", { name: "Bálsamo de barba" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Cera mate" })).toBeNull();
  });

  test("la ficha junta los números y de dónde viene", async () => {
    renderApp("/productos/prd_aceite");
    expect(await screen.findByRole("heading", { name: /Aceite de barba/ })).toBeInTheDocument();
    expect(screen.getByText("Deja por unidad")).toBeInTheDocument();
    expect(screen.getByText("BR-ACE-030")).toBeInTheDocument();
    expect(screen.getByText("Beauty Pro")).toBeInTheDocument();
  });

  test("un producto que no existe ofrece volver al catálogo", async () => {
    renderApp("/productos/no-existe");
    expect(await screen.findByText("No encontramos este producto")).toBeInTheDocument();
  });
});

describe("productos según el rol", () => {
  beforeAll(() => {
    vi.stubGlobal("IntersectionObserver", InertObserver);
  });
  beforeEach(() => {
    db.reset();
  });

  test("recepción solo consulta: ni crea, ni edita, ni borra, ni ve costo", () => {
    const can = catalogAccess(buildAccess({ role: "recepcion" }), "products");
    expect([can.canCreate, can.canEdit, can.canToggle, can.canDelete, can.seesMoney]).toEqual([false, false, false, false, false]);
    expect(can.categories).toEqual({ view: true, create: false, edit: false, delete: false });
  });

  test("el admin gestiona el catálogo pero borrar es del dueño", () => {
    const admin = catalogAccess(buildAccess({ role: "admin" }), "products");
    expect([admin.canCreate, admin.canEdit, admin.canDelete]).toEqual([true, true, false]);
    expect(catalogAccess(buildAccess({ role: "owner" }), "products").canDelete).toBe(true);
  });

  test("en la lista, recepción no ve el precio de compra ni los avisos de gestión", async () => {
    renderAppAs("recepcion", "/productos");
    expect(await screen.findByRole("link", { name: "Cera mate" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Precio de compra" })).toBeNull();
    expect(screen.queryByRole("button", { name: /sin precio de compra/i })).toBeNull();
  });

  test("el dueño sí ve el precio de compra en la lista", async () => {
    renderAppAs("owner", "/productos");
    expect(await screen.findByRole("link", { name: "Cera mate" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Precio de compra" })).toBeInTheDocument();
  });

  test("en la ficha, recepción ve el precio de venta pero no lo que deja", async () => {
    renderAppAs("recepcion", "/productos/prd_aceite");
    expect(await screen.findByRole("heading", { name: /Aceite de barba/ })).toBeInTheDocument();
    expect(screen.queryByText("Deja por unidad")).toBeNull();
    expect(screen.getByText("BR-ACE-030")).toBeInTheDocument();
  });
});

describe("contrato de productos (mock)", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(TOKEN, "acc_admin");
  });

  /* El cliente HTTP toma el token del puente que monta `AuthProvider`; un render lo deja puesto. */
  const withSession = async () => {
    renderApp("/productos");
    await screen.findByRole("heading", { name: "Productos" });
  };

  test("crear un producto lo deja activo solo en la sucursal donde se creó", async () => {
    await withSession();
    const created = await productsApi.create({ ...emptyProductInput("pcat_styling"), name: "Spray de mar", price: 21, cost: 9 }, "ma");
    expect(created.active).toBe(true);
    const elsewhere = await productsApi.get(created.id, "nc");
    expect(elsewhere.active).toBe(false);
  });

  test("dos productos no pueden compartir SKU", async () => {
    await withSession();
    await expect(productsApi.create({ ...emptyProductInput("pcat_styling"), name: "Otra cera", price: 18, sku: "ST-CER-100" }, "ma")).rejects.toMatchObject({ status: 422 });
  });

  test("desactivar un producto lo saca de lo que la caja puede cobrar", async () => {
    await withSession();
    const after = await productsApi.setActive("ma", ["prd_cera"], false);
    expect(after.items.find((item) => item.id === "prd_cera")?.active).toBe(false);
    expect(db.products.items.find((item) => item.id === "prd_cera")?.activeBranchIds).not.toContain("ma");
  });

  test("borrar una categoría manda sus productos a «Sin categoría»", async () => {
    await withSession();
    await productsApi.removeCategory("pcat_accesorios");
    const catalog = await productsApi.catalog("ma");
    expect(catalog.categories.some((category) => category.id === "pcat_accesorios")).toBe(false);
    expect(catalog.items.find((item) => item.id === "prd_toalla")?.categoryId).toBe("pcat_none");
  });
});
