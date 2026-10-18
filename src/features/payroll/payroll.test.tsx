import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { Route, Routes } from "react-router";

/* jsdom no tiene canvas: el lienzo de ECharts se sustituye por un hueco y la
   prueba mide lo que sí es texto —las cifras, los rótulos, la URL—. */
vi.mock("@/components/charts/EChart", () => ({
  EChart: ({ height }: { height?: number | string }) => <div data-testid="echart" style={{ height }} />,
}));
import { renderWithProviders, screen, userEvent, within } from "@/test/render";
import { db } from "@/mocks/db";
import { AccessProvider, buildAccess } from "@/features/access";
import type { TeamRole } from "@/features/team/types";
import { MyPayPage } from "./MyPayPage";
import { PayrollPage } from "./PayrollPage";
import { payrollApi } from "./api";
import { columnIdsFor, columnValue } from "./payrollHome";
import { countByPayout, summarizePayroll, toCsv } from "./payrollUtils";
import type { PayrollMember } from "./types";

const TOKEN = "mock-acc_admin-test";
/** Una semana pasada: sus citas ya están cobradas y no cambian con la hora. */
const PAST_FROM = "2026-09-21";
const PAST_TO = "2026-09-27";

function member(draft: Partial<PayrollMember> = {}): PayrollMember {
  return { memberId: "m1", name: "Andrés Beltrán", avatarUrl: null, payout: "commission", rules: null, rentBase: null, salaryBase: null, services: 10, serviceSales: 400, productSales: 0, serviceCommission: 180, productCommission: 0, tips: 40, salary: 0, rent: 0, deductions: 0, net: 220, lines: [], ...draft };
}

function renderApp(route: string) {
  db.sessions.set(TOKEN, "acc_admin");
  return renderWithProviders(
    <Routes>
      <Route path="/nomina" element={<PayrollPage />} />
    </Routes>,
    { route, token: TOKEN }
  );
}

describe("resumen de nómina", () => {
  const members = [member(), member({ memberId: "m2", payout: "rent", net: -300, serviceCommission: 0, tips: 20 }), member({ memberId: "m3", payout: "salary", net: 650, serviceCommission: 0, productCommission: 15, tips: 0 })];

  test("separa lo que se paga de lo que se cobra y suma comisiones y propinas", () => {
    const summary = summarizePayroll(members);
    expect(summary.toPay).toBe(870);
    expect(summary.toPayCount).toBe(2);
    expect(summary.toCollect).toBe(300);
    expect(summary.toCollectCount).toBe(1);
    expect(summary.commissions).toBe(195);
    expect(summary.tips).toBe(60);
  });

  test("cuenta a cada quien en su forma de pago", () => {
    expect(countByPayout(members)).toEqual({ commission: 1, rent: 1, salary: 1 });
  });

  test("cada forma de pago tiene sus columnas: a un barbero de renta no se le liquida comisión", () => {
    expect(columnIdsFor("rent")).not.toContain("serviceCommission");
    expect(columnIdsFor("rent")).toEqual(expect.arrayContaining(["rent", "deductions", "net"]));
    expect(columnIdsFor("salary")).toContain("salary");
    expect(columnValue(members[1], "net")).toBe(-300);
  });

  test("el CSV escapa comas y comillas y deja los números sin formato", () => {
    expect(toCsv(["Barbero", "Pago"], [["Peña, Tomás", 496.5], ['Dice "hola"', -10]])).toBe('Barbero,Pago\n"Peña, Tomás",496.5\n"Dice ""hola""",-10');
  });
});

