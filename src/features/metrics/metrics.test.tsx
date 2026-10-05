import { describe, expect, test, vi } from "vitest";
import { Route, Routes, useLocation } from "react-router";

/* jsdom no tiene canvas: el lienzo de ECharts se sustituye por un hueco y la
   prueba mide lo que sí es texto —las cifras, los rótulos, la URL—. */
vi.mock("@/components/charts/EChart", () => ({
  EChart: ({ height }: { height?: number | string }) => <div data-testid="echart" style={{ height }} />,
}));
import { renderWithProviders, screen, waitFor, within, userEvent } from "@/test/render";
import { db } from "@/mocks/db";
import { RequireAuth } from "@/features/auth";
import { AccessProvider, buildAccess } from "@/features/access";
import type { TeamRole } from "@/features/team/types";
import { buildBusinessMetrics, resolveMetricsBarber } from "@/mocks/metrics";
import { buildBarbersMetrics, buildCustomersMetrics, buildInsightsMetrics } from "@/mocks/metricsTabs";
import { MetricsPage } from "./MetricsPage";

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

function mount(route = "/metricas", role: TeamRole = "owner") {
  db.sessions.set("mock-acc_admin-test", "acc_admin");
  return renderWithProviders(
    <AccessProvider value={buildAccess({ role })}>
      <Routes>
        <Route element={<RequireAuth />}>
          <Route
            path="/metricas"
            element={
              <>
                <MetricsPage />
                <LocationProbe />
              </>
            }
          />
        </Route>
      </Routes>
    </AccessProvider>,
    { route, token: "mock-acc_admin-test" }
  );
}

describe("Métricas", () => {
  test("pinta el pulso del periodo con las cifras del backend", async () => {
    mount("/metricas?period=week&date=2026-09-21");
    const expected = buildBusinessMetrics({ granularity: "week", date: "2026-09-21", barberId: "all" });

    const pulse = await screen.findByRole("region", { name: "Indicadores del periodo" });
    expect(within(pulse).getByText("Ventas")).toBeInTheDocument();
    expect(within(pulse).getByText(`${expected.appointments.total}`)).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Periodo" })).toHaveTextContent("Semana");
  });

  test("cambiar el grano y el barbero se escribe en la URL", async () => {
    mount("/metricas");
    const user = userEvent.setup();
    await screen.findByRole("region", { name: "Indicadores del periodo" });

    await user.click(screen.getByRole("radio", { name: "Día" }));
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("period=day"));

    await user.click(screen.getByTestId("metrics-barber"));
    await user.click(await screen.findByRole("option", { name: "Valeria Marín" }));
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("barber=b6"));
  });

  test("cada pestaña trae su tablero con el mismo periodo", async () => {
    mount("/metricas?tab=customers&period=week&date=2026-09-21");
    expect(await screen.findByText("Citas por tipo de cliente")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Periodo" })).toHaveTextContent("Semana");

    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: "Barberos" }));
    expect(await screen.findByText("Neto por barbero")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("tab=barbers");
    expect(screen.getByTestId("location")).toHaveTextContent("period=week");
  });

  test("la pestaña de IA diagnostica tres meses y no lleva periodo", async () => {
    mount("/metricas?tab=insights");
    expect(await screen.findByText("Salud del negocio")).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Periodo" })).toBeNull();
    expect(screen.getByText("Sugerencias")).toBeInTheDocument();
  });
});

