import { beforeEach, describe, expect, test } from "vitest";
import { db } from "../db";
import { toE164 } from "./import";

const TOKEN = "mock-acc_admin-test";
const api = (path: string, init: RequestInit = {}) => fetch(`http://localhost/api${path}`, { ...init, headers: { "content-type": "application/json", authorization: `Bearer ${TOKEN}` } });
const post = (body: unknown) => api("/customers/import", { method: "POST", body: JSON.stringify(body) });

describe("importar clientes", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(TOKEN, "acc_admin");
  });

  test("el celular se lleva a E.164 con el indicativo de la sucursal", () => {
    expect(toE164("300 123 4567", "57")).toBe("+573001234567");
    expect(toE164("(617) 555-0100", "1")).toBe("+16175550100");
    expect(toE164("+57 300 123 4567", "1")).toBe("+573001234567");
    expect(toE164("12345", "1")).toBeNull();
  });

  test("revisar no crea; importar crea los buenos, rechaza repetidos e inválidos y se puede deshacer", async () => {
    const existing = db.calendar.clients.find((client) => client.id !== "cli_walkin")!;
    const rows = [
      { name: "Ana Ruiz", phone: "(617) 555-0199", email: "ana@x.com" },
      { name: "Ana Ruiz otra vez", phone: "617 555 0199" },
      { name: "", phone: "6175550198" },
      { name: "Ya existe", phone: existing.phone },
      { name: "Mal correo", phone: "6175550197", email: "no-es-correo" },
    ];
    const before = db.calendar.clients.length;
    const dry = await (await post({ branchId: "ma", rows, dryRun: true })).json();
    expect(dry).toMatchObject({ batchId: null, created: 1 });
    expect(dry.rejected.map((item: { reason: string }) => item.reason)).toEqual(["duplicate", "name", "duplicate", "email"]);
    expect(db.calendar.clients.length).toBe(before);

    const done = await (await post({ branchId: "ma", rows })).json();
    expect(done.created).toBe(1);
    expect(db.calendar.clients.some((client) => client.phone === "+16175550199")).toBe(true);
    const undone = await (await api(`/customers/import/${done.batchId}`, { method: "DELETE" })).json();
    expect(undone).toEqual({ removed: 1, kept: 0 });
    expect(db.calendar.clients.length).toBe(before);
  });
});
