import { beforeAll, describe, expect, test, vi } from "vitest";
import { Route, Routes } from "react-router";

/* jsdom no tiene canvas: el lienzo de ECharts se sustituye por un hueco y la
   prueba mide lo que sí es texto —los recuentos, los rótulos, la URL—. */
vi.mock("@/components/charts/EChart", () => ({
  EChart: ({ height }: { height?: number | string }) => <div data-testid="echart" style={{ height }} />,
}));
import { renderWithProviders, screen, userEvent, within } from "@/test/render";
import { db } from "@/mocks/db";
import { CustomerProfilePage } from "./CustomerProfilePage";
import { CustomersPage } from "./CustomersPage";
import { CUSTOMER_ALERTS, countBySegment, customerPulse, parseSegment } from "./customersHome";
import { daysToBirthday, formatAgo, maskPhone } from "./customersUtils";
import { customerInputSchema, splitName, type Customer } from "./types";

const TOKEN = "mock-acc_admin-test";

function customer(draft: Partial<Customer> = {}): Customer {
  return { id: "c1", name: "Marcela Gómez", phone: "+57 3001234567", email: "marcela@correo.com", branchId: "ma", segment: "frequent", blocked: false, ltv: 400, visits: 8, cancellations: 0, noShows: 0, lastVisitAt: "2026-09-20T10:00:00.000Z", visitEveryDays: 14, preferredBarber: null, birthDate: null, createdAt: "2026-01-01T10:00:00.000Z", medicalNotes: 0, ...draft };
}

function renderApp(route: string) {
  db.sessions.set(TOKEN, "acc_admin");
  return renderWithProviders(
    <Routes>
      <Route path="/clientes" element={<CustomersPage />} />
      <Route path="/clientes/:id" element={<CustomerProfilePage />} />
    </Routes>,
    { route, token: TOKEN }
  );
}

describe("ayudas de clientes", () => {
  test("el celular se enseña a medias: prefijo y los cuatro últimos", () => {
    expect(maskPhone("+57 3001234567")).toBe("+57 ••• ••4567");
    expect(maskPhone("+573001234567")).toBe("+57 ••• ••4567");
    expect(maskPhone("123")).toBe("123");
  });

  test("el cumpleaños cuenta los días hasta el próximo, no hasta el de este año", () => {
    const now = new Date(2026, 9, 1);
    expect(daysToBirthday("1990-10-04", now)).toBe(3);
    expect(daysToBirthday("1990-10-01", now)).toBe(0);
    expect(daysToBirthday("1990-09-30", now)).toBe(364);
    expect(daysToBirthday(null, now)).toBeNull();
  });

  test("«hace…» sube de unidad para que el número se lea", () => {
    const now = new Date("2026-10-01T12:00:00.000Z");
    const format = (value: number, unit: Intl.RelativeTimeFormatUnit) => `${value} ${unit}`;
    expect(formatAgo("2026-09-28T12:00:00.000Z", format, now)).toBe("-3 day");
    expect(formatAgo("2026-09-01T12:00:00.000Z", format, now)).toBe("-4 week");
    expect(formatAgo("2026-04-01T12:00:00.000Z", format, now)).toBe("-6 month");
  });

  test("un segmento desconocido en la URL cae en «todos»", () => {
    expect(parseSegment("vip")).toBe("vip");
    expect(parseSegment("inventado")).toBe("todos");
    expect(parseSegment(null)).toBe("todos");
  });

  test("el nombre se parte en nombre y apellidos para editar", () => {
    expect(splitName("Marcela Gómez Ruiz")).toEqual({ firstName: "Marcela", lastName: "Gómez Ruiz" });
  });

  test("el formulario exige nombre, apellido, celular y correo", () => {
    const result = customerInputSchema.safeParse({ firstName: "", lastName: "", phone: "+57", email: "x", country: "", state: "", city: "", address: "", zipcode: "", birthDate: "", onlineOnly: false });
    expect(result.success).toBe(false);
    const fields = result.success ? [] : result.error.issues.map((issue) => issue.path[0]);
    expect(fields).toEqual(expect.arrayContaining(["firstName", "lastName", "phone", "email"]));
  });
});

describe("pulso y avisos de la lista", () => {
  const rows = [customer(), customer({ id: "c2", segment: "new", visits: 1, ltv: 40 }), customer({ id: "c3", segment: "atRisk", visits: 5, ltv: 160 }), customer({ id: "c4", segment: "new", visits: 0, ltv: 0, lastVisitAt: null })];

  test("los recuentos por segmento suman las filas", () => {
    const counts = countBySegment(rows);
    expect(counts.new).toBe(2);
    expect(counts.atRisk).toBe(1);
    expect(Object.values(counts).reduce((sum, value) => sum + value, 0)).toBe(rows.length);
  });

  test("el pulso sale de las filas: quién volvió, cuánto deja y quién se va", () => {
    const pulse = customerPulse(rows);
    expect(pulse.visited).toBe(3);
    expect(pulse.returningRate).toBeCloseTo(66.7, 1);
    expect(pulse.avgLtv).toBe(200);
    expect(pulse.drifting).toBe(1);
    expect(pulse.driftingRate).toBe(25);
  });

  test("un cliente perdido o bloqueado no dispara avisos de cumpleaños ni de faltas", () => {
    const gone = customer({ segment: "lost", cancellations: 5, noShows: 2 });
    const matched = CUSTOMER_ALERTS.filter((alert) => alert.matches(gone)).map((alert) => alert.id);
    expect(matched).toEqual([]);
    const flaky = customer({ cancellations: 2, noShows: 1 });
    expect(CUSTOMER_ALERTS.find((alert) => alert.id === "unreliable")?.matches(flaky)).toBe(true);
  });
});

/** jsdom no trae IntersectionObserver y el centinela de «cargar al bajar» de la lista lo pide. */
class InertObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe("pantallas de clientes", () => {
  beforeAll(() => {
    vi.stubGlobal("IntersectionObserver", InertObserver);
  });

  test("la lista carga, dice qué significa el segmento elegido y filtra por él", async () => {
    renderApp("/clientes");
    const user = userEvent.setup();
    expect(await screen.findByRole("heading", { name: "Clientes" })).toBeInTheDocument();
    const segments = await screen.findByRole("radiogroup", { name: /filtrar los clientes por segmento/i });
    expect(screen.getByTestId("customers-segment-hint")).toHaveTextContent(/todos los clientes/i);

    await user.click(within(segments).getByRole("button", { name: /vip/i }));
    expect(screen.getByTestId("customers-segment-hint")).toHaveTextContent(/los que más vienen/i);
    expect(screen.getAllByRole("link").length).toBeGreaterThan(0);
  });

  test("la ficha junta resumen y datos, y avisa de lo médico arriba", async () => {
    const withMedical = db.calendar.clients.find((client) => client.notes.some((note) => note.kind !== "note"));
    expect(withMedical).toBeDefined();
    renderApp(`/clientes/${withMedical?.id}`);
    expect(await screen.findByRole("heading", { name: new RegExp(withMedical?.name ?? "") })).toBeInTheDocument();
    expect(screen.getByTestId("customer-medical")).toBeInTheDocument();
    expect(screen.getByText("Datos del cliente")).toBeInTheDocument();
    expect(screen.getByText("Cómo cumple sus citas")).toBeInTheDocument();
  });

  test("un cliente que no existe ofrece volver a la lista", async () => {
    renderApp("/clientes/no-existe");
    expect(await screen.findByText("No encontramos a este cliente")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /volver a clientes/i })).toBeInTheDocument();
  });
});
