import { describe, expect, test } from "vitest";
import { parseMemberList, roleFrom } from "./memberImport";

describe("cargar miembros", () => {
  test("el rol escrito a mano se entiende en español e inglés", () => {
    expect(roleFrom("Barbero")).toBe("barbero-comision");
    expect(roleFrom("barbero de renta")).toBe("barbero-renta");
    expect(roleFrom("Booth rent")).toBe("barbero-renta");
    expect(roleFrom("Recepción")).toBe("recepcion");
    expect(roleFrom("Gerente")).toBeNull();
  });

  test("con encabezado en cualquier orden, separado por punto y coma o tabulaciones", () => {
    const parsed = parseMemberList("Correo;Nombre;Apellido;Celular;Rol\nmateo@correo.com;Mateo;Ríos;3001112233;barbero\nsara@correo.com;Sara;Gil;3004445566;Recepción");
    expect(parsed.rows).toEqual([
      { firstName: "Mateo", lastName: "Ríos", phone: "3001112233", email: "mateo@correo.com", role: "barbero-comision" },
      { firstName: "Sara", lastName: "Gil", phone: "3004445566", email: "sara@correo.com", role: "recepcion" },
    ]);
    const tabs = parseMemberList("Mateo\tRíos\t3001112233\tmateo@correo.com\trenta");
    expect(tabs.rows[0]).toMatchObject({ firstName: "Mateo", role: "barbero-renta" });
  });

  test("lo que falta o el rol que no se entiende se señala con su fila", () => {
    const parsed = parseMemberList("Ana,Paz,3009990000,ana@correo.com,gerente\nLuis,,,luis@correo.com,barbero\n\nEva,Mar,3001234000,eva@correo.com,barbero");
    expect(parsed.rows.map((row) => row.firstName)).toEqual(["Eva"]);
    expect(parsed.problems).toEqual([
      { row: 1, reason: "role" },
      { row: 2, reason: "missing" },
    ]);
  });
});
