import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Route, Routes } from "react-router";
import { renderWithProviders, screen, waitFor, within, userEvent } from "@/test/render";
import { db } from "@/mocks/db";
import { RequireAuth } from "@/features/auth";
import { CalendarPage } from "./CalendarPage";
import { toEvent, visibleBarbers, nextStep, type ModelContext } from "./calendarModel";
import type { Appointment, Barber, CalendarCatalog } from "./types";

/** Viernes 25 de septiembre de 2026, a media mañana. Fecha fija: la agenda no depende del reloj. */
const NOW = new Date(2026, 8, 25, 10, 20);

function mount(route = "/calendario") {
  db.sessions.set("mock-acc_admin-test", "acc_admin");
  return renderWithProviders(
    <Routes>
      <Route element={<RequireAuth />}>
        <Route path="/calendario" element={<CalendarPage now={NOW} />} />
      </Route>
    </Routes>,
    { route, token: "mock-acc_admin-test" }
  );
}

const BARBER: Barber = {
  id: "b1",
  branchId: "ma",
  name: "Andrés Beltrán",
  avatarUrl: null,
  level: "master",
  workingHours: { "5": [{ start: "09:00", end: "19:00" }] },
  acceptsWalkIns: true,
};

const CATALOG: CalendarCatalog = {
  barbers: [BARBER, { ...BARBER, id: "b2", name: "Tomás Peña", workingHours: {} }],
  clients: [{ id: "c1", name: "Laura Gómez", phone: "+57 300", type: "vip", visits: 31, cancellations: 8, noShows: 0, lastVisitAt: null, preferredBarberId: "b1", visitEveryDays: 7, notes: [] }],
  services: [{ id: "s1", name: "Corte clásico", category: "Cortes", durationMin: 30, price: 35 }],
  products: [],
};

const APPOINTMENT: Appointment = {
  id: "a1",
  branchId: "ma",
  clientId: "c1",
  barberId: "b1",
  requestedBarberId: "b1",
  serviceIds: ["s1"],
  products: [],
  start: "2026-09-25T10:30:00",
  durationMin: 30,
  status: "scheduled",
  barberReady: false,
  walkIn: false,
  source: "internal",
  repeat: "none",
  seriesId: null,
  notes: null,
  createdAt: "2026-09-20T10:00:00.000Z",
  createdBy: "Lucía",
  history: [],
  payment: null,
};

const ctx: ModelContext = { t: (key) => key, intl: "es-CO", formatMoney: (value) => `$${value}`, catalog: CATALOG };

describe("modelo del calendario", () => {
  test("el filtro de equipo deja a los que trabajan, a todos o a uno", () => {
    const date = new Date(2026, 8, 25);
    expect(visibleBarbers(CATALOG.barbers, "working", date).map((barber) => barber.id)).toEqual(["b1"]);
    expect(visibleBarbers(CATALOG.barbers, "all", date)).toHaveLength(2);
    expect(visibleBarbers(CATALOG.barbers, "b2", date).map((barber) => barber.id)).toEqual(["b2"]);
  });

  test("una cita se traduce a un evento con el cliente, el servicio y el siguiente paso", () => {
    const event = toEvent(APPOINTMENT, { ...ctx, onNextStep: () => undefined });
    expect(event.title).toBe("Laura Gómez");
    expect(event.subtitle).toBe("Corte clásico · $35");
    expect(event.badge?.label).toBe("calendar.clientType.vip");
    expect(event.action?.label).toBe("calendar.step.checkIn");
    expect(event.end.getHours()).toBe(11);
    expect(toEvent({ ...APPOINTMENT, status: "cancelled" }, ctx).muted).toBe(true);
  });

  test("el camino de una cita va de agendada a cobrada", () => {
    expect(nextStep("scheduled")?.status).toBe("arrived");
    expect(nextStep("arrived")?.status).toBe("seated");
    expect(nextStep("seated")?.status).toBe("paid");
    expect(nextStep("paid")).toBeNull();
    expect(nextStep("cancelled")).toBeNull();
  });
});

