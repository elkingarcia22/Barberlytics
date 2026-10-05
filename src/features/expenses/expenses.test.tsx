import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { Route, Routes } from "react-router";

/* jsdom no tiene canvas: el lienzo de ECharts se sustituye por un hueco y la
   prueba mide lo que sí es texto —las cifras, los rótulos, la URL—. */
vi.mock("@/components/charts/EChart", () => ({
  EChart: ({ height }: { height?: number | string }) => <div data-testid="echart" style={{ height }} />,
}));
import { renderWithProviders, screen, userEvent, waitFor } from "@/test/render";
import { db } from "@/mocks/db";
import { AccessProvider, buildAccess } from "@/features/access";
import type { TeamRole } from "@/features/team/types";
import { ExpenseFormDrawer } from "./ExpenseFormDrawer";
import { ExpensesPage } from "./ExpensesPage";
import { expensesApi } from "./api";
import { ALL, parseKind } from "./expensesHome";
import { monthlyEquivalent, summarizeExpenses } from "./expensesUtils";
import { emptyExpenseInput, expenseInputSchema, type Expense } from "./types";

const TOKEN = "mock-acc_admin-test";
const NOW = new Date(2026, 9, 1, 12);

function expense(draft: Partial<Expense> = {}): Expense {
  return { id: "e1", branchId: "ma", ownerMemberId: null, kind: "fixed", name: "Renta", amount: 1200, frequency: "monthly", description: "", createdAt: new Date(2026, 3, 1).toISOString(), ...draft };
}

function renderApp(route: string, role: TeamRole = "owner") {
  db.sessions.set(TOKEN, "acc_admin");
  return renderWithProviders(
    <AccessProvider value={buildAccess({ role })}>
      <Routes>
        <Route path="/gastos" element={<ExpensesPage />} />
      </Routes>
    </AccessProvider>,
    { route, token: TOKEN }
  );
}

describe("cuentas de gastos", () => {
  test("un gasto fijo se lleva a «por mes» según su frecuencia", () => {
    expect(monthlyEquivalent({ kind: "fixed", amount: 120, frequency: "weekly" })).toBe(520);
    expect(monthlyEquivalent({ kind: "fixed", amount: 90, frequency: "biweekly" })).toBe(195);
    expect(monthlyEquivalent({ kind: "fixed", amount: 1200, frequency: "monthly" })).toBe(1200);
    expect(monthlyEquivalent({ kind: "fixed", amount: 240, frequency: "quarterly" })).toBe(80);
    expect(monthlyEquivalent({ kind: "fixed", amount: 600, frequency: "semiannual" })).toBe(100);
    expect(monthlyEquivalent({ kind: "fixed", amount: 1800, frequency: "annual" })).toBe(150);
  });

  test("un gasto variable no tiene equivalente mensual", () => {
    expect(monthlyEquivalent({ kind: "variable", amount: 300, frequency: null })).toBeNull();
  });

  test("el mes suma los fijos llevados a un mes y solo los variables de este mes", () => {
    const summary = summarizeExpenses(
      [
        expense(),
        expense({ id: "e2", amount: 1800, frequency: "annual" }),
        expense({ id: "e3", kind: "variable", frequency: null, amount: 200, createdAt: new Date(2026, 9, 1, 9).toISOString() }),
        expense({ id: "e4", kind: "variable", frequency: null, amount: 70, createdAt: new Date(2026, 8, 15).toISOString() }),
        expense({ id: "e5", kind: "variable", frequency: null, amount: 999, createdAt: new Date(2025, 9, 1).toISOString() }),
      ],
      NOW
    );
    expect(summary.fixedMonthly).toBe(1350);
    expect(summary.fixedYearly).toBe(16200);
    expect(summary.fixedCount).toBe(2);
    expect(summary.variableThisMonth).toBe(200);
    expect(summary.variableThisMonthCount).toBe(1);
    expect(summary.variableLastMonth).toBe(70);
    expect(summary.monthTotal).toBe(1550);
    expect(summary.fixedShare).toBeCloseTo(87.1, 1);
  });

  test("sin gastos el resumen da ceros, no divisiones entre cero", () => {
    const summary = summarizeExpenses([], NOW);
    expect(summary.monthTotal).toBe(0);
    expect(summary.fixedShare).toBe(0);
  });

  test("un tipo desconocido en la URL cae en «todo»", () => {
    expect(parseKind("fixed")).toBe("fixed");
    expect(parseKind("inventado")).toBe(ALL);
  });

  test("un fijo necesita frecuencia y cualquier gasto, un valor mayor que cero", () => {
    const noFrequency = expenseInputSchema.safeParse({ ...emptyExpenseInput("fixed"), name: "Renta", amount: 100, frequency: null });
    expect(noFrequency.success ? [] : noFrequency.error.issues.map((issue) => issue.path[0])).toContain("frequency");
    const zero = expenseInputSchema.safeParse({ ...emptyExpenseInput("variable"), name: "Compra", amount: 0 });
    expect(zero.success).toBe(false);
    expect(expenseInputSchema.safeParse({ ...emptyExpenseInput("variable"), name: "Compra", amount: 40 }).success).toBe(true);
  });
});

