import { beforeEach, describe, expect, test } from "vitest";
import { db } from "../db";

const OWNER = "mock-acc_admin-team";
const ADMIN = "mock-acc_manager-team";
const BARBER = "mock-acc_barber-team";
const RENTER = "mock-acc_renter-team";
const STEP_UP = "stepup-team";

const call = (token: string, path: string, init: RequestInit & { stepUp?: boolean } = {}) =>
  fetch(`http://localhost/api${path}`, { ...init, headers: { "content-type": "application/json", authorization: `Bearer ${token}`, ...(init.stepUp ? { "x-step-up": STEP_UP } : {}) } });
const post = (body: unknown) => ({ method: "POST", body: JSON.stringify(body) });
const patch = (body: unknown) => ({ method: "PATCH", body: JSON.stringify(body) });

describe("equipo: permisos en el servidor y acciones en lote", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(OWNER, "acc_admin");
    db.sessions.set(ADMIN, "acc_manager");
    db.sessions.set(BARBER, "acc_barber");
    db.sessions.set(RENTER, "acc_renter");
    db.stepUps.set(STEP_UP, { accountId: "acc_admin", expiresAt: Date.now() + 60_000 } as never);
  });

  test("la cuenta bancaria sale enmascarada; el número completo pide confirmar la identidad", async () => {
    db.team.members = db.team.members.map((item) => (item.id === "team-30" ? { ...item, payments: { ...item.payments!, bankName: "Bancolombia", accountNumber: "12345678901" } } : item));
    const listed = await (await call(OWNER, "/team/members?branchId=ma&all=true")).json();
    expect(listed.items.find((item: { id: string }) => item.id === "team-30").payments.accountNumber).toBe("•••• 8901");
    expect((await (await call(OWNER, "/team/members/team-30")).json()).payments.accountNumber).toBe("•••• 8901");
    expect((await call(OWNER, "/team/members/team-30/bank")).status).toBe(403);
    expect(await (await call(OWNER, "/team/members/team-30/bank", { stepUp: true })).json()).toEqual({ bankName: "Bancolombia", accountNumber: "12345678901" });
    // Un colega no la ve ni con código.
    expect((await call(BARBER, "/team/members/team-30/bank")).status).toBe(403);
    // Guardar la pestaña sin tocar la cuenta la conserva; cambiarla pide confirmar la identidad.
    const masked = { rentBase: 100, walkInDeduction: 0, newClientDeduction: 0, noPreferenceDeduction: 0, bankName: "Bancolombia", accountNumber: "•••• 8901" };
    expect((await call(OWNER, "/team/members/team-30", patch({ payments: masked }))).ok).toBe(true);
    expect(db.team.members.find((item) => item.id === "team-30")?.payments?.accountNumber).toBe("12345678901");
    expect((await call(OWNER, "/team/members/team-30", patch({ payments: { ...masked, accountNumber: "999 888 777" } }))).status).toBe(403);
    expect((await call(OWNER, "/team/members/team-30", { ...patch({ payments: { ...masked, accountNumber: "999 888 777" } }), stepUp: true })).ok).toBe(true);
    expect(db.team.members.find((item) => item.id === "team-30")?.payments?.accountNumber).toBe("999888777");
  });

  test("cada quien edita cómo se presenta en su ficha; lo demás y las fichas ajenas, no", async () => {
    const own = await call(BARBER, "/team/members/team-04", patch({ description: "Fades y barba", instagram: "@andres" }));
    expect(own.ok).toBe(true);
    expect(db.team.members.find((item) => item.id === "team-04")).toMatchObject({ description: "Fades y barba", instagram: "@andres" });
    // Mandar el nivel igual que estaba no estorba; cambiarlo, sí.
    const levelId = db.team.members.find((item) => item.id === "team-04")!.levelId;
    expect((await call(BARBER, "/team/members/team-04", patch({ description: "Fades", levelId }))).ok).toBe(true);
    expect((await call(BARBER, "/team/members/team-04", patch({ levelId: "otro" }))).status).toBe(403);
    expect((await call(BARBER, "/team/members/team-04", patch({ status: "inactive" }))).status).toBe(403);
    expect((await call(BARBER, "/team/members/team-30", patch({ description: "x" }))).status).toBe(403);
    // Un colega no ve el contacto ni el código del otro.
    expect(await (await call(BARBER, "/team/members/team-30")).json()).toMatchObject({ phone: "", email: "", code: "", payments: null });
    // El administrador no toca al dueño.
    expect((await call(ADMIN, "/team/members/team-01", patch({ description: "x" }))).status).toBe(403);
  });

  test("recordar la invitación: solo a invitados y una vez al día", async () => {
    const first = await (await call(OWNER, "/team/members/remind", post({ ids: ["team-09", "team-04"] }))).json();
    expect(first).toMatchObject({ sent: 1, skipped: [{ id: "team-04", reason: "notInvited" }] });
    const again = await (await call(OWNER, "/team/members/remind", post({ ids: ["team-09"] }))).json();
    expect(again).toMatchObject({ sent: 0, skipped: [{ id: "team-09", reason: "recent" }] });
    expect((await (await call(BARBER, "/team/members/remind", post({ ids: ["team-15"] }))).json()).skipped[0].reason).toBe("forbidden");
  });

  test("desactivar en lote: sale de la fila y de «sin preferencia», avisa sus citas por venir; a sí mismo no", async () => {
    const result = await (await call(OWNER, "/team/members/deactivate", post({ ids: ["team-04", "team-01"] }))).json();
    expect(result.deactivated).toEqual([expect.objectContaining({ id: "team-04", upcoming: expect.any(Number) })]);
    expect(result.skipped).toEqual([expect.objectContaining({ id: "team-01", reason: "self" })]);
    expect(db.team.members.find((item) => item.id === "team-04")).toMatchObject({ status: "inactive", deactivatedAt: expect.any(String) });
    const order = db.team.orders.find((item) => item.branchId === "ma")!;
    expect(order.walkIn.find((entry) => entry.memberId === "team-04")?.enabled).toBe(false);
    expect((await (await call(BARBER, "/team/members/deactivate", post({ ids: ["team-30"] }))).json()).skipped[0].reason).toBe("forbidden");
  });

  test("cargar miembros: entran invitados; lo repetido o inválido vuelve con su fila", async () => {
    const result = await (
      await call(OWNER, "/team/members/import", post({
        branchId: "ma",
        items: [
          { firstName: "Mateo", lastName: "Ríos", phone: "+573001112233", email: "mateo@correo.com", role: "barbero-comision" },
          { firstName: "Sara", lastName: "Gil", phone: "+573004445566", email: "sara@correo.com", role: "recepcion" },
          { firstName: "Otro", lastName: "Dueño", phone: "+573007778899", email: "duenio@correo.com", role: "owner" },
          { firstName: "Mateo", lastName: "Copia", phone: "+57 300 111 2233", email: "copia@correo.com", role: "barbero-renta" },
          { firstName: "X", lastName: "", phone: "1", email: "malo", role: "recepcion" },
        ],
      }))
    ).json();
    expect(result.created.map((item: { name: string }) => item.name)).toEqual(["Mateo Ríos", "Sara Gil"]);
    expect(result.rejected.map((item: { row: number }) => item.row)).toEqual([3, 4, 5]);
    const mateo = db.team.members.find((item) => item.email === "mateo@correo.com")!;
    expect(mateo).toMatchObject({ status: "invited", homeBranchId: "ma", levelId: expect.any(String) });
    expect(db.team.orders.find((item) => item.branchId === "ma")!.calendar).toContain(mateo.id);
    // Un barbero no carga gente.
    // Recién cargado ya recibió su invitación: hoy no se le recuerda.
    expect((await (await call(OWNER, "/team/members/remind", post({ ids: [mateo.id] }))).json()).skipped[0].reason).toBe("recent");
    expect((await (await call(BARBER, "/team/members/import", post({ items: [{ firstName: "Ana", lastName: "Paz", phone: "+573009990000", email: "ana@correo.com", role: "recepcion" }] }))).json()).created).toEqual([]);
  });
});