describe("Métricas de un barbero", () => {
  test("el de comisión ve sus tres pestañas, sin selector de barbero ni IA", async () => {
    mount("/metricas?period=week&date=2026-09-21", "barbero-comision");
    const pulse = await screen.findByRole("region", { name: "Indicadores del periodo" });
    const own = buildBusinessMetrics({ granularity: "week", date: "2026-09-21", barberId: "team-04" });
    expect(within(pulse).getByText(`${own.appointments.total}`)).toBeInTheDocument();
    expect(screen.queryByTestId("metrics-barber")).toBeNull();
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Negocio", "Clientes", "Barberos"]);
  });

  test("un enlace con otro barbero o con la IA no le abre nada ajeno", async () => {
    mount("/metricas?tab=insights&barber=b6&period=week&date=2026-09-21", "barbero-renta");
    const pulse = await screen.findByRole("region", { name: "Indicadores del periodo" });
    const own = buildBusinessMetrics({ granularity: "week", date: "2026-09-21", barberId: "team-30" });
    expect(within(pulse).getByText(`${own.appointments.total}`)).toBeInTheDocument();
    expect(screen.queryByText("Salud del negocio")).toBeNull();
    expect(screen.getByRole("tab", { name: "Marketing" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "IA" })).toBeNull();
  });

  test("en Barberos ve solo su fila, sin el neto del equipo ni el reparto", async () => {
    mount("/metricas?tab=barbers&period=week&date=2026-09-21", "barbero-comision");
    expect(await screen.findByText("Tu neto")).toBeInTheDocument();
    expect(screen.queryByText("Neto del equipo")).toBeNull();
    expect(screen.queryByText("Neto por barbero")).toBeNull();
    expect(screen.getByRole("cell", { name: "Andrés Beltrán" })).toBeInTheDocument();
    expect(screen.queryByRole("cell", { name: "Valeria Marín" })).toBeNull();
  });

  test("el id del equipo se traduce al de las métricas o se simula aparte", () => {
    expect(resolveMetricsBarber("team-04")).toEqual({ id: "b4", name: "Andrés Beltrán" });
    expect(resolveMetricsBarber("team-30")).toEqual({ id: "team-30", name: "Paola Zuluaga" });
    expect(resolveMetricsBarber("team-01")).toBeNull();
    const team = buildBusinessMetrics({ granularity: "week", date: "2026-09-21", barberId: "all" });
    const paola = buildBusinessMetrics({ granularity: "week", date: "2026-09-21", barberId: "team-30" });
    expect(paola.appointments.total).toBeLessThan(team.appointments.total);
  });
});

describe("las otras pestañas del backend simulado", () => {
  test("clientes cuadra sus repartos con el total", () => {
    const data = buildCustomersMetrics({ granularity: "month", date: "2026-09-15", barberId: "all" });
    const byType = data.byClientType.reduce((sum, row) => sum + row.count, 0);
    expect(byType).toBe(data.clients);
    expect(data.newVsReturning.new + data.newVsReturning.returning).toBe(data.clients);
    expect(data.barberPreference.withPreference + data.barberPreference.noPreference).toBe(data.clients);
  });

  test("el neto del equipo es la suma de sus barberos", () => {
    const data = buildBarbersMetrics({ granularity: "month", date: "2026-09-15", barberId: "all" });
    const net = data.barbers.reduce((sum, row) => sum + row.net, 0);
    expect(Math.round(net)).toBe(Math.round(data.kpis.totalNet.value));
    expect(data.barbers.every((row) => row.occupancy >= 0 && row.occupancy <= 100)).toBe(true);
  });

  test("el diagnóstico de IA da una salud entre 0 y 100 y sugerencias con acción", () => {
    const data = buildInsightsMetrics(new Date(2026, 8, 28));
    expect(data.health.score).toBeGreaterThanOrEqual(0);
    expect(data.health.score).toBeLessThanOrEqual(100);
    expect(data.capacity.rows).toHaveLength(7);
    expect(data.capacity.rows.every((row) => row.values.length === data.capacity.hours.length)).toBe(true);
    expect(data.suggestions.length).toBeGreaterThan(2);
    expect(data.suggestions.every((item) => item.action.length > 0)).toBe(true);
  });
});

describe("buildBusinessMetrics", () => {
  test("es determinista y cuadra sus totales", () => {
    const a = buildBusinessMetrics({ granularity: "month", date: "2026-09-15", barberId: "all" });
    const b = buildBusinessMetrics({ granularity: "month", date: "2026-09-15", barberId: "all" });
    expect(a).toEqual(b);
    expect(a.period).toEqual({ granularity: "month", from: "2026-09-01", to: "2026-09-30" });
    expect(a.previous).toEqual({ from: "2026-08-01", to: "2026-08-31" });
    const byStatus = a.appointments.byStatus.reduce((sum, row) => sum + row.count, 0);
    expect(byStatus).toBe(a.appointments.total);
    expect(a.appointments.byHour.every((row) => row.hour >= 7 && row.hour <= 21)).toBe(true);
  });

  test("un barbero ve una parte de las citas del equipo", () => {
    const team = buildBusinessMetrics({ granularity: "week", date: "2026-09-21", barberId: "all" });
    const one = buildBusinessMetrics({ granularity: "week", date: "2026-09-21", barberId: "b6" });
    expect(one.appointments.total).toBeGreaterThan(0);
    expect(one.appointments.total).toBeLessThan(team.appointments.total);
    expect(one.barbers).toEqual(team.barbers);
  });
});
