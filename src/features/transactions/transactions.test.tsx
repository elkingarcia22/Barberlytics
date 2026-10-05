import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { Route, Routes } from "react-router";

/* jsdom no tiene canvas: el lienzo de ECharts se sustituye por un hueco y la
   prueba mide lo que sí es texto —las cifras, los rótulos, la URL—. */
vi.mock("@/components/charts/EChart", () => ({
  EChart: ({ height }: { height?: number | string }) => <div data-testid="echart" style={{ height }} />,
}));
import { renderWithProviders, screen, userEvent, waitFor, within } from "@/test/render";
import { db } from "@/mocks/db";
import { AccessProvider, buildAccess } from "@/features/access";
import type { TeamRole } from "@/features/team/types";
import { TransactionsPage } from "./TransactionsPage";
import { accountsFor, showsPeriodTotals } from "./transactionsAccess";
import { transactionsApi } from "./api";
import { countByStatus, summarize } from "./transactionsHome";
import type { Account } from "./types";

const TOKEN = "mock-acc_admin-test";
/** Un día pasado: sus citas ya están cobradas, canceladas o sin presentarse, y no cambian con la hora. */
const PAST_DAY = "2026-09-22";

function account(draft: Partial<Account> = {}): Account {
  return { id: "a1", kind: "appointment", date: "2026-09-22T10:00:00", invoice: "00000001", client: { id: "c1", name: "Marcela Gómez", phone: "+57 3001234567" }, barber: "Andrés Beltrán", barberId: "team-04", openedBy: "Lucía Bernal", chargedBy: "Andrés Beltrán", status: "paid", appointmentStatus: "paid", source: "internal", lines: [{ kind: "service", name: "Fade", qty: 1, amount: 45 }], subtotal: 45, tax: 0, tip: 5, total: 45, collected: 45, refunded: 0, balance: 0, method: "card", paidAt: "2026-09-22T15:45:00.000Z", reference: "ref", appointmentId: "a1", durationMin: 45, ...draft };
}

function renderApp(route: string) {
  db.sessions.set(TOKEN, "acc_admin");
  return renderWithProviders(
    <Routes>
      <Route path="/transacciones" element={<TransactionsPage />} />
    </Routes>,
    { route, token: TOKEN }
  );
}

function renderAs(role: TeamRole, route: string) {
  db.sessions.set(TOKEN, "acc_admin");
  return renderWithProviders(
    <AccessProvider value={buildAccess({ role })}>
      <Routes>
        <Route path="/transacciones" element={<TransactionsPage />} />
      </Routes>
    </AccessProvider>,
    { route, token: TOKEN }
  );
}

describe("resumen de transacciones", () => {
  const accounts = [
    account(),
    account({ id: "a2", status: "open", appointmentStatus: "scheduled", invoice: null, total: 30, collected: 0, balance: 30, tip: 0, method: null }),
    account({ id: "a3", status: "void", appointmentStatus: "cancelled", invoice: null, total: 95, collected: 0, tip: 0, method: null }),
    account({ id: "a4", status: "refunded", total: 25, collected: 0, refunded: 25, tip: 0 }),
  ];

  test("lo anulado no se factura y lo devuelto no cuenta como cobrado", () => {
    const summary = summarize(accounts);
    expect(summary.billed).toBe(100);
    expect(summary.billedCount).toBe(3);
    expect(summary.collected).toBe(45);
    expect(summary.collectedRate).toBe(45);
    expect(summary.receivable).toBe(30);
    expect(summary.openCount).toBe(1);
    expect(summary.tips).toBe(5);
    expect(summary.refunded).toBe(25);
    expect(summary.refundedCount).toBe(1);
  });

  test("un periodo vacío da ceros, no divisiones entre cero", () => {
    const summary = summarize([]);
    expect(summary.billed).toBe(0);
    expect(summary.collectedRate).toBe(0);
  });

  test("los recuentos por estado suman las cuentas", () => {
    const counts = countByStatus(accounts);
    expect(counts).toEqual({ open: 1, paid: 1, refunded: 1, void: 1 });
  });
});

/** jsdom no trae IntersectionObserver y el centinela de «cargar al bajar» de la lista lo pide. */
class InertObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe("pantalla de transacciones", () => {
  beforeAll(() => {
    vi.stubGlobal("IntersectionObserver", InertObserver);
  });
  beforeEach(() => {
    db.reset();
    db.sessions.set(TOKEN, "acc_admin");
  });

  test("carga las cuentas del día de la URL y el estado filtra la lista", async () => {
    renderApp(`/transacciones?fecha=${PAST_DAY}`);
    const user = userEvent.setup();
    expect(await screen.findByRole("heading", { name: "Transacciones" })).toBeInTheDocument();
    const statuses = await screen.findByRole("radiogroup", { name: /filtrar las cuentas por estado/i });
    expect(screen.getByTestId("transactions-status-hint")).toHaveTextContent(/todas las cuentas/i);

    await user.click(within(statuses).getByRole("button", { name: /anulada/i }));
    expect(screen.getByTestId("transactions-status-hint")).toHaveTextContent(/no se factura/i);
    /* En un día pasado no queda nada por cobrar: tras filtrar solo se ven anuladas. */
    await waitFor(() => expect(screen.queryAllByText("Cobrada", { selector: "[data-slot=badge]" })).toHaveLength(0));
  });

  test("abrir una cuenta enseña su detalle y el atajo a la cita", async () => {
    renderApp(`/transacciones?fecha=${PAST_DAY}&estado=paid`);
    const user = userEvent.setup();
    const openers = await screen.findAllByRole("button", { name: /ver la cuenta del/i });
    await user.click(openers[0]);
    const detail = await screen.findByTestId("account-detail");
    expect(within(detail).getByText("Qué se cobra")).toBeInTheDocument();
    expect(within(detail).getByText("Ya entró a caja.")).toBeInTheDocument();
    expect(screen.getByTestId("account-see-appointment")).toBeInTheDocument();
  });
});

