import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { Route, Routes } from "react-router";

/* jsdom no tiene canvas: el lienzo de ECharts se sustituye por un hueco. */
vi.mock("@/components/charts/EChart", () => ({
  EChart: ({ height }: { height?: number | string }) => <div data-testid="echart" style={{ height }} />,
}));
import { renderWithProviders, screen, within } from "@/test/render";
import { db } from "@/mocks/db";
import { appEs } from "@/app/i18n";
import { AccessProvider, buildAccess } from "@/features/access";
import type { TeamRole } from "./types";
import { MemberProfilePage } from "./MemberProfilePage";
import { TeamHomePage } from "./TeamHomePage";
import { creatableRoles, managesRole, memberAccess } from "./teamAccess";
import type { TeamMember } from "./types";

const TOKEN = "mock-acc_admin-test";
const ROLES_ARIA = appEs["team.rolesAria"];

function renderAs(role: TeamRole, ui: React.ReactElement, route = "/") {
  db.sessions.set(TOKEN, "acc_admin");
  return renderWithProviders(<AccessProvider value={buildAccess({ role })}>{ui}</AccessProvider>, { route, token: TOKEN });
}

/** Lo justo de una ficha para decidir qué se enseña. */
const person = (id: string, role: TeamRole): TeamMember => ({ id, role, isAlsoBarber: false }) as TeamMember;

describe("quién gestiona a quién en el equipo", () => {
  test("solo el dueño crea dueños y administradores; el admin, los roles de debajo", () => {
    expect(creatableRoles(buildAccess({ role: "owner" }))).toEqual(["owner", "admin", "recepcion", "barbero-comision", "barbero-renta"]);
    expect(creatableRoles(buildAccess({ role: "admin" }))).toEqual(["recepcion", "barbero-comision", "barbero-renta"]);
    expect(managesRole(buildAccess({ role: "admin" }), "admin")).toBe(false);
  });

  test("el barbero por comisión no crea a nadie", () => {
    expect(creatableRoles(buildAccess({ role: "barbero-comision" }))).toEqual([]);
  });

  test("a un colega el barbero le ve solo el perfil público, sin editar ni inactivar", () => {
    const viewer = memberAccess(buildAccess({ role: "barbero-comision" }), person("team-05", "barbero-comision"));
    expect(viewer.seesPrivate).toBe(false);
    expect(viewer.tabs).toEqual(["profile"]);
    expect(viewer.canEdit("profile")).toBe(false);
    expect(viewer.canChangeStatus).toBe(false);
    expect(viewer.canDelete).toBe(false);
  });

  test("su propia ficha la ve entera, con su compensación, pero en lectura", () => {
    const viewer = memberAccess(buildAccess({ role: "barbero-comision" }), person("team-04", "barbero-comision"));
    expect(viewer.isSelf).toBe(true);
    expect(viewer.tabs).toContain("compensation");
    expect(viewer.tabs.every((tab) => !viewer.canEdit(tab))).toBe(true);
  });

  test("el admin gestiona a un barbero sin ver su dinero, y no toca al dueño", () => {
    const admin = buildAccess({ role: "admin" });
    const barber = memberAccess(admin, person("team-05", "barbero-comision"));
    expect(barber.tabs).not.toContain("compensation");
    expect(barber.canEdit("profile")).toBe(true);
    expect(barber.canEdit("permissions")).toBe(true);
    const owner = memberAccess(admin, person("team-01", "owner"));
    expect(owner.canEdit("profile")).toBe(false);
    expect(owner.canDelete).toBe(false);
  });
});

/** jsdom no trae IntersectionObserver y el centinela de «cargar al bajar» de la lista lo pide. */
class InertObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe("pantallas de equipo según el rol", () => {
  beforeAll(() => {
    vi.stubGlobal("IntersectionObserver", InertObserver);
  });
  beforeEach(() => {
    db.reset();
  });

  test("el barbero por comisión ve a sus colegas sin correo, sin gerentes y sin pulso", async () => {
    renderAs("barbero-comision", <TeamHomePage />);
    expect(await screen.findByRole("link", { name: "Nicolás Duarte" })).toBeInTheDocument();
    // Su propio correo sí; el de un colega no.
    expect(screen.getByText("andres.beltran@barberia.com")).toBeInTheDocument();
    expect(screen.queryByText("nicolas.duarte@barberia.com")).toBeNull();
    // Sin gerentes: ni el reparto por rol ni sus filas.
    expect(within(screen.getByRole("radiogroup", { name: ROLES_ARIA })).queryByRole("button", { name: /Owner/ })).toBeNull();
    expect(screen.queryByRole("link", { name: "Carolina Vargas" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Métricas del equipo" })).toBeNull();
  });

  test("el dueño ve los correos y el reparto completo", async () => {
    renderAs("owner", <TeamHomePage />);
    expect(await screen.findByText("nicolas.duarte@barberia.com")).toBeInTheDocument();
    expect(within(screen.getByRole("radiogroup", { name: ROLES_ARIA })).getByRole("button", { name: /Owner/ })).toBeInTheDocument();
  });

  test("la ficha de un colega no enseña teléfono, correo ni código", async () => {
    renderAs(
      "barbero-comision",
      <Routes>
        <Route path="/usuarios/miembros/:id" element={<MemberProfilePage />} />
      </Routes>,
      "/usuarios/miembros/team-05?editar=1"
    );
    expect(await screen.findByText("Sucursales")).toBeInTheDocument();
    expect(screen.queryByText("Teléfono")).toBeNull();
    expect(screen.queryByText("Código")).toBeNull();
    // `?editar=1` no abre la edición a quien no puede editar.
    expect(screen.queryByTestId("member-editor")).toBeNull();
  });
});