/** jsdom no trae IntersectionObserver y el centinela de «cargar al bajar» de la lista lo pide. */
class InertObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe("pantalla de gastos", () => {
  beforeAll(() => {
    vi.stubGlobal("IntersectionObserver", InertObserver);
  });
  beforeEach(() => {
    db.reset();
    db.sessions.set(TOKEN, "acc_admin");
  });

  test("lista fijos y variables juntos y el selector los separa", async () => {
    renderApp("/gastos");
    const user = userEvent.setup();
    expect(await screen.findByRole("heading", { name: "Gastos" })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Limpieza" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publicidad en redes" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /variables/i }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Limpieza" })).toBeNull());
    expect(screen.getByRole("button", { name: "Publicidad en redes" })).toBeInTheDocument();
  });

  test("solo se ven los gastos de la sucursal activa", async () => {
    renderApp("/gastos");
    expect(await screen.findByRole("button", { name: "Limpieza" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Letrero nuevo" })).toBeNull();
  });

  /* La barra de acciones vive en el marco de la aplicación, que aquí no se monta: el formulario se prueba suelto. */
  const renderForm = (kind: "fixed" | "variable", onOpenChange = vi.fn()) => {
    db.sessions.set(TOKEN, "acc_admin");
    renderWithProviders(<ExpenseFormDrawer open onOpenChange={onOpenChange} kind={kind} branchId="ma" />, { token: TOKEN });
    return onOpenChange;
  };

  test("registrar un gasto variable lo guarda en la sucursal y cierra el panel", async () => {
    const onOpenChange = renderForm("variable");
    const user = userEvent.setup();
    await user.type(await screen.findByTestId("expense-form-name"), "Cambio de bombillos");
    await user.type(screen.getByTestId("expense-form-amount"), "45");
    await user.click(screen.getByTestId("expense-form-submit"));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(db.expenses.find((item) => item.name === "Cambio de bombillos")).toMatchObject({ kind: "variable", amount: 45, frequency: null, branchId: "ma" });
  });

  test("el formulario no deja registrar sin nombre ni valor", async () => {
    const onOpenChange = renderForm("fixed");
    const user = userEvent.setup();
    const before = db.expenses.length;
    await user.click(await screen.findByTestId("expense-form-submit"));
    expect(await screen.findByText("Escribe el nombre del gasto.")).toBeInTheDocument();
    expect(screen.getByText("Escribe un valor mayor que cero.")).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(db.expenses).toHaveLength(before);
  });
});

describe("contrato de gastos (mock)", () => {
  beforeAll(() => {
    vi.stubGlobal("IntersectionObserver", InertObserver);
  });
  beforeEach(() => {
    db.reset();
    db.sessions.set(TOKEN, "acc_admin");
  });

  /* El cliente HTTP toma el token del puente que monta `AuthProvider`; un render lo deja puesto. */
  const withSession = async () => {
    renderApp("/gastos");
    await screen.findByRole("heading", { name: "Gastos" });
  };

  test("editar no cambia el tipo del gasto aunque se pida", async () => {
    await withSession();
    const { items } = await expensesApi.list("ma");
    const fixed = items.find((item) => item.kind === "fixed");
    expect(fixed).toBeDefined();
    const updated = await expensesApi.update(fixed?.id ?? "", { kind: "variable", name: "Renta nueva", amount: 3300, frequency: "monthly", description: "" });
    expect(updated).toMatchObject({ kind: "fixed", name: "Renta nueva", amount: 3300, frequency: "monthly" });
  });

  test("borrar un gasto lo quita de la sucursal", async () => {
    await withSession();
    const { items } = await expensesApi.list("ma");
    await expensesApi.remove(items[0].id);
    const after = await expensesApi.list("ma");
    expect(after.items).toHaveLength(items.length - 1);
  });
});

describe("gastos por rol", () => {
  beforeAll(() => {
    vi.stubGlobal("IntersectionObserver", InertObserver);
  });
  beforeEach(() => {
    db.reset();
    db.sessions.set(TOKEN, "acc_admin");
  });

  test("el barbero de renta solo ve sus gastos, no los de la barbería", async () => {
    renderApp("/gastos", "barbero-renta");
    expect(await screen.findByRole("button", { name: "Máquina de corte inalámbrica" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cuchillas y navajas" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Limpieza" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Renta del local" })).toBeNull();
    expect(screen.getByText(/Lo que compras para tu silla/)).toBeInTheDocument();
  });

  test("la lista de la barbería no trae los gastos de un barbero de renta", async () => {
    renderApp("/gastos");
    expect(await screen.findByRole("button", { name: "Limpieza" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Máquina de corte inalámbrica" })).toBeNull();
  });

  test("lo que registra el barbero de renta queda a su nombre", async () => {
    renderWithProviders(<ExpenseFormDrawer open onOpenChange={vi.fn()} kind="variable" branchId="ma" ownerMemberId="team-30" />, { token: TOKEN });
    const user = userEvent.setup();
    await user.type(await screen.findByTestId("expense-form-name"), "Capa de corte");
    await user.type(screen.getByTestId("expense-form-amount"), "25");
    await user.click(screen.getByTestId("expense-form-submit"));
    await waitFor(() => expect(db.expenses.find((item) => item.name === "Capa de corte")).toMatchObject({ ownerMemberId: "team-30", branchId: "ma" }));
    const own = await expensesApi.list("ma", "team-30");
    expect(own.items.every((item) => item.ownerMemberId === "team-30")).toBe(true);
    const shop = await expensesApi.list("ma");
    expect(shop.items.some((item) => item.name === "Capa de corte")).toBe(false);
  });
});