describe("contrato de transacciones (mock)", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(TOKEN, "acc_admin");
  });

  /* El cliente HTTP toma el token del puente que monta `AuthProvider`; un render lo deja puesto. */
  const withSession = async () => {
    renderApp(`/transacciones?fecha=${PAST_DAY}`);
    await screen.findByRole("heading", { name: "Transacciones" });
  };

  test("cada cita del rango es una cuenta, de la más reciente a la más antigua", async () => {
    await withSession();
    const { items } = await transactionsApi.list({ branchId: "ma", from: PAST_DAY, to: PAST_DAY });
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.date.startsWith(PAST_DAY))).toBe(true);
    expect([...items].sort((a, b) => b.date.localeCompare(a.date)).map((item) => item.id)).toEqual(items.map((item) => item.id));
  });

  test("las cuentas cuadran: solo lo cobrado tiene factura y solo lo abierto tiene saldo", async () => {
    await withSession();
    const { items } = await transactionsApi.list({ branchId: "ma", from: PAST_DAY, to: PAST_DAY });
    for (const item of items) {
      expect(item.total, item.id).toBe(item.subtotal + item.tax);
      expect(item.collected, item.id).toBe(item.status === "paid" ? item.total : 0);
      expect(item.balance, item.id).toBe(item.status === "open" ? item.total : 0);
      expect(item.invoice === null, item.id).toBe(item.status === "open" || item.status === "void");
    }
  });

  test("una venta de mostrador también es una cuenta, sin cliente ni cita", async () => {
    await withSession();
    const today = new Date();
    const day = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    db.calendar.sales = [{ id: "sale_test", branchId: "ma", items: [{ productId: "prd_cera", qty: 2 }], method: "cash", total: 36, paidAt: today.toISOString() }];
    const { items } = await transactionsApi.list({ branchId: "ma", from: day, to: day });
    const sale = items.find((item) => item.id === "sale_test");
    expect(sale).toMatchObject({ kind: "sale", status: "paid", client: null, appointmentId: null, total: 36, collected: 36 });
    expect(sale?.lines).toEqual([{ kind: "product", name: "Cera mate", qty: 2, amount: 36 }]);
  });

  test("un rango al revés o demasiado largo se rechaza", async () => {
    await withSession();
    await expect(transactionsApi.list({ branchId: "ma", from: "2026-09-10", to: "2026-09-01" })).rejects.toMatchObject({ status: 422 });
    await expect(transactionsApi.list({ branchId: "ma", from: "2026-01-01", to: "2026-09-01" })).rejects.toMatchObject({ status: 422 });
  });
});

describe("transacciones según el rol", () => {
  beforeAll(() => {
    vi.stubGlobal("IntersectionObserver", InertObserver);
  });
  beforeEach(() => {
    db.reset();
  });

  test("el barbero se queda con las cuentas que atendió; las ventas de mostrador no son suyas", () => {
    const accounts = [account(), account({ id: "a2", barberId: "team-30" }), account({ id: "s1", kind: "sale", barber: null, barberId: null })];
    expect(accountsFor(buildAccess({ role: "barbero-renta" }), accounts).map((item) => item.id)).toEqual(["a2"]);
    expect(accountsFor(buildAccess({ role: "barbero-renta", member: null }), accounts)).toEqual([]);
    expect(accountsFor(buildAccess({ role: "recepcion" }), accounts)).toHaveLength(3);
  });

  test("los totales del periodo son de quien lleva los números: recepción no los ve", () => {
    expect(showsPeriodTotals(buildAccess({ role: "owner" }))).toBe(true);
    expect(showsPeriodTotals(buildAccess({ role: "admin" }))).toBe(true);
    expect(showsPeriodTotals(buildAccess({ role: "barbero-renta" }))).toBe(true);
    expect(showsPeriodTotals(buildAccess({ role: "recepcion" }))).toBe(false);
  });

  test("el barbero de renta solo ve sus cuentas del día", async () => {
    renderAs("barbero-renta", `/transacciones?fecha=${PAST_DAY}`);
    const statuses = await screen.findByRole("radiogroup", { name: /filtrar las cuentas por estado/i });
    const { items } = await transactionsApi.list({ branchId: "ma", from: PAST_DAY, to: PAST_DAY });
    const own = items.filter((item) => item.barberId === "team-30");
    expect(own.length).toBeGreaterThan(0);
    expect(own.length).toBeLessThan(items.length);
    expect(within(statuses).getByRole("button", { name: /todas/i })).toHaveTextContent(new RegExp(`Todas\\D*${own.length}$`));
    expect(screen.getByText(/tus cuentas del periodo/i)).toBeInTheDocument();
  });

  test("recepción ve las cuentas pero no los totales del periodo", async () => {
    renderAs("recepcion", `/transacciones?fecha=${PAST_DAY}`);
    expect(await screen.findByRole("radiogroup", { name: /filtrar las cuentas por estado/i })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Resumen del periodo" })).not.toBeInTheDocument();
    expect(screen.queryByText("Facturado")).not.toBeInTheDocument();
  });

  test("el dueño sí ve los totales", async () => {
    renderAs("owner", `/transacciones?fecha=${PAST_DAY}`);
    expect(await screen.findByRole("region", { name: "Resumen del periodo" })).toBeInTheDocument();
  });
});
