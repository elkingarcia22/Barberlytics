import { describe, expect, test } from "vitest";
import { renderWithProviders } from "@/test/render";
import { db } from "@/mocks/db";
import { customersApi } from "./api";
import { EMPTY_CUSTOMER_INPUT } from "./types";

function signIn() {
  db.sessions.set("mock-acc_admin-dup", "acc_admin");
  renderWithProviders(<div />, { token: "mock-acc_admin-dup" });
}

describe("el celular identifica al cliente", () => {
  test("el mismo celular en otro formato es un duplicado y dice de quién es", async () => {
    signIn();
    const existing = db.calendar.clients.find((client) => client.phone.startsWith("+57"))!;
    const local = existing.phone.replace(/\D/g, "").slice(2);
    await expect(customersApi.create({ ...EMPTY_CUSTOMER_INPUT, firstName: "Otro", lastName: "Cliente", phone: local }, "ma")).rejects.toMatchObject({ status: 422, details: { duplicateOf: { id: existing.id, name: existing.name } } });
  });

  test("el correo es opcional", async () => {
    signIn();
    const created = await customersApi.create({ ...EMPTY_CUSTOMER_INPUT, firstName: "Nuevo", lastName: "Sin Correo", phone: "+57 311 999 0001" }, "ma");
    expect(created).toMatchObject({ name: "Nuevo Sin Correo", email: "" });
  });
});