describe("contrato de nómina (mock)", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(TOKEN, "acc_admin");
  });

  /* El cliente HTTP toma el token del puente que monta `AuthProvider`; un render lo deja puesto. */
  const withSession = async () => {
    renderApp(`/nomina?fecha=${PAST_FROM}`);
    await screen.findByRole("heading", { name: "Nómina" });
  };

  test("la comisión de cada servicio es su venta por la regla aplicada", async () => {
    await withSession();
    const { members } = await payrollApi.get({ branchId: "ma", from: PAST_FROM, to: PAST_TO });
    const commissioned = members.filter((item) => item.payout === "commission" && item.lines.length > 0);
    expect(commissioned.length).toBeGreaterThan(0);
    for (const item of commissioned) {
      for (const line of item.lines) expect(line.commission, line.appointmentId).toBeCloseTo((line.sale * (line.rate ?? 0)) / 100, 2);
      expect(item.net).toBeCloseTo(item.serviceCommission + item.productCommission + item.tips, 2);
    }
  });

  test("un barbero de renta paga su puesto por semana y una deducción por cada cliente que le puso la barbería", async () => {
    await withSession();
    const { members, weeks } = await payrollApi.get({ branchId: "ma", from: PAST_FROM, to: PAST_TO });
    expect(weeks).toBe(1);
    const renter = members.find((item) => item.payout === "rent");
    expect(renter).toBeDefined();
    expect(renter?.rent).toBe(renter?.rentBase);
    expect(renter?.serviceCommission).toBe(0);
    expect(renter?.deductions).toBeCloseTo(renter?.lines.reduce((sum, line) => sum + line.deduction, 0) ?? 0, 2);
    expect(renter?.net).toBeCloseTo((renter?.tips ?? 0) - (renter?.rent ?? 0) - (renter?.deductions ?? 0), 2);
  });

  test("las deducciones de la renta son un porcentaje de la venta, como las pide su ficha", async () => {
    await withSession();
    const { members } = await payrollApi.get({ branchId: "ma", from: PAST_FROM, to: PAST_TO });
    const renter = members.find((item) => item.payout === "rent")!;
    const payments = db.team.members.find((item) => item.id === renter.memberId)!.payments!;
    const percentOf = { walkIn: payments.walkInDeduction, noPreference: payments.noPreferenceDeduction, newClient: payments.newClientDeduction, recurring: 0, basic: 0 };
    for (const line of renter.lines) expect(line.deduction, line.appointmentId).toBeCloseTo((line.sale * percentOf[line.rule]) / 100, 2);
  });

  test("la base de la comisión es el precio del barbero, el mismo que se cobra", async () => {
    await withSession();
    const { members } = await payrollApi.get({ branchId: "ma", from: PAST_FROM, to: PAST_TO });
    const earner = members.find((item) => item.payout === "commission" && item.lines.length > 0)!;
    const overrides = db.team.members.find((item) => item.id === earner.memberId)!.services;
    const line = earner.lines[0];
    const appointment = db.calendar.appointments.find((item) => item.id === line.appointmentId)!;
    const expected = appointment.serviceIds.reduce((sum, id) => sum + (overrides.find((item) => item.serviceId === id)?.price ?? db.services.items.find((item) => item.id === id)!.price), 0);
    expect(line.sale).toBeCloseTo(expected, 2);
  });

  test("en escala, el tramo sale del ciclo de pago: el mismo en el día que en la semana", async () => {
    await withSession();
    const scaled = db.team.members.find((item) => item.compensation && item.role === "barbero-comision")!;
    db.team.members = db.team.members.map((item) => (item.id === scaled.id ? { ...item, compensation: { ...item.compensation!, type: "scale", scale: [{ from: 0, percent: 30 }, { from: 300, percent: 50 }] } } : item));
    const week = await payrollApi.get({ branchId: "ma", from: PAST_FROM, to: PAST_TO, memberId: scaled.id });
    const line = week.members[0]?.lines.at(-1);
    if (!line) return;
    const day = await payrollApi.get({ branchId: "ma", from: line.date.slice(0, 10), to: line.date.slice(0, 10), memberId: scaled.id });
    expect(day.members[0].lines.find((item) => item.appointmentId === line.appointmentId)?.rate).toBe(line.rate);
  });

  test("aprobar deja la nómina fija; pagada no se reabre; reabrir pide motivo", async () => {
    await withSession();
    const period = { branchId: "ma", from: PAST_FROM, to: PAST_TO };
    const before = await payrollApi.get(period);
    const run = await payrollApi.approve(period);
    expect(run.status).toBe("approved");
    // Una regla que cambia después ya no mueve lo aprobado.
    db.team.members = db.team.members.map((item) => (item.compensation ? { ...item, compensation: { ...item.compensation, basic: 99, recurring: 99, walkIn: 99, noPreference: 99, newClient: 99 } } : item));
    const frozen = await payrollApi.get(period);
    expect(frozen.run?.status).toBe("approved");
    expect(frozen.members.map((item) => item.net)).toEqual(before.members.map((item) => item.net));
    await expect(payrollApi.reopen(run.id, "no")).rejects.toMatchObject({ status: 422 });
    const paid = await payrollApi.pay(run.id, { method: "transfer", reference: "TRX-1" });
    expect(paid).toMatchObject({ status: "paid", method: "transfer", reference: "TRX-1" });
    await expect(payrollApi.reopen(run.id, "se pagó de más")).rejects.toMatchObject({ status: 409 });
  });

  test("un ajuste entra en el neto y no se puede tocar con el periodo aprobado", async () => {
    await withSession();
    const period = { branchId: "ma", from: PAST_FROM, to: PAST_TO };
    const before = await payrollApi.get(period);
    const target = before.members[0];
    await payrollApi.addAdjustment({ ...period, memberId: target.memberId, kind: "advance", amount: 50, note: "Adelanto del martes" });
    await payrollApi.addAdjustment({ ...period, memberId: target.memberId, kind: "bonus", amount: 20, note: "Meta de la semana" });
    const after = await payrollApi.get(period);
    const updated = after.members.find((item) => item.memberId === target.memberId)!;
    expect(updated.adjustmentsTotal).toBe(-30);
    expect(updated.net).toBeCloseTo(target.net - 30, 2);
    const run = await payrollApi.approve(period);
    await expect(payrollApi.addAdjustment({ ...period, memberId: target.memberId, kind: "bonus", amount: 5, note: "Otro bono" })).rejects.toMatchObject({ status: 409 });
    await payrollApi.reopen(run.id, "faltó un adelanto");
    expect((await payrollApi.get(period)).run).toBeNull();
  });

  test("el salario se cuenta por semanas del periodo", async () => {
    await withSession();
    const { members } = await payrollApi.get({ branchId: "ma", from: "2026-09-01", to: "2026-09-14" });
    const salaried = members.find((item) => item.payout === "salary");
    expect(salaried?.salary).toBe((salaried?.salaryBase ?? 0) * 2);
  });

  test("con `memberId` solo llega la nómina de esa persona", async () => {
    await withSession();
    const { members } = await payrollApi.get({ branchId: "ma", from: PAST_FROM, to: PAST_TO, memberId: "team-30" });
    expect(members.map((item) => item.memberId)).toEqual(["team-30"]);
    expect(members[0].payout).toBe("rent");
  });

  test("un rango al revés se rechaza", async () => {
    await withSession();
    await expect(payrollApi.get({ branchId: "ma", from: PAST_TO, to: PAST_FROM })).rejects.toMatchObject({ status: 422 });
  });
});