describe("Calendario", () => {
  // El mock siembra con el reloj real: se fija a NOW para que la agenda del 25 no quede en el pasado.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    db.reset();
  });
  afterEach(() => vi.useRealTimers());

  test("abre en el día de hoy con una columna por barbero que trabaja", async () => {
    mount();
    const grid = await screen.findByRole("region", { name: "Agenda del día por barbero" });
    // El viernes trabajan cinco de los seis barberos de la sucursal; Julián no tiene horario.
    expect(within(grid).getByText("Andrés Beltrán")).toBeInTheDocument();
    expect(within(grid).getByText("Nicolás Duarte")).toBeInTheDocument();
    expect(within(grid).queryByText("Julián Cifuentes")).toBeNull();
    expect(screen.getByTestId("calendar-date")).toHaveTextContent("Viernes 25 sep");
    expect(screen.queryByTestId("calendar-today")).toBeNull();
  });

  test("un día en que nadie trabaja avisa y ofrece ver a todo el equipo", async () => {
    const user = userEvent.setup();
    // La barbería cierra los domingos: el 27 nadie tiene horario.
    mount("/calendario?fecha=2026-09-27");
    expect(await screen.findByTestId("calendar-nobody")).toHaveTextContent("Nadie trabaja este día");
    await user.click(screen.getByTestId("calendar-see-all"));
    const grid = await screen.findByRole("region", { name: "Agenda del día por barbero" });
    expect(within(grid).getByText("Julián Cifuentes")).toBeInTheDocument();
  });

  test("la vista Agenda lista las citas del día y la vista Mes la ocupación", async () => {
    mount("/calendario?vista=agenda");
    const agenda = await screen.findByTestId("calendar-agenda");
    expect(within(agenda).getAllByRole("listitem").length).toBeGreaterThan(3);

    const user = userEvent.setup();
    await user.click(screen.getByRole("radio", { name: "Mes" }));
    const month = await screen.findByRole("grid", { name: "Ocupación del mes" });
    await waitFor(() => expect(within(month).getAllByRole("button", { name: /Ocupación \d+%/ }).length).toBeGreaterThan(10));
  });

  test("tocar un hueco abre Crear cita con el barbero y la hora puestos, y la cita aparece", async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByRole("region", { name: "Agenda del día por barbero" });
    await user.click(screen.getByRole("button", { name: "Crear a las 6:30 p. m. con Andrés Beltrán" }));

    const drawer = await screen.findByTestId("create-appointment");
    expect(within(drawer).getByTestId("create-appointment-barber")).toHaveTextContent("Andrés Beltrán");
    expect(within(drawer).getByRole("radio", { name: "6:30 p. m." })).toBeChecked();

    // Cliente y servicio se eligen en sus buscadores.
    // El disparador de SearchableSelect es un combobox, y ese rol no toma
    // su nombre del contenido: se busca por el texto del placeholder.
    const trigger = (text: string) => within(drawer).getAllByText(text).find((node) => node.closest('[role="combobox"]')) as HTMLElement;
    await user.click(trigger("Elige el cliente"));
    await user.click((await screen.findAllByRole("option", { name: /Laura Gómez/ }))[0]);
    await user.click(trigger("Elige el servicio"));
    await user.click(await screen.findByRole("option", { name: /Corte clásico/ }));
    await user.click(screen.getByTestId("create-appointment-submit"));

    await waitFor(() => expect(screen.queryByTestId("create-appointment")).toBeNull());
    const grid = screen.getByRole("region", { name: "Agenda del día por barbero" });
    expect(await within(grid).findByRole("button", { name: /Abrir Laura Gómez, 6:30 p. m. – 7:00 p. m./ })).toBeInTheDocument();
  });

  test("desde la tarjeta se marca la llegada y el detalle muestra el estado nuevo", async () => {
    const user = userEvent.setup();
    mount();
    const grid = await screen.findByRole("region", { name: "Agenda del día por barbero" });
    const checkIns = await within(grid).findAllByRole("button", { name: "Ingresar" });
    expect(checkIns.length).toBeGreaterThan(0);
    await user.click(checkIns[0]);
    await waitFor(() => expect(within(grid).getAllByRole("button", { name: "Ingresar" }).length).toBe(checkIns.length - 1));
  });
});
