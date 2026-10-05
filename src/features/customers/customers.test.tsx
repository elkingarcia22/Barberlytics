import { beforeAll, describe, expect, test, vi } from "vitest";
import { Route, Routes } from "react-router";

/* jsdom no tiene canvas: el lienzo de ECharts se sustituye por un hueco y la
   prueba mide lo que sí es texto —los recuentos, los rótulos, la URL—. */
vi.mock("@/components/charts/EChart", () => ({
  EChart: ({ height }: { height?: number | string }) => <div data-testid="echart" style={{ height }} />,
}));
import { renderWithProviders, screen, userEvent, within } from "@/test/render";
import { db } from "@/mocks/db";
import { AccessProvider, buildAccess } from "@/features/access";
import type { TeamRole } from "@/features/team/types";
import { customersApi } from "./api";
import { customerPermissions, isOwnCustomer } from "./customerAccess";
import { customerListActions } from "./customerActions";
import { CustomerProfilePage } from "./CustomerProfilePage";
import { CustomersPage } from "./CustomersPage";
import { CUSTOMER_ALERTS, countBySegment, customerColumns, customersCsvRows, customerPulse, parseSegment } from "./customersHome";
import { daysToBirthday, formatAgo, maskPhone } from "./customersUtils";
import { customerInputSchema, splitName, type Customer } from "./types";

const TOKEN = "mock-acc_admin-test";

function customer(draft: Partial<Customer> = {}): Customer {
  return { id: "c1", name: "Marcela Gómez", phone: "+57 3001234567", email: "marcela@correo.com", branchId: "ma", segment: "frequent", blocked: false, ltv: 400, visits: 8, cancellations: 0, noShows: 0, lastVisitAt: "2026-09-20T10:00:00.000Z", visitEveryDays: 14, preferredBarber: null, preferredBarberId: null, barberIds: [], birthDate: null, createdAt: "2026-01-01T10:00:00.000Z", medicalNotes: 0, ...draft };
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

function renderAs(role: TeamRole, route: string) {
  db.sessions.set(TOKEN, "acc_admin");
  return renderWithProviders(
    <AccessProvider value={buildAccess({ role })}>
      <Routes>
        <Route path="/clientes" element={<CustomersPage />} />
        <Route path="/clientes/:id" element={<CustomerProfilePage />} />
      </Routes>
    </AccessProvider>,
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

describe("clientes según el rol", () => {
  const ANDRES = "team-04";
  const noop = () => undefined;
  const handlers = { create: noop, exportList: noop, importList: noop, open: noop, book: noop, note: noop, block: noop, remove: noop };
  const actionIds = (role: TeamRole) => customerListActions((key) => key, handlers, false, customerPermissions(buildAccess({ role }))).map((action) => action.id);
  const t = ((key: string) => key) as Parameters<typeof customerColumns>[0];

  beforeAll(() => {
    vi.stubGlobal("IntersectionObserver", InertObserver);
  });

  test("un cliente es suyo si lo prefiere o tiene cita con él en el último año", () => {
    expect(isOwnCustomer(customer({ preferredBarberId: ANDRES }), ANDRES)).toBe(true);
    expect(isOwnCustomer(customer({ barberIds: ["team-05", ANDRES] }), ANDRES)).toBe(true);
    expect(isOwnCustomer(customer({ preferredBarberId: "team-05", barberIds: ["team-05"] }), ANDRES)).toBe(false);
  });

  test("cada acción sale de la matriz: el barbero por comisión crea, pero no descarga, bloquea ni borra", () => {
    expect(actionIds("barbero-comision")).toEqual(["create", "open", "book", "note"]);
    expect(actionIds("recepcion")).toEqual(["create", "import", "open", "book", "note", "block"]);
    expect(actionIds("barbero-renta")).toEqual(expect.arrayContaining(["import", "export", "block", "delete"]));
    expect(actionIds("owner")).toEqual(["create", "import", "export", "open", "book", "note", "block", "delete"]);
    expect(actionIds("admin")).not.toContain("export");
  });

  test("sin información del cliente no hay contacto; recepción no ve cifras", () => {
    const barber = customerPermissions(buildAccess({ role: "barbero-comision" }));
    const desk = customerPermissions(buildAccess({ role: "recepcion" }));
    expect(barber).toMatchObject({ scope: "own", showContact: false, showMoney: true, canExport: false });
    expect(desk).toMatchObject({ scope: "all", showContact: true, showMoney: false, canDelete: false });
    expect(customerColumns(t, { showMoney: false, showContact: true, showBarber: true }).map((column) => column.id)).not.toContain("ltv");
    const barberColumns = customerColumns(t, { showMoney: true, showContact: false, showBarber: false }).map((column) => column.id);
    expect(barberColumns).not.toContain("email");
    expect(barberColumns).not.toContain("barber");
    const csv = customersCsvRows(t, [customer()], { showContact: false, showMoney: false });
    expect(csv.rows[0]).not.toContain("+57 3001234567");
    expect(csv.rows[0]).not.toContain(400);
  });

  test("el barbero ve solo sus clientes y sin teléfonos", async () => {
    renderAs("barbero-comision", "/clientes");
    const segments = await screen.findByRole("radiogroup", { name: /filtrar los clientes por segmento/i });
    const { items } = await customersApi.list();
    const own = items.filter((item) => isOwnCustomer(item, ANDRES));
    expect(own.length).toBeGreaterThan(0);
    expect(own.length).toBeLessThan(items.length);
    expect(within(segments).getByRole("button", { name: /^todos/i })).toHaveTextContent(new RegExp(`Todos\\D*${own.length}$`));
    expect(screen.queryByText(/•••/)).not.toBeInTheDocument();
  });

  test("recepción ve la lista sin el valor de vida", async () => {
    renderAs("recepcion", "/clientes");
    expect(await screen.findByTestId("customers-pulse")).toBeInTheDocument();
    expect(screen.queryByText("Valor de vida promedio")).not.toBeInTheDocument();
    expect(screen.queryByText("Valor de vida")).not.toBeInTheDocument();
  });

  test("un barbero no abre la ficha de un cliente que no es suyo", async () => {
    const other = db.calendar.clients.find((client) => client.preferredBarberId !== null && client.preferredBarberId !== ANDRES);
    expect(other).toBeDefined();
    renderAs("barbero-comision", `/clientes/${other?.id}`);
    expect(await screen.findByText("Este cliente no es tuyo")).toBeInTheDocument();
    expect(screen.queryByText("Datos del cliente")).not.toBeInTheDocument();
  });

  test("su propio cliente sí, pero sin contacto ni notas médicas", async () => {
    const mine = db.calendar.clients.find((client) => client.preferredBarberId === ANDRES && client.notes.some((note) => note.kind !== "note"));
    expect(mine).toBeDefined();
    renderAs("barbero-comision", `/clientes/${mine?.id}`);
    expect(await screen.findByText("Datos del cliente")).toBeInTheDocument();
    expect(screen.queryByTestId("customer-medical")).not.toBeInTheDocument();
    expect(screen.queryByText(/•••/)).not.toBeInTheDocument();
    expect(screen.queryByTestId("customer-edit-contact")).not.toBeInTheDocument();
  });
});