/** jsdom no trae IntersectionObserver y el centinela de «cargar al bajar» de la lista lo pide. */
class InertObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe("pantalla de nómina", () => {
  beforeAll(() => {
    vi.stubGlobal("IntersectionObserver", InertObserver);
  });
  beforeEach(() => {
    db.reset();
    db.sessions.set(TOKEN, "acc_admin");
  });

  test("la forma de pago de la URL elige la pestaña y lo que explica", async () => {
    renderApp(`/nomina?fecha=${PAST_FROM}&pago=rent`);
    expect(await screen.findByRole("heading", { name: "Nómina" })).toBeInTheDocument();
    expect(await screen.findByTestId("payroll-payout-hint")).toHaveTextContent(/paga su puesto por semana/i);
    expect(await screen.findByRole("button", { name: "Valeria Marín" })).toBeInTheDocument();
    expect(screen.getAllByText(/^Debe /).length).toBeGreaterThan(0);
  });

  test("abrir a un barbero enseña sus reglas y servicio por servicio", async () => {
    renderApp(`/nomina?fecha=${PAST_FROM}`);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Andrés Beltrán" }));
    const detail = await screen.findByTestId("payroll-detail");
    expect(within(detail).getByText("Cómo se le paga")).toBeInTheDocument();
    expect(within(detail).getByText(/Básica · 45%/)).toBeInTheDocument();
    expect(within(detail).getByText("Regla aplicada")).toBeInTheDocument();
  });
});

function renderMyPay(role: TeamRole, route = `/mi-pago?fecha=${PAST_FROM}`) {
  db.sessions.set(TOKEN, "acc_admin");
  return renderWithProviders(
    <AccessProvider value={buildAccess({ role })}>
      <Routes>
        <Route path="/mi-pago" element={<MyPayPage />} />
      </Routes>
    </AccessProvider>,
    { route, token: TOKEN }
  );
}

describe("el pago del propio barbero", () => {
  beforeAll(() => {
    vi.stubGlobal("IntersectionObserver", InertObserver);
  });
  beforeEach(() => {
    db.reset();
    db.sessions.set(TOKEN, "acc_admin");
  });

  test("«Lo que llevo»: el de comisión ve lo ganado, sus comisiones y sus propinas, solo de él", async () => {
    renderMyPay("barbero-comision");
    expect(await screen.findByRole("heading", { name: "Lo que llevo" })).toBeInTheDocument();
    const summary = await screen.findByRole("region", { name: "Resumen de tu pago" });
    expect(within(summary).getByText("Lo que llevas")).toBeInTheDocument();
    expect(within(summary).getByText("Comisión de servicios")).toBeInTheDocument();
    expect(within(summary).getByText("Comisión de productos")).toBeInTheDocument();
    expect(within(summary).getByText("Propinas")).toBeInTheDocument();
    expect(screen.getByText("Tus servicios del periodo")).toBeInTheDocument();
    expect(screen.queryByText("Valeria Marín")).toBeNull();
  });

  test("abrir la cuenta completa enseña sus reglas sin el enlace a Equipo", async () => {
    renderMyPay("barbero-comision");
    const user = userEvent.setup();
    await user.click(await screen.findByTestId("my-pay-detail"));
    const detail = await screen.findByTestId("payroll-detail");
    expect(within(detail).getByText(/Básica · 45%/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ver sus reglas en Equipo" })).toBeNull();
  });

  test("«Mi negocio»: el de renta ve ventas, renta y deducciones, y un neto negativo explicado", async () => {
    renderMyPay("barbero-renta");
    expect(await screen.findByRole("heading", { name: "Mi negocio" })).toBeInTheDocument();
    const summary = await screen.findByRole("region", { name: "Resumen de tu pago" });
    expect(within(summary).getByText("Tus ventas")).toBeInTheDocument();
    expect(within(summary).getByText("Para la barbería")).toBeInTheDocument();
    expect(within(summary).getByText(/^Debes /)).toBeInTheDocument();
    expect(within(summary).getByText("Se lo debes a la barbería")).toBeInTheDocument();
    expect(screen.getByTestId("my-pay-owes")).toHaveTextContent(/le debes .* a la barbería/i);
    expect(screen.getByText("Tus cuentas del periodo")).toBeInTheDocument();
  });
});
